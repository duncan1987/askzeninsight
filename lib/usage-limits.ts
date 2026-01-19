import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscription'

export const USAGE_LIMITS = {
  ANONYMOUS_DAILY: 20, // 20 messages per day for anonymous users
  FREE_DAILY: 20, // 20 messages per day for free authenticated users
  PRO_DAILY: 100, // 100 messages per day for pro users (premium quota)
}

export const MESSAGE_LENGTH_LIMIT = 10000 // Max characters per message to prevent abuse

/**
 * Get user's usage limit based on subscription status
 */
export async function getUserUsageLimit(userId: string): Promise<number> {
  const supabase = await createClient()
  if (!supabase) {
    return USAGE_LIMITS.FREE_DAILY
  }

  // Check if user has active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .single()

  return subscription?.status === 'active'
    ? USAGE_LIMITS.PRO_DAILY
    : USAGE_LIMITS.FREE_DAILY
}

/**
 * Check if user is within premium quota (fair use policy)
 * Pro/Annual users get premium model for first 100 messages per day
 * After that, they get downgraded to basic model
 */
export async function isWithinPremiumQuota(userId?: string): Promise<boolean> {
  if (!userId) {
    return false // Anonymous users don't get premium quota
  }

  const subscription = await getUserSubscription(userId)
  if (subscription.tier !== 'pro') {
    return false // Free tier doesn't get premium quota
  }

  const usageCheck = await checkUsageLimit(userId)
  // Within premium quota if remaining messages > 0
  return usageCheck.remaining > 0
}

/**
 * Check if user can send more messages
 *
 * IMPORTANT: We count messages based on BOTH tier AND subscription ID.
 * This ensures:
 * - Free-tier usage doesn't count against Pro-tier quota
 * - When user changes plans (monthly <-> annual), usage counter resets
 * - Each subscription has its own independent usage tracking
 */
export async function checkUsageLimit(
  userId?: string
): Promise<{ canProceed: boolean; limit: number; remaining: number }> {
  const subscription = await getUserSubscription(userId)

  // Determine limit based on tier
  let limit: number
  let currentTier: 'anonymous' | 'free' | 'pro'
  let currentSubscriptionId: string | undefined

  if (!userId || subscription.tier === 'anonymous') {
    limit = USAGE_LIMITS.ANONYMOUS_DAILY
    currentTier = 'anonymous'
  } else if (subscription.tier === 'pro') {
    limit = USAGE_LIMITS.PRO_DAILY
    currentTier = 'pro'

    // Get current subscription ID for Pro users
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()

      if (adminClient) {
        const { data: subRecords } = await adminClient
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['active', 'cancelled', 'canceled'])
          .gte('current_period_end', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        currentSubscriptionId = subRecords?.[0]?.id
      }
    } catch (error) {
      console.error('[checkUsageLimit] Failed to fetch subscription ID:', error)
    }
  } else {
    limit = USAGE_LIMITS.FREE_DAILY
    currentTier = 'free'
  }

  // Count messages in last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Use admin client to bypass RLS
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  if (!supabase) {
    return { canProceed: true, limit, remaining: limit }
  }

  // CRITICAL: Filter by BOTH user_tier AND subscription_id
  // - For anonymous/free: filter by tier only (subscription_id is NULL)
  // - For pro: filter by BOTH tier AND subscription_id (ensures counter resets on plan change)
  let query = supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId || null)
    .eq('message_type', 'user')
    .eq('user_tier', currentTier)
    .gte('timestamp', twentyFourHoursAgo.toISOString())

  // For Pro users, also filter by subscription_id
  if (currentTier === 'pro' && currentSubscriptionId) {
    query = query.eq('subscription_id', currentSubscriptionId)
  }

  const { count } = await query

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const canProceed = used < limit

  console.log('[checkUsageLimit]', {
    userId,
    currentTier,
    currentSubscriptionId,
    limit,
    used,
    remaining,
    canProceed
  })

  return { canProceed, limit, remaining }
}

/**
 * Get user's usage statistics
 *
 * IMPORTANT: Counts messages based on BOTH tier AND subscription ID.
 * This ensures:
 * - Free-tier usage doesn't count against Pro-tier quota
 * - When user changes plans (monthly <-> annual), usage counter resets
 * - Each subscription has its own independent usage tracking
 */
export async function getUsageStats(userId?: string) {
  const subscription = await getUserSubscription(userId)

  // Determine limit based on tier
  let limit: number
  let currentTier: 'anonymous' | 'free' | 'pro'
  let currentSubscriptionId: string | undefined

  if (!userId || subscription.tier === 'anonymous') {
    limit = USAGE_LIMITS.ANONYMOUS_DAILY
    currentTier = 'anonymous'
  } else if (subscription.tier === 'pro') {
    limit = USAGE_LIMITS.PRO_DAILY
    currentTier = 'pro'

    // Get current subscription ID for Pro users
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()

      if (adminClient) {
        const { data: subRecords } = await adminClient
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['active', 'cancelled', 'canceled'])
          .gte('current_period_end', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        currentSubscriptionId = subRecords?.[0]?.id
      }
    } catch (error) {
      console.error('[getUsageStats] Failed to fetch subscription ID:', error)
    }
  } else {
    limit = USAGE_LIMITS.FREE_DAILY
    currentTier = 'free'
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Use admin client to bypass RLS
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  if (!supabase) {
    return {
      used: 0,
      limit,
      remaining: limit,
      percentage: 0,
    }
  }

  // CRITICAL: Filter by BOTH user_tier AND subscription_id
  // - For anonymous/free: filter by tier only (subscription_id is NULL)
  // - For pro: filter by BOTH tier AND subscription_id (ensures counter resets on plan change)
  let query = supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId || null)
    .eq('message_type', 'user')
    .eq('user_tier', currentTier)
    .gte('timestamp', twentyFourHoursAgo.toISOString())

  // For Pro users, also filter by subscription_id
  if (currentTier === 'pro' && currentSubscriptionId) {
    query = query.eq('subscription_id', currentSubscriptionId)
  }

  const { count } = await query

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const percentage = Math.min(100, (used / limit) * 100)

  console.log('[getUsageStats]', {
    userId,
    currentTier,
    currentSubscriptionId,
    limit,
    used,
    remaining,
    percentage
  })

  return {
    used,
    limit,
    remaining,
    percentage,
  }
}

/**
 * Record a message usage with user tier and subscription ID
 *
 * IMPORTANT: We record both the user's tier AND the subscription ID at the time of message sending.
 * This ensures that:
 * - Free tier messages don't count against Pro tier quota
 * - When user upgrades from free to pro, their usage counter resets
 * - When user downgrades from pro to free, only free-tier usage counts
 * - When user changes plans (monthly <-> annual), usage counter resets for each subscription
 */
export async function recordUsage(
  userId: string | undefined,
  messageType: 'user' | 'assistant'
) {
  const supabase = await createClient()
  if (!supabase) {
    console.warn('[recordUsage] Supabase client not available')
    return
  }

  // Get user's current tier
  let userTier: 'anonymous' | 'free' | 'pro' = 'anonymous'
  let subscriptionId: string | undefined

  if (userId) {
    const subscription = await getUserSubscription(userId)
    userTier = subscription.tier

    // For Pro users, get the actual subscription record ID
    if (subscription.tier === 'pro' && userId) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()

        if (adminClient) {
          const { data: subRecords } = await adminClient
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['active', 'cancelled', 'canceled'])
            .gte('current_period_end', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)

          subscriptionId = subRecords?.[0]?.id
        }
      } catch (error) {
        console.error('[recordUsage] Failed to fetch subscription ID:', error)
        // Continue without subscription_id - this is okay for anonymous/free users
      }
    }
  }

  const record = {
    user_id: userId || null,
    message_type: messageType,
    user_tier: userTier,
    subscription_id: subscriptionId || null,
    timestamp: new Date().toISOString(),
  }

  console.log('[recordUsage] Attempting to insert:', record)

  const { data, error } = await supabase.from('usage_records').insert(record)

  if (error) {
    console.error('[recordUsage] Failed to insert usage record:', error)
  } else {
    console.log('[recordUsage] Successfully recorded usage:', data)
  }
}
