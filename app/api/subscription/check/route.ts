import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
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
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Check for active subscriptions
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Check Subscription] Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      )
    }

    // Determine if user has an active subscription
    const activeSubscription = subscriptions?.find(sub =>
      sub.status === 'active' && !sub.cancel_at_period_end
    )

    const cancelledSubscription = subscriptions?.find(sub =>
      sub.status === 'active' && sub.cancel_at_period_end
    )

    return NextResponse.json({
      hasActiveSubscription: !!activeSubscription,
      activeSubscription: activeSubscription || null,
      hasCancelledSubscription: !!cancelledSubscription,
      cancelledSubscription: cancelledSubscription || null,
      allSubscriptions: subscriptions || [],
    })
  } catch (error) {
    console.error('[Check Subscription] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
