import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'
import { sendCancellationEmail } from '@/lib/email'

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

    // Get user's subscription
    // Use the same logic as getUserSubscription() to handle multiple subscriptions
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    // Get ALL subscriptions for the user, ordered by creation date (newest first)
    const { data: subscriptions, error: fetchError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', now)
      .order('created_at', { ascending: false })

    console.log('[Cancel Subscription] User subscriptions query:', {
      userId: user.id,
      fetchError,
      subscriptionsCount: subscriptions?.length || 0,
      subscriptions: subscriptions
    })

    // Find the most recent subscription that is actually active (not scheduled to cancel)
    // If none are fully active, use the first one (might be scheduled to cancel)
    const subscription = subscriptions?.find(sub =>
      sub.status === 'active' && !sub.cancel_at_period_end
    ) || subscriptions?.[0]

    if (fetchError || !subscription) {
      console.error('[Cancel Subscription] No subscription found for user:', {
        userId: user.id,
        fetchError,
        subscriptionsCount: subscriptions?.length || 0
      })
      return NextResponse.json(
        {
          error: 'Subscription not found',
          details: fetchError?.message || 'No active subscription found for this user'
        },
        { status: 404 }
      )
    }

    console.log('[Cancel Subscription] Found subscription to cancel:', {
      subscriptionId: subscription.id,
      creemSubscriptionId: subscription.creem_subscription_id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    })

    const now = new Date()
    const createdAt = new Date(subscription.created_at)
    const hoursSinceSubscription = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)

    console.log('[Cancel Subscription] Checking subscription eligibility:', {
      hoursSinceSubscription,
      daysSinceSubscription,
      usageCount,
      createdAt: subscription.created_at,
    })

    // RULE 1: Block cancellation after 7 days
    if (daysSinceSubscription > 7) {
      return NextResponse.json(
        {
          error: 'Cancellation period expired',
          message: `According to our refund policy, subscription cancellation and refund requests must be submitted within 7 days of purchase. Your subscription was created ${daysSinceSubscription} days ago.`,
          daysSinceSubscription,
          policyUrl: '/refund',
          canContactSupport: true,
        },
        { status: 403 } // Forbidden
      )
    }

    // RULE 2: Within 48 hours AND ≤5 messages → Immediate cancellation and downgrade
    if (hoursSinceSubscription <= 48 && usageCount <= 5) {
      console.log('[Cancel Subscription] Eligible for immediate cancellation and refund')

      // Cancel in Creem immediately (not scheduled)
      try {
        await cancelSubscription({
          subscriptionId: subscription.creem_subscription_id,
          mode: 'immediate', // Cancel immediately
        })
      } catch (creemError) {
        console.error('[Cancel Subscription] Creem immediate cancel failed:', creemError)
        // Continue with database deletion even if Creem fails
      }

      // DELETE subscription from database
      const { error: deleteError } = await adminClient
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id)

      if (deleteError) {
        console.error('[Cancel Subscription] Failed to delete subscription:', deleteError)
        return NextResponse.json(
          { error: 'Failed to process cancellation' },
          { status: 500 }
        )
      }

      // Send cancellation email with immediate refund notice
      if (user.email) {
        try {
          await sendCancellationEmail({
            userEmail: user.email,
            userName: user.user_metadata?.name || user.user_metadata?.full_name,
            plan: subscription.plan || 'pro',
            currentPeriodEnd: subscription.current_period_end,
            subscriptionId: subscription.creem_subscription_id,
          })
          console.log('[Cancel Subscription] Cancellation email sent successfully')
        } catch (emailError) {
          console.error('[Cancel Subscription] Failed to send cancellation email:', emailError)
        }
      }

      console.log('[Cancel Subscription] Immediate cancellation completed, user downgraded to free')

      return NextResponse.json({
        success: true,
        immediateCancellation: true,
        fullyRefundable: true,
        message: 'Your subscription has been cancelled immediately. You have been downgraded to the free tier and can continue using our service with 20 messages per day.',
        newTier: 'free',
        newModel: 'glm-4-flash',
        dailyLimit: 20,
      })
    }

    // RULE 3: Within 48 hours BUT >5 messages → Calculate refund, then scheduled cancellation
    let refundInfo = null
    if (hoursSinceSubscription <= 48 && usageCount > 5) {
      console.log('[Cancel Subscription] Within 48h but used >5 messages - refund calculation needed')

      // Calculate refund percentage based on usage
      // Pro plan: 100 messages/day, Annual: $19.9 for 365 days or $2.99 for 30 days
      const messagesPerDay = 100
      const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
      const planDays = subscription.plan === 'annual' ? 365 : 30
      const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
      const estimatedRefund = (refundPercentage / 100) * (subscription.plan === 'annual' ? 19.9 : 2.99)

      refundInfo = {
        usageCount,
        daysOfQuotaUsed,
        planDays,
        refundPercentage: refundPercentage.toFixed(2) + '%',
        estimatedRefund: '$' + estimatedRefund.toFixed(2),
        needEmailSupport: true,
      }

      console.log('[Cancel Subscription] Refund calculation:', refundInfo)

      // Fall through to normal scheduled cancellation flow
    }

    // RULE 4: 48h-7 days → Normal scheduled cancellation, contact support for refund consideration
    // This is the default flow for users between 48h and 7 days

    // Check if subscription is already cancelled
    if (subscription.status === 'cancelled' || subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: `Cannot cancel subscription with status: ${subscription.status}` },
        { status: 400 }
      )
    }

    // Cancel subscription with Creem API (mode: scheduled = cancel at period end)
    console.log('[Cancel Subscription] Attempting to cancel Creem subscription:', {
      creem_subscription_id: subscription.creem_subscription_id,
      mode: 'scheduled'
    })

    const creemSubscription = await cancelSubscription({
      subscriptionId: subscription.creem_subscription_id,
      mode: 'scheduled', // User keeps access until period end
    })

    console.log('[Cancel Subscription] Creem response:', creemSubscription)

    // Map Creem status to our database status
    // scheduled_cancel -> active (user still has access until period end)
    // canceled -> cancelled
    const newStatus = creemSubscription.status === 'scheduled_cancel'
      ? 'active'
      : creemSubscription.status === 'canceled'
        ? 'cancelled'
        : creemSubscription.status

    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        status: newStatus,
        cancel_at_period_end: newStatus === 'active', // Mark as scheduled to cancel
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id) // Use subscription ID instead of user_id for precision

    if (updateError) {
      console.error('[Cancel Subscription] Update error:', updateError)
      throw updateError
    }

    console.log('[Cancel Subscription] Subscription cancelled successfully')

    // Clean up old subscriptions that are already marked with cancel_at_period_end=true
    // This keeps the database clean - only the current subscription remains
    const { error: cleanupError } = await adminClient
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('cancel_at_period_end', true)
      .neq('id', subscription.id) // Don't delete the subscription we just updated

    if (cleanupError) {
      console.warn('[Cancel Subscription] Failed to cleanup old subscriptions:', cleanupError)
      // Don't throw - cleanup is optional
    } else {
      const { count } = await adminClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      console.log('[Cancel Subscription] Cleaned up old subscriptions. Remaining subscriptions:', count || 0)
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
        })
        console.log('[Cancel Subscription] Cancellation email sent successfully')
      } catch (emailError) {
        console.error('[Cancel Subscription] Failed to send cancellation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      current_period_end: subscription.current_period_end,
      immediateCancellation: false,
      message: newStatus === 'active'
        ? `Your subscription will be cancelled at the end of your billing period on ${new Date(subscription.current_period_end).toLocaleDateString()}. You can continue using all features until then.`
        : 'Subscription cancelled successfully',
      refundInfo,
      accessUntil: subscription.current_period_end,
      supportEmail: 'support@zeninsight.xyz',
    })
  } catch (error) {
    console.error('[Cancel Subscription] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription'

    // Check if subscription is already cancelled/scheduled in Creem
    if (errorMessage.includes('already scheduled') ||
        errorMessage.includes('already cancelled') ||
        errorMessage.includes('Subscription is already')) {

      console.log('[Cancel Subscription] Subscription already cancelled in Creem, updating database')

      // Update status to 'active' but mark as scheduled to cancel at period end
      // The subscription will expire automatically when period ends
      const { error: updateError } = await adminClient
        .from('subscriptions')
        .update({
          status: 'active', // Keep as active until period ends
          cancel_at_period_end: true, // Mark as scheduled to cancel
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id) // Use subscription ID instead of user_id for precision

      if (updateError) {
        console.error('[Cancel Subscription] Update error:', updateError)
      }

      // Clean up old subscriptions that are already marked with cancel_at_period_end=true
      const { error: cleanupError } = await adminClient
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('cancel_at_period_end', true)
        .neq('id', subscription.id) // Don't delete the subscription we just updated

      if (cleanupError) {
        console.warn('[Cancel Subscription] Failed to cleanup old subscriptions:', cleanupError)
      } else {
        console.log('[Cancel Subscription] Cleaned up old subscriptions in error handler')
      }

      // Return success - subscription is already scheduled for cancellation
      return NextResponse.json({
        success: true,
        status: 'active',
        current_period_end: subscription.current_period_end,
        message: 'Subscription will be cancelled at the end of the current billing period',
        note: 'Cancellation was already scheduled',
      })
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: {
          hint: 'This error usually means the Creem subscription ID is invalid or does not exist in Creem\'s system.',
          possible_causes: [
            'Test/Live mode mismatch - subscription created in different mode than current API key',
            'Subscription was already cancelled on Creem side but not updated in database',
            'Webhook didn\'t fire properly when subscription was created',
            'Invalid Creem subscription ID in database'
          ]
        }
      },
      { status: 500 }
    )
  }
}
