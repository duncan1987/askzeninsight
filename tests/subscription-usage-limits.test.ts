/**
 * 订阅用量限制和AI模型切换测试用例
 *
 * 用于测试不同订阅层级（免费、Pro、Annual）下：
 * 1. 消息用量限制的正确性（Free 10条/天，Pro 30条/天）
 * 2. AI模型的正确切换（模型由环境变量驱动，见 lib/subscription.ts）
 * 3. 升级/降级时的限制和模型更新
 * 4. Pro 计数按 user_tier + subscription_id 过滤（换计划计数重置）
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createUser, deleteUser, signIn } from './helpers/auth'

// 与 lib/usage-limits.ts USAGE_LIMITS 保持一致
const FREE_DAILY_LIMIT = 10
const PRO_DAILY_LIMIT = 30

// 与 lib/subscription.ts 的模型回退逻辑保持一致（测试进程与 dev server
// 加载同一份 .env.local，因此这里按相同规则推导期望模型）
const useGemini = !!process.env.GEMINI_API_KEY?.trim()
const FREE_MODEL = useGemini
  ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
  : 'glm-4-flash-250414'
const PRO_MODEL = process.env.PRO_MODEL || (useGemini ? 'gemini-2.5-flash' : 'glm-4-flash-250414')

// 测试环境配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

/**
 * 辅助函数：生成测试签名
 */
function generateTestSignature(payload: string): string {
  const crypto = require('crypto')
  const secret = process.env.CREEM_WEBHOOK_SECRET || 'test_secret'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  return `v1=${signature}`
}

/**
 * 辅助函数：创建测试用量记录
 *
 * usage_records.user_tier 是 NOT NULL 且无默认值；Pro 用户的计数查询还会
 * 过滤 subscription_id（换计划后计数重置），因此这里必须带上正确的层级
 * 与订阅 ID。
 */
async function createUsageRecords(
  userId: string,
  count: number,
  userTier: 'free' | 'pro' = 'free',
  subscriptionId?: string
): Promise<void> {
  const records = Array.from({ length: count }, () => ({
    user_id: userId,
    message_type: 'user' as const,
    user_tier: userTier,
    ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
    timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(), // 最近12小时内
  }))

  const { error } = await supabase.from('usage_records').insert(records)
  if (error) {
    throw new Error(`Failed to create usage records: ${error.message}`)
  }
}

/**
 * 辅助函数：清理测试用量记录
 */
async function clearUsageRecords(userId: string): Promise<void> {
  await supabase.from('usage_records').delete().eq('user_id', userId)
}

/**
 * 测试场景1：免费用户的初始状态验证
 */
describe('Usage Limits: Free User Initial State', () => {
  let testUserId: string | undefined
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-free-initial-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('应该返回免费用户层级', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('free')
    expect(data.plan).toBeNull()
    expect(data.model).toBe(FREE_MODEL)
    expect(data.saveHistory).toBe(false)
  })

  it(`应该有正确的每日消息限制（${FREE_DAILY_LIMIT}条）`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.limit).toBe(FREE_DAILY_LIMIT)
    expect(data.used).toBe(0)
    expect(data.remaining).toBe(FREE_DAILY_LIMIT)
  })

  it('应该使用基础AI模型', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.model).toBe(FREE_MODEL)
    expect(data.apiKey).toBeDefined()
  })
})

/**
 * 测试场景2：免费用户升级到Pro后用量限制和模型更新
 */
describe('Usage Limits: Free → Pro Upgrade', () => {
  let testUserId: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-free-to-pro-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('应该正确处理Pro订阅创建', async () => {
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_pro_${Date.now()}`,
          status: 'active',
          interval: 'month',
          current_period_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
        metadata: {
          referenceId: testUserId,
          userEmail: `test-free-to-pro-${Date.now()}@supabase.test`,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    const response = await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(webhookPayload)),
      },
      body: JSON.stringify(webhookPayload),
    })

    expect(response.ok).toBe(true)
  })

  it('应该更新为Pro用户层级', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('pro')
    expect(data.plan).toBe('pro')
  })

  it(`应该更新每日消息限制为${PRO_DAILY_LIMIT}条`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.limit).toBe(PRO_DAILY_LIMIT)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT)
  })

  it('应该升级到高级AI模型', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.model).toBe(PRO_MODEL)
    expect(data.saveHistory).toBe(true)
  })

  it('应该使用Pro API密钥', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.apiKey).toBeDefined()
    expect(data.apiKey).not.toBe('')
  })
})

/**
 * 测试场景3：免费用户升级到Annual后用量限制和模型更新
 */
describe('Usage Limits: Free → Annual Upgrade', () => {
  let testUserId: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-free-to-annual-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('应该正确处理Annual订阅创建', async () => {
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_annual_${Date.now()}`,
          status: 'active',
          interval: 'year',
          current_period_end_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
        metadata: {
          referenceId: testUserId,
          userEmail: `test-free-to-annual-${Date.now()}@supabase.test`,
          plan: 'annual',
          interval: 'year',
        },
      },
    }

    const response = await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(webhookPayload)),
      },
      body: JSON.stringify(webhookPayload),
    })

    expect(response.ok).toBe(true)
  })

  it('应该更新为Pro用户层级（Annual也属于pro tier）', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('pro')
    expect(data.plan).toBe('annual')
  })

  it(`应该更新每日消息限制为${PRO_DAILY_LIMIT}条`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.limit).toBe(PRO_DAILY_LIMIT)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT)
  })

  it('应该升级到高级AI模型', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.model).toBe(PRO_MODEL)
    expect(data.saveHistory).toBe(true)
  })
})

/**
 * 测试场景4：Pro用户订阅取消后降级为免费用户
 */
describe('Usage Limits: Pro → Free Downgrade', () => {
  let testUserId: string
  let accessToken: string
  let subscriptionId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-pro-to-free-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken
    subscriptionId = `sub_cancel_${Date.now()}`

    // 创建Pro订阅
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      creem_subscription_id: subscriptionId,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('应该处理订阅取消事件', async () => {
    const payload = {
      eventType: 'subscription.canceled',
      object: {
        id: subscriptionId,
        status: 'canceled',
      },
    }

    const response = await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(payload)),
      },
      body: JSON.stringify(payload),
    })

    expect(response.ok).toBe(true)
  })

  it('应该降级为免费用户层级', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('free')
    expect(data.plan).toBeNull()
  })

  it(`应该恢复免费用户的每日消息限制（${FREE_DAILY_LIMIT}条）`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.limit).toBe(FREE_DAILY_LIMIT)
  })

  it('应该降级到基础AI模型', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.model).toBe(FREE_MODEL)
    expect(data.saveHistory).toBe(false)
  })
})

/**
 * 测试场景5：实际使用量统计验证
 */
describe('Usage Limits: Actual Usage Statistics', () => {
  let testUserId: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-usage-stats-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken

    // 创建3条使用记录（free 层级）
    await createUsageRecords(testUserId, 3, 'free')
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('免费用户应该正确统计已使用消息数', async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.used).toBe(3)
    expect(data.remaining).toBe(FREE_DAILY_LIMIT - 3)
    expect(data.limit).toBe(FREE_DAILY_LIMIT)
  })

  it('应该正确计算使用百分比', async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.percentage).toBe(30) // 3/10 = 30%
  })

  it('升级到Pro后剩余消息数应该更新', async () => {
    // 先升级到Pro
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_usage_${Date.now()}`,
          status: 'active',
          interval: 'month',
          current_period_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
        metadata: {
          referenceId: testUserId,
          userEmail: `test-usage-stats-${Date.now()}@supabase.test`,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(webhookPayload)),
      },
      body: JSON.stringify(webhookPayload),
    })

    // 检查用量统计
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    // 升级后计数按 pro + 新订阅 ID 过滤，free 层级的历史用量不再计入
    // （换计划计数重置，见 lib/usage-limits.ts）
    expect(data.limit).toBe(PRO_DAILY_LIMIT)
    expect(data.used).toBe(0)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT)
  })
})

/**
 * 测试场景6：用量超限后的行为
 */
describe('Usage Limits: Exceeding Limits', () => {
  let testUserId: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-exceed-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken

    // 创建 FREE_DAILY_LIMIT 条使用记录（达到免费用户限制）
    await createUsageRecords(testUserId, FREE_DAILY_LIMIT, 'free')
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('免费用户达到限制后应该被阻止', async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.canProceed).toBe(false)
    expect(data.remaining).toBe(0)
  })

  it('升级到Pro后应该可以继续发送消息', async () => {
    // 升级到Pro
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_exceed_${Date.now()}`,
          status: 'active',
          interval: 'month',
          current_period_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
        metadata: {
          referenceId: testUserId,
          userEmail: `test-exceed-${Date.now()}@supabase.test`,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(webhookPayload)),
      },
      body: JSON.stringify(webhookPayload),
    })

    // 检查是否可以继续发送
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    // Pro 计数按新订阅过滤，free 层级用量不结转 → 计数重置
    expect(data.canProceed).toBe(true)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT)
  })
})

/**
 * 测试场景7：Pro用户超出配额后的降级行为
 */
describe('Usage Limits: Pro Premium Quota Exceeded', () => {
  let testUserId: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-quota-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken

    // 创建Pro订阅
    const subscriptionId = `sub_quota_${Date.now()}`
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      creem_subscription_id: subscriptionId,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })

    // 查回订阅的数据库 UUID（Pro 计数按 subscription_id 过滤）
    const { data: quotaSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('creem_subscription_id', subscriptionId)
      .single()

    // 创建 PRO_DAILY_LIMIT 条 pro 层级使用记录（达到Pro用户限制）
    await createUsageRecords(testUserId, PRO_DAILY_LIMIT, 'pro', quotaSub?.id)
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it('Pro用户超出配额后isWithinPremiumQuota应该返回false', async () => {
    const { getUserSubscription } = await import('@/lib/subscription')
    const { isWithinPremiumQuota } = await import('@/lib/usage-limits')

    const subscription = await getUserSubscription(testUserId)
    expect(subscription.tier).toBe('pro')

    const withinQuota = await isWithinPremiumQuota(testUserId)
    expect(withinQuota).toBe(false)
  })

  it('Pro用户超出配额后仍可发送消息（公平使用策略：降级模型而非阻断）', async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    // 现行为：Pro 用户永不阻断，超出配额后由 isWithinPremiumQuota
    // 触发降级到基础模型（见 lib/usage-limits.ts checkUsageLimit）
    expect(data.canProceed).toBe(true)
    expect(data.remaining).toBe(0)
  })
})

/**
 * 测试场景8：月付Pro用户升级为年付用户
 */
describe('Usage Limits: Monthly → Annual Upgrade', () => {
  let testUserId: string
  let accessToken: string
  let monthlySubId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-monthly-to-annual-${Date.now()}@supabase.test`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    accessToken = user.accessToken
    monthlySubId = `sub_monthly_upgrade_${Date.now()}`

    // 创建月付订阅
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      creem_subscription_id: monthlySubId,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })

    // 查回月付订阅的数据库 UUID（Pro 计数按 subscription_id 过滤）
    const { data: monthlySub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('creem_subscription_id', monthlySubId)
      .single()

    // 创建3条 pro 层级使用记录，挂在月付订阅下
    await createUsageRecords(testUserId, 3, 'pro', monthlySub?.id)
  })

  afterAll(async () => {
    if (testUserId) {
      await clearUsageRecords(testUserId)
      await deleteUser(testUserId)
    }
  })

  it(`月付Pro用户应该有${PRO_DAILY_LIMIT}条消息限制`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.limit).toBe(PRO_DAILY_LIMIT)
    expect(data.used).toBe(3)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT - 3)
  })

  it('应该能升级到年付订阅', async () => {
    // 取消月付订阅
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('creem_subscription_id', monthlySubId)

    // 创建年付订阅
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_annual_upgrade_${Date.now()}`,
          status: 'active',
          interval: 'year',
          current_period_end_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
        metadata: {
          referenceId: testUserId,
          userEmail: `test-monthly-to-annual-${Date.now()}@supabase.test`,
          plan: 'annual',
          interval: 'year',
        },
      },
    }

    const response = await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(webhookPayload)),
      },
      body: JSON.stringify(webhookPayload),
    })

    expect(response.ok).toBe(true)
  })

  it('升级后应该保持Pro tier和plan为annual', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('pro')
    expect(data.plan).toBe('annual')
  })

  it(`升级后应该保持${PRO_DAILY_LIMIT}条消息限制且计数重置`, async () => {
    const response = await fetch('http://localhost:3000/api/usage/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    // 换计划（月付→年付）后按新订阅 ID 计数 → 用量清零
    expect(data.limit).toBe(PRO_DAILY_LIMIT)
    expect(data.used).toBe(0)
    expect(data.remaining).toBe(PRO_DAILY_LIMIT)
  })

  it('升级后应该继续使用高级AI模型', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.model).toBe(PRO_MODEL)
    expect(data.saveHistory).toBe(true)
  })
})
