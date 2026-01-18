import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Debug endpoint to simulate Creem webhook for testing
 * This bypasses the need for a public webhook URL during development
 *
 * POST /api/debug/webhook-simulate
 * Body: { subscriptionId, userId, plan }
 */
export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { subscriptionId, userId, plan = 'pro', interval = 'month' } = body

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'subscriptionId and userId are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase admin client could not be created' },
        { status: 500 }
      )
    }

    // Calculate period end (30 days from now)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    console.log('[Webhook Simulate] Creating subscription:', {
      user_id: userId,
      creem_subscription_id: subscriptionId,
      status: 'active',
      current_period_end: currentPeriodEnd.toISOString(),
      plan: plan,
      interval: interval,
    })

    // Create or update subscription
    const { error, data } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          creem_subscription_id: subscriptionId,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          plan: plan,
          interval: interval,
        },
        { onConflict: 'creem_subscription_id' }
      )

    console.log('[Webhook Simulate] Upsert result:', { error, data })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        user_id: userId,
        creem_subscription_id: subscriptionId,
        status: 'active',
        current_period_end: currentPeriodEnd.toISOString(),
        plan: plan,
        interval: interval,
      },
    })
  } catch (error) {
    console.error('[Webhook Simulate] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      },
      { status: 500 }
    )
  }
}
