import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'

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
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('creem_subscription_id, status, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

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

    // Update database status
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Failed to create admin client' },
        { status: 500 }
      )
    }

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
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Cancel Subscription] Update error:', updateError)
      throw updateError
    }

    console.log('[Cancel Subscription] Subscription cancelled successfully')

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

      // Update database to reflect the actual status
      const adminClient = createAdminClient()
      if (!adminClient) {
        return NextResponse.json(
          { error: 'Failed to create admin client' },
          { status: 500 }
        )
      }

      // Update status to 'active' but with a note that it will cancel at period end
      // The subscription will expire automatically when period ends
      const { error: updateError } = await adminClient
        .from('subscriptions')
        .update({
          status: 'active', // Keep as active until period ends
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[Cancel Subscription] Update error:', updateError)
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
