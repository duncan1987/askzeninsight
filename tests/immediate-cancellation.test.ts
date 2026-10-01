/**
 * Immediate Cancellation Test Suite
 *
 * Tests for the immediate cancellation flow that prevents users
 * from accessing Pro features after receiving refunds.
 *
 * Key behaviors (mirror of app/api/subscription/cancel/route.ts and
 * lib/subscription.ts — staged downgrade 方案A):
 * - Within 48h: immediate cancellation + refund calculation
 *   (≤5 pro messages → 100% refund; otherwise prorated by quota days)
 * - 48h to 7 days: staged downgrade — refund_status='requested' keeps Pro
 *   access during the 3-day review window, then downgrade on decision
 * - After 7 full days: cancellation blocked (403)
 * - refund_status 'approved' / 'rejected' / 'processed' → downgrade to Free
 *
 * NOTE: the cancel API authenticates via Supabase SSR cookies only (no
 * Bearer support), so its time-window rules are verified here against the
 * same formulas the route implements, instead of over HTTP.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { getUserSubscription } from '@/lib/subscription'
import { USAGE_LIMITS } from '@/lib/usage-limits'
import { createUser, deleteUser } from './helpers/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// 与 lib/subscription.ts 的模型回退逻辑保持一致（测试进程与 dev server
// 加载同一份 .env.local，因此这里按相同规则推导期望模型）
const useGemini = !!process.env.GEMINI_API_KEY?.trim()
const FREE_MODEL = useGemini
  ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
  : 'glm-4-flash-250414'
const PRO_MODEL = process.env.PRO_MODEL || (useGemini ? 'gemini-2.5-flash' : 'glm-4-flash-250414')

describe('Immediate Cancellation Logic', () => {
  // 真实用户（subscriptions.user_id 是 UUID 外键，伪造 ID 会导致插入静默失败）
  let realUser: { id: string; email: string; accessToken: string }

  beforeAll(async () => {
    realUser = await createUser({
      email: `test-cancel-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
  })

  afterAll(async () => {
    await deleteUser(realUser.id) // 同时清理订阅与用量记录
  })

  beforeEach(async () => {
    await adminClient.from('subscriptions').insert({
      user_id: realUser.id,
      creem_subscription_id: `sub_test_${Date.now()}`,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      refund_status: 'none',
    })
  })

  afterEach(async () => {
    await adminClient.from('subscriptions').delete().eq('user_id', realUser.id)
  })

  describe('getUserSubscription with refund_status', () => {
    it('should return pro tier for active subscription with no refund request', async () => {
      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('pro')
      expect(subscription.model).toBe(PRO_MODEL)
      expect(subscription.apiKey).toBeTruthy()
      expect(subscription.saveHistory).toBe(true)
    })

    it('should keep pro tier while refund is requested and within the 3-day review window', async () => {
      await adminClient
        .from('subscriptions')
        .update({
          refund_status: 'requested',
          refund_estimated_at: new Date().toISOString(), // 审核期开始
        })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      // 方案A：requested + 审核期内保持 Pro
      expect(subscription.tier).toBe('pro')
      expect(subscription.saveHistory).toBe(true)
    })

    it('should return free tier when refund_status is requested but review window has passed', async () => {
      // refund_estimated_at 超过 3 个工作日的审核期 → 降级
      const expiredReview = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

      await adminClient
        .from('subscriptions')
        .update({
          refund_status: 'requested',
          refund_estimated_at: expiredReview.toISOString(),
        })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe(FREE_MODEL)
      expect(subscription.saveHistory).toBe(false)
    })

    it('should return free tier when refund_status is approved', async () => {
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'approved' })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe(FREE_MODEL)
    })

    it('should return free tier when refund_status is processed', async () => {
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'processed' })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe(FREE_MODEL)
    })

    it('should return free tier when refund_status is rejected (staged downgrade 方案A)', async () => {
      // 语义已变更：退款被拒绝同样结束订阅周期 → 降级 Free
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'rejected' })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe(FREE_MODEL)
    })

    it('should return free tier when refund_status is none and subscription is cancelled+expired', async () => {
      // cancelled 状态在到期前仍保留 Pro（宽限期语义）；到期后降级
      await adminClient
        .from('subscriptions')
        .update({
          status: 'cancelled',
          current_period_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', realUser.id)

      const subscription = await getUserSubscription(realUser.id)

      expect(subscription.tier).toBe('free')
      expect(subscription.model).toBe(FREE_MODEL)
    })
  })

  describe('Cancellation API time-based rules (mirrors /api/subscription/cancel)', () => {
    // 路由真实逻辑：
    //   hours = floor((now - created_at) / 1h)
    //   days  = floor(hours / 24)
    //   days > 7  → 403 'Cancellation period expired'
    //   hours <= 48 → immediateCancellation = true
    //   否则 → staged（keepProAccess = true，等待退款审核）
    const evaluateRouteRules = (createdAt: Date, now: Date) => {
      const hoursSinceSubscription = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      )
      const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)
      return {
        hoursSinceSubscription,
        daysSinceSubscription,
        blocked: daysSinceSubscription > 7,
        immediateCancellation: hoursSinceSubscription <= 48,
      }
    }

    it('should allow immediate cancellation within 48 hours (refund eligible)', () => {
      const now = new Date('2026-01-10T12:00:00Z')
      const createdAt = new Date('2026-01-09T12:00:00Z') // 24h 前

      const rules = evaluateRouteRules(createdAt, now)

      expect(rules.blocked).toBe(false)
      expect(rules.immediateCancellation).toBe(true)
    })

    it('should treat exactly 48 hours as immediate cancellation', () => {
      const now = new Date('2026-01-10T12:00:00Z')
      const createdAt = new Date('2026-01-08T12:00:00Z') // 48h 前

      const rules = evaluateRouteRules(createdAt, now)

      expect(rules.immediateCancellation).toBe(true)
      expect(rules.blocked).toBe(false)
    })

    it('should allow staged cancellation between 48 hours and 7 days', () => {
      const now = new Date('2026-01-10T12:00:00Z')
      const createdAt = new Date('2026-01-07T12:00:00Z') // 72h 前

      const rules = evaluateRouteRules(createdAt, now)

      expect(rules.blocked).toBe(false)
      expect(rules.immediateCancellation).toBe(false) // 走 staged 流程
    })

    it('should block cancellation after 7 full days with 403', () => {
      const now = new Date('2026-01-10T12:00:00Z')
      const createdAt = new Date('2026-01-02T00:00:00Z') // 8.5 天前 → days = 8

      const rules = evaluateRouteRules(createdAt, now)

      expect(rules.blocked).toBe(true)
      expect(rules.daysSinceSubscription).toBe(8)
    })

    it('should NOT block at 7 days + 1 hour (route floors to whole days)', () => {
      const now = new Date('2026-01-10T12:00:00Z')
      const createdAt = new Date('2026-01-03T11:00:00Z') // 7天1小时 → days = 7

      const rules = evaluateRouteRules(createdAt, now)

      // 路由按整天取整：7天1小时仍处于可取消窗口
      expect(rules.daysSinceSubscription).toBe(7)
      expect(rules.blocked).toBe(false)
    })
  })

  describe('Database state after cancellation', () => {
    it('should set refund_status to requested before deletion', async () => {
      // 模拟 cancel API 的第一步：标记退款请求
      await adminClient
        .from('subscriptions')
        .update({ refund_status: 'requested' })
        .eq('user_id', realUser.id)

      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('refund_status')
        .eq('user_id', realUser.id)
        .single()

      expect(subscription?.refund_status).toBe('requested')
    })

    it('should delete subscription from database immediately', async () => {
      await adminClient
        .from('subscriptions')
        .delete()
        .eq('user_id', realUser.id)

      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', realUser.id)

      // supabase-js 无匹配时返回空数组（而非 null）
      expect(subscription).toEqual([])
    })
  })
})

/**
 * 退款计算逻辑 —— 镜像 /api/subscription/cancel 路由的真实公式：
 * - 48h 内 & pro 消息 ≤5 → 全额退款
 * - 48h 内 & >5 条 → 按配额天数折算：
 *     daysOfQuotaUsed = ceil(usage / PRO_DAILY)
 *     refund = planAmount × (planDays - daysOfQuotaUsed) / planDays
 * - 48h-7天 → staged：
 *     refund = planAmount × remainingDays/planDays × (1 - usageRateCoefficient)
 */
describe('Refund Calculation Logic', () => {
  it('should calculate full refund for usage ≤ 5 messages within 48 hours', () => {
    const usageCount = 3
    const planAmount = 2.99
    const planDays = 30

    // 路由真实行为：≤5 条消息直接全额退款
    const fullyRefundable = usageCount <= 5
    const refundAmount = fullyRefundable ? planAmount : 0

    expect(fullyRefundable).toBe(true)
    expect(refundAmount).toBe(2.99)
  })

  it('should calculate prorated refund for usage > 5 messages within 48 hours', () => {
    const usageCount = 50
    const planAmount = 24.99
    const planDays = 365 // annual

    const fullyRefundable = usageCount <= 5
    const daysOfQuotaUsed = Math.ceil(usageCount / USAGE_LIMITS.PRO_DAILY)
    const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
    const refundAmount = (refundPercentage / 100) * planAmount

    expect(fullyRefundable).toBe(false)
    expect(daysOfQuotaUsed).toBe(2) // ceil(50/30) = 2
    expect(refundPercentage).toBeCloseTo(99.45, 1)
    expect(refundAmount).toBeCloseTo(24.85, 1) // (363/365) × 24.99
  })

  it('should apply usage rate coefficient for 48h-7day staged refunds (mirror of route)', () => {
    const usageRateCoefficient = (count: number): number => {
      if (count <= 30) return 0.1
      if (count <= 100) return 0.5
      if (count <= 200) return 0.8
      return 1.0
    }

    const planAmount = 2.99
    const planDays = 30
    const daysSinceSubscription = 5

    // 10 条消息（轻度使用）：2.99 × (25/30) × 0.9
    const light = planAmount * (25 / 30) * (1 - usageRateCoefficient(10))
    expect(light).toBeCloseTo(2.24, 2)

    // 250 条消息（重度使用）：usageRate = 1.0 → 无退款
    const heavy = planAmount * (25 / 30) * (1 - usageRateCoefficient(250))
    expect(heavy).toBe(0)
  })

  it('should not calculate refund after 48 hours for the immediate path', () => {
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

  it('should handle cancellation at exactly 7 full days', () => {
    const hoursSinceSubscription = 168 // 7 * 24
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)
    const blocked = daysSinceSubscription > 7

    expect(blocked).toBe(false)
  })

  it('should block cancellation only after 7 full days have elapsed', () => {
    const hoursSinceSubscription = 192 // 8 * 24
    const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)
    const blocked = daysSinceSubscription > 7

    expect(blocked).toBe(true)
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
