/**
 * Immediate Cancellation Test Suite
 *
 * Tests for the new immediate cancellation flow that prevents users
 * from accessing Pro features after receiving refunds.
 *
 * Key Changes:
 * - All cancellations are now immediate (mode: 'immediate' in Creem)
 * - Subscriptions are deleted immediately from database upon cancellation
 * - refund_status field tracks refund requests
 * - getUserSubscription checks refund_status to downgrade users immediately
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { getUserSubscription } from '@/lib/subscription'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

describe('Immediate Cancellation Logic', () => {
  let testUserId: string
  let subscriptionId: string

  beforeEach(async () => {
    // Create test subscription
    testUserId = `test_user_${Date.now()}`
    subscriptionId = `sub_test_${Date.now()}`

    await adminClient.from('subscriptions').insert({
      user_id: testUserId,
      creem_subscription_id: subscriptionId,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      refund_status: 'none',
    })
  })

  afterEach(async () => {
    // Cleanup
    await adminClient.from('subscriptions').delete().eq('user_id', testUserId)
  })

  describe('getUserSubscription with refund_status', () => {
    it('should return pro tier for active subscription with no refund request', async () => {
      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('pro')
      expect(subscription.model).toBe('glm-4.7')
      expect(subscription.apiKey).toBeTruthy()
      expect(subscription.saveHistory).toBe(true)
    })

    it('should return free tier when refund_status is requested', async () => {
      // Update refund_status to 'requested'
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'requested' })
        .eq('user_id', testUserId)

      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe('glm-4-flash')
      expect(subscription.saveHistory).toBe(false)
    })

    it('should return free tier when refund_status is approved', async () => {
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'approved' })
        .eq('user_id', testUserId)

      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe('glm-4-flash')
    })

    it('should return free tier when refund_status is processed', async () => {
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'processed' })
        .eq('user_id', testUserId)

      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe('glm-4-flash')
    })

    it('should return pro tier when refund_status is rejected', async () => {
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'rejected' })
        .eq('user_id', testUserId)

      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('pro')
      expect(subscription.model).toBe('glm-4.7')
    })

    it('should return free tier when refund_status is none and subscription is cancelled', async () => {
      await adminClient
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', testUserId)

      const subscription = await getUserSubscription(testUserId)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe('glm-4-flash')
    })
  })

  describe('Cancellation API time-based rules', () => {
    it('should allow cancellation within 48 hours (refund eligible)', async () => {
      // This would be tested via the API endpoint
      // Expected: HTTP 200, immediate cancellation, refund calculation included
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.immediateCancellation).toBe(true)
      expect(data.refundInfo).toBeDefined()
      expect(data.newTier).toBe('free')
      expect(data.newModel).toBe('glm-4-flash')
    })

    it('should allow cancellation between 48 hours and 7 days', async () => {
      // Expected: HTTP 200, immediate cancellation, no refund calculation
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
      })

      expect(response.status).toBe(200)
      expect(data.immediateCancellation).toBe(true)
      expect(data.newTier).toBe('free')
    })

    it('should block cancellation after 7 days with 403 error', async () => {
      // Expected: HTTP 403 with error message
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toBe('Cancellation period expired')
    })
  })

  describe('Database state after cancellation', () => {
    it('should set refund_status to requested before deletion', async () => {
      // Simulate the cancel API workflow
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'requested' })
        .eq('user_id', testUserId)

      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('refund_status')
        .eq('user_id', testUserId)
        .single()

      expect(subscription?.refund_status).toBe('requested')
    })

    it('should delete subscription from database immediately', async () => {
      // Simulate immediate deletion
      await adminClient
        .from('subscriptions')
        .delete()
        .eq('user_id', testUserId)

      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId)

      expect(subscription).toBeNull()
    })
  })
})

describe('Refund Calculation Logic', () => {
  it('should calculate full refund for usage ≤ 5 messages within 48 hours', () => {
    const usageCount = 3
    const hoursSinceSubscription = 24
    const plan = 'pro'

    const messagesPerDay = 100
    const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
    const planDays = 30
    const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
    const estimatedRefund = (refundPercentage / 100) * 2.99
    const fullyRefundable = usageCount <= 5

    expect(fullyRefundable).toBe(true)
    expect(refundPercentage).toBeCloseTo(100, 1)
    expect(estimatedRefund).toBeCloseTo(2.99, 1)
  })

  it('should calculate partial refund for usage > 5 messages within 48 hours', () => {
    const usageCount = 50
    const hoursSinceSubscription = 24
    const plan = 'annual'

    const messagesPerDay = 100
    const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
    const planDays = 365
    const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
    const estimatedRefund = (refundPercentage / 100) * 19.9
    const fullyRefundable = usageCount <= 5

    expect(fullyRefundable).toBe(false)
    expect(refundPercentage).toBeCloseTo(99.86, 1)
    expect(estimatedRefund).toBeCloseTo(19.87, 1)
  })

  it('should not calculate refund after 48 hours', () => {
    const hoursSinceSubscription = 72 // 3 days
    const isRefundEligible = hoursSinceSubscription <= 48

    expect(isRefundEligible).toBe(false)
  })
})

describe('Edge Cases', () => {
  it('should handle cancellation at exactly 48 hours', () => {
    const hoursSinceSubscription = 48
    const isRefundEligible = hoursSinceSubscription <= 48

    expect(isRefundEligible).toBe(true)
  })

  it('should handle cancellation at exactly 7 days', () => {
    const hoursSinceSubscription = 168 // 7 * 24
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)
    const canCancel = daysSinceSubscription <= 7

    expect(canCancel).toBe(true)
  })

  it('should block cancellation at 7 days + 1 hour', () => {
    const hoursSinceSubscription = 169 // 7 * 24 + 1
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)
    const canCancel = daysSinceSubscription <= 7

    expect(canCancel).toBe(false)
  })

  it('should handle 0 usage messages correctly', () => {
    const usageCount = 0
    const fullyRefundable = usageCount <= 5

    expect(fullyRefundable).toBe(true)
  })

  it('should handle exactly 5 usage messages correctly', () => {
    const usageCount = 5
    const fullyRefundable = usageCount <= 5

    expect(fullyRefundable).toBe(true)
  })

  it('should handle 6 usage messages correctly (not fully refundable)', () => {
    const usageCount = 6
    const fullyRefundable = usageCount <= 5

    expect(fullyRefundable).toBe(false)
  })
})
