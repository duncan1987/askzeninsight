import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'
import { sendCancellationEmail } from '@/lib/email'
import { USAGE_LIMITS } from '@/lib/usage-limits'

export const runtime = 'nodejs'

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
          message: `According to our refund policy, subscription cancellations must be submitted within 7 days of purchase. Your subscription was created ${daysSinceSubscription} days ago.`,
          policyUrl: '/refund',
        },
        { status: 403 }
      )
    }

    // Get message count for refund calculation
    // CRITICAL: Count ALL PRO-tier messages for THIS subscription from subscription start
    // NOT just today's messages - this ensures fair refund calculation based on total usage
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

    // Calculate refund info
    const isRefundEligible = hoursSinceSubscription <= 48
    let refundInfo = null

    if (isRefundEligible) {
      const messagesPerDay = USAGE_LIMITS.PRO_DAILY  // 30 messages per day for Pro users
      const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
      const planDays = subscription.plan === 'annual' ? 365 : 30
      const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
      const estimatedRefund = (refundPercentage / 100) * (subscription.plan === 'annual' ? 24.9 : 2.99)

      refundInfo = {
        usageCount,
        daysOfQuotaUsed,
        planDays,
        refundPercentage: refundPercentage.toFixed(2) + '%',
        estimatedRefund: '$' + estimatedRefund.toFixed(2),
        fullyRefundable: usageCount <= 5,
      }

      console.log('[Cancel Subscription] Refund calculation:', refundInfo)
    }

    // Update refund status in database before canceling
    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        refund_status: 'requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.warn('[Cancel Subscription] Failed to update refund_status:', updateError)
    }

    // Cancel in Creem with mode: 'immediate' for ALL cases
    try {
      await cancelSubscription({
        subscriptionId: subscription.creem_subscription_id,
        mode: 'immediate',
      })
      console.log('[Cancel Subscription] Creem immediate cancellation successful')
    } catch (creemError) {
      console.error('[Cancel Subscription] Creem cancel error:', creemError)
      // Continue with database deletion even if Creem fails
    }

    // SOFT CANCELLATION: Mark subscription as cancelled instead of deleting
    // This preserves the record for audit trail
    const { error: cancelUpdateError } = await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (cancelUpdateError) {
      console.error('[Cancel Subscription] Failed to update subscription:', cancelUpdateError)
      return NextResponse.json(
        { error: 'Failed to process cancellation' },
        { status: 500 }
      )
    }

    console.log('[Cancel Subscription] Subscription marked as cancelled (soft delete)')

    // Send cancellation email
    if (user.email) {
      try {
        await sendCancellationEmail({
          userEmail: user.email,
          userName: user.user_metadata?.name || user.user_metadata?.full_name,
          plan: subscription.plan || 'pro',
          currentPeriodEnd: subscription.current_period_end,
          subscriptionId: subscription.creem_subscription_id,
        })
        console.log('[Cancel Subscription] Cancellation email sent')
      } catch (emailError) {
        console.error('[Cancel Subscription] Failed to send email:', emailError)
      }
    }

    // Build response message
    let message = 'Your subscription has been cancelled.'

    if (isRefundEligible) {
      if (refundInfo?.fullyRefundable) {
        message += ' You are eligible for a full refund since you used 5 or fewer messages within 48 hours of subscription.'
      } else {
        message += ` Refund calculation: ${refundInfo.refundPercentage} (${refundInfo.estimatedRefund}) based on your usage of ${usageCount} messages. Please contact support@zeninsight.xyz to process your refund.`
      }
    } else {
      message += ' Your cancellation request has been submitted and is subject to review. Please contact support@zeninsight.xyz for refund consideration.'
    }

    return NextResponse.json({
      success: true,
      immediateCancellation: true,
      message,
      refundInfo,
      supportEmail: 'support@zeninsight.xyz',
      policyUrl: '/refund',
      newTier: 'free',
      newModel: 'glm-4-flash',
      dailyLimit: 20,
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
