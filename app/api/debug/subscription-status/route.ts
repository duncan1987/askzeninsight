import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelSubscription } from '@/lib/creem'

/**
 * Debug endpoint to check subscription status and test Creem API
 * GET /api/debug/subscription-status
 */
export async function GET() {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get user's subscription
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Failed to create admin client' }, { status: 500 })
  }

  const { data: subscription, error } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subscription) {
    return NextResponse.json({
      user: user.id,
      email: user.email,
      subscription: null,
      message: 'No subscription found',
    })
  }

  // Try to fetch subscription status from Creem
  let creemStatus = null
  let creemError = null

  try {
    // We can't fetch status directly from Creem without a getSubscription endpoint
    // But we can try to cancel again to see what happens
    creemStatus = 'Cannot fetch - Creem API may not have a get subscription endpoint'
  } catch (err) {
    creemError = err instanceof Error ? err.message : 'Unknown error'
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
    },
    subscription: {
      ...subscription,
      time_until_expiry: Math.floor((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    },
    creem: {
      status: creemStatus,
      error: creemError,
    },
    environment: {
      resendApiKey: !!process.env.RESEND_API_KEY,
      creemApiKey: !!process.env.CREEM_API_KEY,
    },
  })
}
