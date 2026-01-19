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

    // Cancel current subscription in Creem, then delete from database
    if (activeSubscription.creem_subscription_id) {
      try {
        // First, cancel in Creem to stop future charges
        await cancelSubscription({
          subscriptionId: activeSubscription.creem_subscription_id,
          mode: 'scheduled', // Cancel at period end
        })

        // Then, DELETE the old subscription from database to keep it clean
        const { error: deleteError } = await adminClient
          .from('subscriptions')
          .delete()
          .eq('id', activeSubscription.id)

        if (deleteError) {
          console.error('[Change Plan] Error deleting old subscription:', deleteError)
        } else {
          console.log('[Change Plan] Old subscription deleted successfully from database')
        }
      } catch (cancelError) {
        console.error('[Change Plan] Error cancelling subscription:', cancelError)
        return NextResponse.json(
          {
            error: 'Failed to cancel current subscription',
            details: cancelError instanceof Error ? cancelError.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    } else {
      // If no Creem subscription ID, just delete from database
      const { error: deleteError } = await adminClient
        .from('subscriptions')
        .delete()
        .eq('id', activeSubscription.id)

      if (deleteError) {
        console.error('[Change Plan] Error deleting old subscription:', deleteError)
      } else {
        console.log('[Change Plan] Old subscription deleted successfully from database')
      }
    }

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
