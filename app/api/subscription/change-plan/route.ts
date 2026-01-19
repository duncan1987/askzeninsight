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

    const body = (await req.json().catch(() => ({}))) as Partial<{
      newPlan: 'pro' | 'annual'
    }>

    if (!body.newPlan || (body.newPlan !== 'pro' && body.newPlan !== 'annual')) {
      return NextResponse.json(
        { error: 'Invalid plan specified' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    // Get current active subscription
    const { data: subscriptions, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('[Change Plan] Error fetching subscriptions:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch current subscription' },
        { status: 500 }
      )
    }

    const activeSubscription = subscriptions?.find(sub =>
      sub.status === 'active' && !sub.cancel_at_period_end
    )

    if (!activeSubscription) {
      return NextResponse.json(
        {
          error: 'No active subscription found',
          message: 'You do not have an active subscription to change.',
        },
        { status: 404 }
      )
    }

    const currentPlan = activeSubscription.plan || 'pro'

    // Check if already on the requested plan
    if (currentPlan === body.newPlan) {
      return NextResponse.json(
        {
          error: 'Already on this plan',
          message: `You are already on the ${body.newPlan === 'annual' ? 'Annual' : 'Pro'} plan.`,
        },
        { status: 400 }
      )
    }

    // Cancel current subscription in Creem and mark as replaced in database
    if (activeSubscription.creem_subscription_id) {
      try {
        // First, cancel in Creem to stop future charges
        // Using 'immediate' mode to be consistent with our immediate cancellation logic
        // This ensures the old subscription is cancelled right away
        await cancelSubscription({
          subscriptionId: activeSubscription.creem_subscription_id,
          mode: 'immediate', // Cancel immediately in Creem
        })

        console.log('[Change Plan] Subscription cancelled in Creem')
      } catch (cancelError) {
        console.error('[Change Plan] Error cancelling subscription in Creem:', cancelError)
        // Continue with database update even if Creem cancel fails
        // User will still have access until period ends based on database record
      }
    }

    // CRITICAL: Update the subscription status instead of deleting it
    // This preserves the user's access until their current period ends
    // The new subscription (created after checkout) will override this one
    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        replaced_by_new_plan: true, // Mark as being replaced
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeSubscription.id)

    if (updateError) {
      console.error('[Change Plan] Error updating subscription status:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update subscription status',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    console.log('[Change Plan] Subscription marked as cancelled and replaced')

    // Return success with information about the new plan
    const periodEndDate = new Date(activeSubscription.current_period_end)
    const formattedDate = periodEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return NextResponse.json({
      success: true,
      message: `Your ${currentPlan === 'annual' ? 'Annual' : 'Pro'} subscription has been cancelled and will expire on ${formattedDate}. You can now subscribe to the ${body.newPlan === 'annual' ? 'Annual' : 'Pro'} plan.`,
      currentPlan,
      newPlan: body.newPlan,
      accessUntil: activeSubscription.current_period_end,
      canSubscribeNow: true,
    })
  } catch (error) {
    console.error('[Change Plan] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
