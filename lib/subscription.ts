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
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, plan')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled', 'canceled']) // Include cancelled subscriptions
    .gte('current_period_end', new Date().toISOString())
    .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows

  // Debug logging
  console.log('[getUserSubscription] userId:', userId)
  console.log('[getUserSubscription] subscription error:', error)
  console.log('[getUserSubscription] subscription data:', subscription)

  const isPro = subscription && ['active', 'cancelled', 'canceled'].includes(subscription.status)
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
