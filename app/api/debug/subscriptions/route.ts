import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Debug endpoint to check subscriptions in the database
 * Access via: GET /api/debug/subscriptions
 * Only works in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase admin client could not be created' },
      { status: 500 }
    )
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error },
      { status: 500 }
    )
  }

  // Format the response for better readability
  const formatted = subscriptions?.map((sub) => ({
    database_id: sub.id,
    user_id: sub.user_id,
    creem_subscription_id: sub.creem_subscription_id || null,
    status: sub.status,
    plan: sub.plan,
    interval: sub.interval,
    current_period_end: sub.current_period_end,
    created_at: sub.created_at,
    updated_at: sub.updated_at,
    issues: {
      missing_creem_id: !sub.creem_subscription_id,
      period_expired: new Date(sub.current_period_end) < new Date() && sub.status === 'active',
    },
  }))

  return NextResponse.json({
    total: subscriptions?.length || 0,
    subscriptions: formatted || [],
    summary: {
      with_creem_id: formatted?.filter((s) => s.creem_subscription_id).length || 0,
      without_creem_id: formatted?.filter((s) => !s.creem_subscription_id).length || 0,
      active: formatted?.filter((s) => s.status === 'active').length || 0,
      cancelled: formatted?.filter((s) => s.status === 'cancelled' || s.status === 'canceled').length || 0,
    },
  })
}

/**
 * Delete a subscription (debug only)
 * DELETE /api/debug/subscriptions?subscriptionId=xxx
 */
export async function DELETE(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const subscriptionId = searchParams.get('subscriptionId')

  if (!subscriptionId) {
    return NextResponse.json(
      { error: 'subscriptionId query parameter is required' },
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

  // First, get the subscription to show what will be deleted
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (fetchError || !subscription) {
    return NextResponse.json(
      { error: 'Subscription not found', details: fetchError },
      { status: 404 }
    )
  }

  // Delete the subscription
  const { error: deleteError } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', subscriptionId)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete subscription', details: deleteError },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Subscription deleted successfully',
    deleted: {
      id: subscription.id,
      creem_subscription_id: subscription.creem_subscription_id,
      user_id: subscription.user_id,
      status: subscription.status,
      plan: subscription.plan,
    },
  })
}
