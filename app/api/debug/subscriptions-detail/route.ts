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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Get ALL subscriptions for this user
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error },
        { status: 500 }
      )
    }

    // Analyze each subscription
    const analysis = subscriptions?.map(sub => {
      const now = new Date()
      const periodEnd = new Date(sub.current_period_end)
      const daysUntilEnd = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = periodEnd < now
      const isActive = sub.status === 'active' && !sub.cancel_at_period_end && !isExpired
      const isScheduledToCancel = sub.status === 'active' && sub.cancel_at_period_end && !isExpired

      return {
        id: sub.id,
        plan: sub.plan,
        interval: sub.interval,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        created_at: sub.created_at,
        current_period_end: sub.current_period_end,
        creem_subscription_id: sub.creem_subscription_id,
        analysis: {
          isExpired,
          isActive,
          isScheduledToCancel,
          daysUntilEnd,
          interpretation: isExpired ? 'EXPIRED - No longer active' :
                        isActive ? 'ACTIVE - Currently in use' :
                        isScheduledToCancel ? 'SCHEDULED TO CANCEL - Will expire at period end' :
                        'CANCELLED/OTHER - Inactive'
        }
      }
    })

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      totalSubscriptions: subscriptions?.length || 0,
      subscriptions: analysis,
      dashboardWouldShow: analysis?.[0], // Dashboard shows first (newest) subscription
    })
  } catch (error) {
    console.error('[Debug Subscriptions] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
