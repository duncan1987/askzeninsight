import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'
import { sendCancellationEmail } from '@/lib/email'
import { USAGE_LIMITS } from '@/lib/usage-limits'

export const runtime = 'nodejs'

/**
 * Calculate refund amount for 48h-7day cancellations
 *
 * Formula:
 * refundAmount = planAmount × (remainingDays / totalDays) × (1 - usageRateCoefficient)
 *
 * Usage Rate Coefficient:
 * - ≤30 messages: 10% (almost new)
 * - 31-100 messages: 50% (light usage)
 * - 101-200 messages: 80% (moderate usage)
 * - >200 messages: 100% (heavy usage, no discount)
 */
function calculateRefundFor48hTo7Days(
  usageCount: number,
  daysSinceSubscription: number,
  planAmount: number,
  planDays: number
): { refundAmount: number; breakdown: string } {
  // Calculate usage rate coefficient
  let usageRateCoefficient: number
  if (usageCount <= 30) {
    usageRateCoefficient = 0.1  // 10% - almost new
  } else if (usageCount <= 100) {
    usageRateCoefficient = 0.5  // 50% - light usage
  } else if (usageCount <= 200) {
    usageRateCoefficient = 0.8  // 80% - moderate usage
  } else {
    usageRateCoefficient = 1.0  // 100% - heavy usage
  }

  // Calculate remaining days ratio
  const remainingDays = Math.max(0, planDays - daysSinceSubscription)
  const remainingDaysRatio = remainingDays / planDays

  // Final refund amount
  const refundAmount = planAmount * remainingDaysRatio * (1 - usageRateCoefficient)

  // Build breakdown explanation
  const breakdown = `Plan: $${planAmount.toFixed(2)} | ` +
    `Used: ${usageCount} msgs (${daysSinceSubscription} days) | ` +
    `Remaining: ${remainingDays} days (${(remainingDaysRatio * 100).toFixed(0)}%) | ` +
    `Usage factor: ${(usageRateCoefficient * 100).toFixed(0)}% | ` +
    `Refund: $${refundAmount.toFixed(2)}`

  return { refundAmount: Math.max(0, refundAmount), breakdown }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    // Get user's subscription
    const { data: subscriptions, error: fetchError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('[Cancel Subscription] User subscriptions:', {
      userId: user.id,
      subscriptionsCount: subscriptions?.length || 0,
      subscriptions
    })

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    const subscription = subscriptions[0]
    const createdAt = new Date(subscription.created_at)
    const now = new Date()
    const hoursSinceSubscription = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)

    console.log('[Cancel Subscription] Eligibility check:', {
      hoursSinceSubscription,
      daysSinceSubscription,
      createdAt: subscription.created_at,
    })

    // BLOCK cancellation after 7 days
    if (daysSinceSubscription > 7) {
      return NextResponse.json(
        {
          error: 'Cancellation period expired',
          message: `According to your refund policy, subscription cancellations must be submitted within 7 days of purchase. Your subscription was created ${daysSinceSubscription} days ago.`,
          policyUrl: '/refund',
        },
        { status: 403 }
      )
    }

    // Get message count for refund calculation
    // CRITICAL: Count ALL PRO-tier messages for THIS subscription from subscription start
    const { data: usageRecords } = await adminClient
      .from('usage_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('message_type', 'user')  // Only count user messages for refund calculation
      .eq('user_tier', 'pro')      // Only count PRO-tier usage, NOT free-tier
      .eq('subscription_id', subscription.id)  // Only count messages for THIS subscription
      .gte('timestamp', subscription.created_at)  // From subscription start (NOT just today)

    const usageCount = usageRecords?.length || 0

    console.log('[Cancel Subscription] Usage count (PRO-tier messages from subscription start):', {
      subscriptionId: subscription.id,
      usageCount,
      subscriptionCreatedAt: subscription.created_at,
      filterDetails: {
        userId: user.id,
        messageType: 'user',
        userTier: 'pro',
        subscriptionId: subscription.id,
        since: subscription.created_at,
      }
    })

    // Determine cancellation scenario
    const isWithin48Hours = hoursSinceSubscription <= 48
    const planDays = subscription.plan === 'annual' ? 365 : 30
    const planAmount = subscription.plan === 'annual' ? 24.99 : 2.99

    let refundAmount: number | null = null
    let refundBreakdown = ''
    let immediateCancellation = false
    let keepProAccess = false

    if (isWithin48Hours) {
      // SCENARIO 1: Within 48 hours - immediate cancellation + refund calculation
      immediateCancellation = true
      keepProAccess = false

      // Special case: ≤5 messages = 100% refund
      if (usageCount <= 5) {
        refundAmount = planAmount  // Full refund
        refundBreakdown = `Used ${usageCount} msgs (≤5) | 100% refund | $${refundAmount.toFixed(2)}`

        console.log('[Cancel Subscription] Within 48h - FULL REFUND (≤5 messages):', {
          usageCount,
          refundAmount: '$' + refundAmount.toFixed(2),
          fullyRefundable: true,
        })
      } else {
        // Prorated refund for >5 messages
        const messagesPerDay = USAGE_LIMITS.PRO_DAILY  // 30 messages per day for Pro users
        const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
        const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
        refundAmount = (refundPercentage / 100) * planAmount
        refundBreakdown = `Used ${usageCount} msgs (${daysOfQuotaUsed} days quota) | ` +
          `${refundPercentage.toFixed(0)}% refund | $${refundAmount.toFixed(2)}`

        console.log('[Cancel Subscription] Within 48h - PRORATED REFUND (>5 messages):', {
          usageCount,
          daysOfQuotaUsed,
          refundPercentage: refundPercentage.toFixed(2) + '%',
          refundAmount: '$' + refundAmount.toFixed(2),
          fullyRefundable: false,
        })
      }
    } else {
      // SCENARIO 2: 48h - 7 days - staged downgrade, calculate estimated refund
      immediateCancellation = false
      keepProAccess = true  // Keep Pro access until review is complete

      const calculation = calculateRefundFor48hTo7Days(
        usageCount,
        daysSinceSubscription,
        planAmount,
        planDays
      )
      refundAmount = calculation.refundAmount
      refundBreakdown = calculation.breakdown

      console.log('[Cancel Subscription] 48h-7d - staged downgrade:', {
        usageCount,
        daysSinceSubscription,
        refundAmount: '$' + refundAmount.toFixed(2),
        breakdown: refundBreakdown,
      })
    }

    // Update subscription in database
    const updateData: any = {
      refund_status: 'requested',
      updated_at: new Date().toISOString(),
    }

    // Add refund estimation fields for 48h-7day case
    if (!isWithin48Hours && refundAmount !== null) {
      updateData.refund_amount = refundAmount
      updateData.refund_estimated_at = new Date().toISOString()
    }

    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      console.warn('[Cancel Subscription] Failed to update subscription:', updateError)
    }

    // Cancel in Creem immediately ONLY for 48h case
    // For 48h-7day case, wait until refund is reviewed
    if (immediateCancellation) {
      try {
        await cancelSubscription({
          subscriptionId: subscription.creem_subscription_id,
          mode: 'immediate',
        })
        console.log('[Cancel Subscription] Creem immediate cancellation successful')

        // Mark subscription as cancelled in database
        await adminClient
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
          })
          .eq('id', subscription.id)
      } catch (creemError) {
        console.error('[Cancel Subscription] Creem cancel error:', creemError)
        // Continue with database update even if Creem fails
      }
    } else {
      console.log('[Cancel Subscription] Deferring Creem cancellation until refund review')
    }

    // Send cancellation email
    if (user.email) {
      try {
        await sendCancellationEmail({
          userEmail: user.email,
          userName: user.user_metadata?.name || user.user_metadata?.full_name,
          plan: subscription.plan || 'pro',
          currentPeriodEnd: subscription.current_period_end,
          subscriptionId: subscription.creem_subscription_id,
          refundAmount: refundAmount,
          refundBreakdown,
          isWithin48Hours,
          keepProAccess,
        })
        console.log('[Cancel Subscription] Cancellation email sent')
      } catch (emailError) {
        console.error('[Cancel Subscription] Failed to send email:', emailError)
      }
    }

    // Build response message
    let message: string
    if (isWithin48Hours) {
      if (usageCount <= 5) {
        message = 'Your subscription has been cancelled. You are eligible for a FULL REFUND since you used 5 or fewer messages within 48 hours. Please contact support@zeninsight.xyz to process your refund.'
      } else {
        message = `Your subscription has been cancelled. Estimated refund: $${refundAmount?.toFixed(2)} (${refundBreakdown}). Please contact support@zeninsight.xyz to process your refund.`
      }
    } else {
      message = `Your cancellation request has been received. Estimated refund: $${refundAmount?.toFixed(2)}. Your Pro access will remain active while we review your refund request (within 3 business days). You'll receive an email notification once the review is complete.`
    }

    return NextResponse.json({
      success: true,
      immediateCancellation,
      keepProAccess,
      message,
      refundAmount: refundAmount ? `$${refundAmount.toFixed(2)}` : null,
      refundBreakdown,
      supportEmail: 'support@zeninsight.xyz',
      policyUrl: '/refund',
      reviewPeriod: !immediateCancellation ? '3 business days' : null,
    })
  } catch (error) {
    console.error('[Cancel Subscription] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
