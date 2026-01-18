/**
 * 订阅支付流程测试用例
 *
 * 用于测试从免费用户升级到月付/年付用户的完整流程
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createUser, deleteUser, signIn } from './helpers/auth'

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
 * 测试场景1：免费用户 → 月付Pro用户
 */
describe('Subscription Flow: Free → Monthly Pro', () => {
  let testUserId: string
  let testUserEmail: string
  let accessToken: string

  beforeAll(async () => {
    // 创建测试用户
    const user = await createUser({
      email: `test-monthly-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    testUserEmail = user.email
    accessToken = user.accessToken
  })

  afterAll(async () => {
    // 清理测试数据
    await deleteUser(testUserId)
  })

  it('应该从免费用户开始', async () => {
    // 验证用户初始状态为免费用户
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)

    expect(subscriptions).toBeNull()
  })

  it('应该创建月付订阅记录', async () => {
    // 模拟Creem webhook发送checkout.completed事件
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: `sub_monthly_${Date.now()}`,
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
          userEmail: testUserEmail,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    // 调用webhook endpoint
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

  it('应该查询到月付Pro用户状态', async () => {
    // 调用/user/tier API验证订阅状态
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('pro')
    expect(data.plan).toBe('pro')
    expect(data.model).toBe('glm-4.7')
    expect(data.saveHistory).toBe(true)
  })

  it('应该在数据库中正确保存订阅信息', async () => {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    expect(error).toBeNull()
    expect(subscription).toMatchObject({
      user_id: testUserId,
      status: 'active',
      plan: 'pro',
      interval: 'month',
    })
    expect(subscription.current_period_end).toBeTruthy()
  })
})

/**
 * 测试场景2：免费用户 → 年付Annual用户
 */
describe('Subscription Flow: Free → Annual Pro', () => {
  let testUserId: string
  let testUserEmail: string
  let accessToken: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-annual-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    testUserEmail = user.email
    accessToken = user.accessToken
  })

  afterAll(async () => {
    await deleteUser(testUserId)
  })

  it('应该创建年付订阅记录', async () => {
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
          userEmail: testUserEmail,
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

  it('应该查询到年付Pro用户状态', async () => {
    const response = await fetch('http://localhost:3000/api/user/tier', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    expect(data.tier).toBe('pro')
    expect(data.plan).toBe('annual')
    expect(data.model).toBe('glm-4.7')
    expect(data.saveHistory).toBe(true)
  })

  it('应该在数据库中正确保存年付订阅信息', async () => {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    expect(error).toBeNull()
    expect(subscription).toMatchObject({
      user_id: testUserId,
      status: 'active',
      plan: 'annual',
      interval: 'year',
    })
  })
})

/**
 * 测试场景3：订阅续费
 */
describe('Subscription Flow: Renewal', () => {
  let testUserId: string
  let subscriptionId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-renewal-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    subscriptionId = `sub_renewal_${Date.now()}`
  })

  afterAll(async () => {
    await deleteUser(testUserId)
  })

  it('应该处理subscription.paid事件并更新周期结束日期', async () => {
    // 首次订阅
    const firstPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: subscriptionId,
          status: 'active',
          interval: 'month',
          current_period_end_date: '2024-02-01 00:00:00',
        },
        metadata: {
          referenceId: testUserId,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(firstPayload)),
      },
      body: JSON.stringify(firstPayload),
    })

    // 续费
    const renewalPayload = {
      eventType: 'subscription.paid',
      object: {
        id: subscriptionId,
        status: 'active',
        interval: 'month',
        current_period_end_date: '2024-03-01 00:00:00',
        metadata: {
          referenceId: testUserId,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    const response = await fetch('http://localhost:3000/api/creem/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': generateTestSignature(JSON.stringify(renewalPayload)),
      },
      body: JSON.stringify(renewalPayload),
    })

    expect(response.ok).toBe(true)
  })

  it('应该更新订阅周期结束日期', async () => {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', testUserId)
      .single()

    expect(subscription?.current_period_end).toContain('2024-03-01')
  })
})

/**
 * 测试场景4：订阅取消
 */
describe('Subscription Flow: Cancellation', () => {
  let testUserId: string
  let subscriptionId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-cancel-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    subscriptionId = `sub_cancel_${Date.now()}`

    // 创建初始订阅
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
    await deleteUser(testUserId)
  })

  it('应该处理subscription.canceled事件', async () => {
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

  it('应该将订阅状态更新为cancelled', async () => {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', testUserId)
      .single()

    expect(subscription?.status).toBe('cancelled')
  })

  it('取消后用户应该降级为免费用户', async () => {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    // 由于订阅已取消，用户应该不再有active订阅
    expect(subscription?.status).not.toBe('active')
  })
})

/**
 * 测试场景5：月付用户升级为年付用户
 */
describe('Subscription Flow: Monthly → Annual Upgrade', () => {
  let testUserId: string
  let monthlySubId: string
  let annualSubId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-upgrade-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
    monthlySubId = `sub_monthly_upgrade_${Date.now()}`
    annualSubId = `sub_annual_upgrade_${Date.now()}`

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
  })

  afterAll(async () => {
    await deleteUser(testUserId)
  })

  it('应该处理升级到年付订阅', async () => {
    // 取消月付订阅
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('creem_subscription_id', monthlySubId)

    // 创建年付订阅
    const payload = {
      eventType: 'checkout.completed',
      object: {
        request_id: testUserId,
        subscription: {
          id: annualSubId,
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
          plan: 'annual',
          interval: 'year',
        },
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

  it('应该正确保存年付订阅信息', async () => {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .eq('plan', 'annual')
      .single()

    expect(subscription).toMatchObject({
      plan: 'annual',
      interval: 'year',
      status: 'active',
    })
  })
})

/**
 * 辅助函数：生成测试签名
 * 注意：仅用于测试环境，不要在生产环境使用
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
