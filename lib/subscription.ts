import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserTier = 'anonymous' | 'free' | 'pro'
export type PlanType = 'pro' | 'annual'

export interface SubscriptionInfo {
  tier: UserTier
  plan: PlanType | null
  model: string
  apiKey: string
  saveHistory: boolean
}

/**
 * Get user subscription tier and determine which model/API key to use
 */
export async function getUserSubscription(userId?: string): Promise<SubscriptionInfo> {
  // Anonymous users use free tier
  if (!userId) {
    return {
      tier: 'anonymous',
      plan: null,
      model: 'glm-4-flash',
      apiKey: process.env.ZHIPU_API_FREE || '',
      saveHistory: false,
    }
  }

  // Use admin client when userId is provided (for API routes/tests)
  // This bypasses RLS and allows direct lookup by user_id
  const supabase = createAdminClient()

  if (!supabase) {
    return {
      tier: 'free',
      plan: null,
      model: 'glm-4-flash',
      apiKey: process.env.ZHIPU_API_FREE || '',
      saveHistory: false,
    }
  }

  // Check if user has active subscription
  // Note: We include 'cancelled' status because users keep access until period ends
  // Also check that cancel_at_period_end is not true (unless we want to include scheduled cancellations)
  // IMPORTANT: If refund_status is 'requested', the subscription is considered cancelled
  const now = new Date().toISOString()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, plan, cancel_at_period_end, refund_status')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled', 'canceled']) // Include cancelled subscriptions
    .gte('current_period_end', now)
    .order('created_at', { ascending: false })

  // Debug logging
  console.log('[getUserSubscription] userId:', userId)
  console.log('[getUserSubscription] query time:', now)
  console.log('[getUserSubscription] subscriptions error:', error)
  console.log('[getUserSubscription] subscriptions data:', subscriptions)

  // Get the most recent subscription
  const subscription = subscriptions?.[0]

  // Check if subscription has a refund request
  // If refund_status is 'requested', the subscription is considered cancelled for our system
  const hasRefundRequest = subscription && subscription.refund_status && subscription.refund_status !== 'none'

  console.log('[getUserSubscription] selected subscription:', subscription)
  console.log('[getUserSubscription] refund_status check:', {
    hasRefundRequest,
    refundStatus: subscription?.refund_status,
  })

  const isPro = subscription && !hasRefundRequest && ['active', 'cancelled', 'canceled'].includes(subscription.status) && new Date(subscription.current_period_end) >= new Date(now)
  const plan = subscription?.plan as PlanType | null | undefined

  return {
    tier: isPro ? 'pro' : 'free',
    plan: isPro ? (plan || 'pro') : null,
    model: isPro ? 'glm-4.7' : 'glm-4-flash',
    apiKey: isPro
      ? (process.env.ZHIPU_API_KEY || '')
      : (process.env.ZHIPU_API_FREE || ''),
    saveHistory: isPro,
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false

  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}
