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
      message: newStatus === 'active'
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription cancelled successfully',
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
