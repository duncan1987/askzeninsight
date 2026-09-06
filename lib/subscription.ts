import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserTier = 'anonymous' | 'free' | 'pro' | 'approved_zh'
export type PlanType = 'pro' | 'annual'

export interface SubscriptionInfo {
  tier: UserTier
  plan: PlanType | null
  model: string
  apiKey: string
  apiUrl: string
  saveHistory: boolean
}

/**
 * Get user subscription tier and determine which model/API key to use
 */
export async function getUserSubscription(userId?: string): Promise<SubscriptionInfo> {
  // Anonymous users use free tier
  const geminiKey = process.env.GEMINI_API_KEY
  const useGemini = !!geminiKey
  const freeApiKey = process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_FREE || ''
  const freeModel = useGemini ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash') : 'glm-4-flash'
  const freeApiUrl = useGemini
    ? (process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')
    : 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

  if (!userId) {
    return {
      tier: 'anonymous',
      plan: null,
      model: freeModel,
      apiKey: freeApiKey,
      apiUrl: freeApiUrl,
      saveHistory: false,
    }
  }

  // Check if user is an approved zh user (username-based auth)
  const supabase = createAdminClient()

  if (supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, account_status')
      .eq('id', userId)
      .single()

    if (profile?.username && profile.account_status === 'approved') {
      return {
        tier: 'approved_zh',
        plan: null,
        model: freeModel,
        apiKey: freeApiKey,
        apiUrl: freeApiUrl,
        saveHistory: true,
      }
    }
  }

  if (!supabase) {
    return {
      tier: 'free',
      plan: null,
      model: freeModel,
      apiKey: freeApiKey,
      apiUrl: freeApiUrl,
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
    .select('*') // Select all fields including refund_estimated_at, id, created_at
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled', 'canceled', 'queued']) // Include queued subscriptions
    .gte('current_period_end', now)
    .order('created_at', { ascending: false })

  // Debug logging
  console.log('[getUserSubscription] userId:', userId)
  console.log('[getUserSubscription] query time:', now)
  console.log('[getUserSubscription] subscriptions error:', error)
  console.log('[getUserSubscription] subscriptions data:', subscriptions)

  // Get the most recent subscription
  const subscription = subscriptions?.[0]

  // Handle queued subscriptions - activate if previous subscription expired
  if (subscription?.status === 'queued') {
    const currentPeriodEnd = new Date(subscription.current_period_end)

    // Activate if previous subscription period has ended
    if (now >= currentPeriodEnd.toISOString()) {
      console.log('[getUserSubscription] Activating queued subscription:', subscription)
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'queued')

      // Update the subscription object
      subscription.status = 'active'
    }
  }

  // Check if subscription has a refund request
  // Staged downgrade logic (方案A):
  // - refund_status='requested' → Keep Pro access during 3-day review period
  // - refund_status='approved' or 'rejected' → Downgrade to Free
  // - refund_status='none' → Normal logic
  let hasRefundRequest = false
  let isInReviewPeriod = false

  if (subscription?.refund_status && subscription.refund_status !== 'none') {
    hasRefundRequest = true

    // Check if within 3-day review period
    if (subscription.refund_status === 'requested' && subscription.refund_estimated_at) {
      const reviewDeadline = new Date(subscription.refund_estimated_at)
      reviewDeadline.setDate(reviewDeadline.getDate() + 3) // 3 business days

      if (now <= reviewDeadline.toISOString()) {
        isInReviewPeriod = true
        console.log('[getUserSubscription] User in refund review period, keeping Pro access:', {
          refundEstimatedAt: subscription.refund_estimated_at,
          reviewDeadline: reviewDeadline.toISOString(),
        })
      }
    }
  }

  console.log('[getUserSubscription] selected subscription:', subscription)
  console.log('[getUserSubscription] refund_status check:', {
    hasRefundRequest,
    isInReviewPeriod,
    refundStatus: subscription?.refund_status,
  })

  // User is Pro if:
  // 1. Has active subscription (no auto-renewal) AND
  // 2. Subscription period is still valid (not expired) AND
  // 3. (No refund request OR refund is still in review period)
  const isPro = subscription &&
    subscription.status === 'active' &&
    new Date(subscription.current_period_end) >= new Date(now) &&
    (!hasRefundRequest || isInReviewPeriod) &&  // Keep Pro if in review period
    subscription.refund_status !== 'approved' &&
    subscription.refund_status !== 'rejected'
  const plan = subscription?.plan as PlanType | null | undefined

  const proKey = process.env.PRO_API_KEY || (useGemini ? geminiKey : process.env.ZHIPU_API_KEY)
  const proModel = process.env.PRO_MODEL || (useGemini ? 'gemini-2.5-flash' : 'glm-4-flash')
  const proApiUrl = process.env.PRO_API_URL || (useGemini
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://open.bigmodel.cn/api/paas/v4/chat/completions')

  return {
    tier: isPro ? 'pro' : 'free',
    plan: isPro ? (plan || 'pro') : null,
    model: isPro ? proModel : freeModel,
    apiKey: isPro ? (proKey || '') : freeApiKey,
    apiUrl: isPro ? proApiUrl : freeApiUrl,
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
