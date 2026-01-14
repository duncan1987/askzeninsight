import { createClient } from '@/lib/supabase/server'

export const USAGE_LIMITS = {
  FREE_DAILY: 10, // 10 messages per day for free users
  PRO_DAILY: 100, // 100 messages per day for pro users
}

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
 * Check if user can send more messages
 */
export async function checkUsageLimit(
  userId?: string
): Promise<{ canProceed: boolean; limit: number; remaining: number }> {
  const limit = userId ? await getUserUsageLimit(userId) : USAGE_LIMITS.FREE_DAILY

  // Count messages in last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const supabase = await createClient()
  if (!supabase) {
    return { canProceed: true, limit, remaining: limit }
  }

  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId || null)
    .eq('message_type', 'user')
    .gte('timestamp', twentyFourHoursAgo.toISOString())

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const canProceed = used < limit

  return { canProceed, limit, remaining }
}

/**
 * Get user's usage statistics
 */
export async function getUsageStats(userId?: string) {
  const limit = userId ? await getUserUsageLimit(userId) : USAGE_LIMITS.FREE_DAILY

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const supabase = await createClient()
  if (!supabase) {
    return {
      used: 0,
      limit,
      remaining: limit,
      percentage: 0,
    }
  }

  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId || null)
    .eq('message_type', 'user')
    .gte('timestamp', twentyFourHoursAgo.toISOString())

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const percentage = Math.min(100, (used / limit) * 100)

  return {
    used,
    limit,
    remaining,
    percentage,
  }
}

/**
 * Record a message usage
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

  const record = {
    user_id: userId || null,
    message_type: messageType,
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
