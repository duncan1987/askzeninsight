/**
 * 订阅流程手动测试脚本
 *
 * 使用方法:
 * 1. 确保环境变量已配置
 * 2. 启动开发服务器: pnpm dev
 * 3. 运行测试: npx tsx tests/subscription-test-runner.ts
 */

import { createClient } from '@supabase/supabase-js'

// 读取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color: string, ...args: unknown[]) {
  console.log(color, ...args, colors.reset)
}

// 辅助函数：创建测试用户
async function createTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error('Failed to create user')

  // 获取session
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token || ''

  // 创建profile
  await supabase.from('profiles').insert({
    id: data.user.id,
    email: data.user.email,
  })

  return {
    id: data.user.id,
    email: data.user.email!,
    accessToken,
  }
}

// 辅助函数：删除测试用户
async function deleteTestUser(userId: string) {
  await supabase.from('subscriptions').delete().eq('user_id', userId)
  await supabase.from('profiles').delete().eq('id', userId)
  await supabase.auth.admin.deleteUser(userId)
}

// 辅助函数：生成签名
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  return `v1=${signature}`
}

// 辅助函数：发送webhook
async function sendWebhook(event: unknown, secret: string) {
  const payload = JSON.stringify(event)
  const signature = generateSignature(payload, secret)

  const response = await fetch(`${siteUrl}/api/creem/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'creem-signature': signature,
    },
    body: payload,
  })

  return response
}

// 辅助函数：获取用户订阅状态
async function getUserTier(accessToken: string) {
  const response = await fetch(`${siteUrl}/api/user/tier`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.json()
}

// 测试1：免费用户 → 月付Pro用户
async function testMonthlySubscription(webhookSecret: string) {
  const timestamp = Date.now()
  const email = `test-monthly-${timestamp}@example.com`

  log(colors.cyan, '\n🧪 测试场景1: 免费用户 → 月付Pro用户')

  try {
    // 创建测试用户
    log(colors.blue, '  1. 创建测试用户...')
    const user = await createTestUser(email, 'TestPassword123!')
    log(colors.green, `     ✅ 用户创建成功: ${user.id}`)

    // 验证初始状态
    log(colors.blue, '  2. 验证初始状态...')
    const initialTier = await getUserTier(user.accessToken)
    if (initialTier.tier === 'free' || initialTier.tier === 'anonymous') {
      log(colors.green, `     ✅ 初始状态正确: tier=${initialTier.tier}, plan=${initialTier.plan}`)
    } else {
      log(colors.red, `     ❌ 初始状态错误: ${JSON.stringify(initialTier)}`)
      return false
    }

    // 发送月付订阅webhook
    log(colors.blue, '  3. 发送月付订阅webhook...')
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: user.id,
        subscription: {
          id: `sub_monthly_${timestamp}`,
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
          referenceId: user.id,
          userEmail: user.email,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    const webhookResponse = await sendWebhook(webhookPayload, webhookSecret)
    if (webhookResponse.ok) {
      log(colors.green, '     ✅ Webhook处理成功')
    } else {
      log(colors.red, `     ❌ Webhook处理失败: ${webhookResponse.status}`)
      return false
    }

    // 等待数据库更新
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 验证订阅状态
    log(colors.blue, '  4. 验证订阅状态...')
    const proTier = await getUserTier(user.accessToken)
    log(colors.yellow, `     响应: ${JSON.stringify(proTier)}`)

    if (proTier.tier === 'pro' && proTier.plan === 'pro') {
      log(colors.green, `     ✅ 月付Pro用户状态正确`)
    } else {
      log(colors.red, `     ❌ 月付Pro用户状态错误`)
      return false
    }

    // 验证数据库记录
    log(colors.blue, '  5. 验证数据库记录...')
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      log(colors.red, `     ❌ 查询失败: ${error.message}`)
      return false
    }

    if (
      subscription &&
      subscription.status === 'active' &&
      subscription.plan === 'pro' &&
      subscription.interval === 'month'
    ) {
      log(colors.green, `     ✅ 数据库记录正确`)
      log(colors.yellow, `        plan: ${subscription.plan}`)
      log(colors.yellow, `        interval: ${subscription.interval}`)
      log(colors.yellow, `        status: ${subscription.status}`)
    } else {
      log(colors.red, `     ❌ 数据库记录错误`)
      return false
    }

    // 清理
    await deleteTestUser(user.id)
    log(colors.blue, '  6. 清理测试数据...')

    log(colors.green, '✅ 测试场景1通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景1失败:`, error)
    return false
  }
}

// 测试2：免费用户 → 年付Annual用户
async function testAnnualSubscription(webhookSecret: string) {
  const timestamp = Date.now()
  const email = `test-annual-${timestamp}@example.com`

  log(colors.cyan, '\n🧪 测试场景2: 免费用户 → 年付Annual用户')

  try {
    log(colors.blue, '  1. 创建测试用户...')
    const user = await createTestUser(email, 'TestPassword123!')
    log(colors.green, `     ✅ 用户创建成功: ${user.id}`)

    log(colors.blue, '  2. 发送年付订阅webhook...')
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: user.id,
        subscription: {
          id: `sub_annual_${timestamp}`,
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
          referenceId: user.id,
          userEmail: user.email,
          plan: 'annual',
          interval: 'year',
        },
      },
    }

    const webhookResponse = await sendWebhook(webhookPayload, webhookSecret)
    if (!webhookResponse.ok) {
      log(colors.red, `     ❌ Webhook处理失败: ${webhookResponse.status}`)
      return false
    }
    log(colors.green, '     ✅ Webhook处理成功')

    await new Promise((resolve) => setTimeout(resolve, 500))

    log(colors.blue, '  3. 验证订阅状态...')
    const proTier = await getUserTier(user.accessToken)
    log(colors.yellow, `     响应: ${JSON.stringify(proTier)}`)

    if (proTier.tier === 'pro' && proTier.plan === 'annual') {
      log(colors.green, `     ✅ 年付Annual用户状态正确`)
    } else {
      log(colors.red, `     ❌ 年付Annual用户状态错误`)
      return false
    }

    log(colors.blue, '  4. 验证数据库记录...')
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (
      subscription &&
      subscription.plan === 'annual' &&
      subscription.interval === 'year'
    ) {
      log(colors.green, `     ✅ 数据库记录正确`)
      log(colors.yellow, `        plan: ${subscription.plan}`)
      log(colors.yellow, `        interval: ${subscription.interval}`)
    } else {
      log(colors.red, `     ❌ 数据库记录错误`)
      return false
    }

    await deleteTestUser(user.id)
    log(colors.green, '✅ 测试场景2通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景2失败:`, error)
    return false
  }
}

// 测试3：订阅取消
async function testSubscriptionCancellation(webhookSecret: string) {
  const timestamp = Date.now()
  const email = `test-cancel-${timestamp}@example.com`

  log(colors.cyan, '\n🧪 测试场景3: 订阅取消')

  try {
    log(colors.blue, '  1. 创建测试用户和订阅...')
    const user = await createTestUser(email, 'TestPassword123!')

    // 先创建一个订阅
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      creem_subscription_id: `sub_cancel_${timestamp}`,
      status: 'active',
      plan: 'pro',
      interval: 'month',
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    log(colors.green, `     ✅ 订阅创建成功`)

    log(colors.blue, '  2. 发送取消webhook...')
    const webhookPayload = {
      eventType: 'subscription.canceled',
      object: {
        id: `sub_cancel_${timestamp}`,
        status: 'canceled',
      },
    }

    const webhookResponse = await sendWebhook(webhookPayload, webhookSecret)
    if (!webhookResponse.ok) {
      log(colors.red, `     ❌ Webhook处理失败`)
      return false
    }
    log(colors.green, '     ✅ Webhook处理成功')

    await new Promise((resolve) => setTimeout(resolve, 500))

    log(colors.blue, '  3. 验证订阅已取消...')
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()

    if (subscription?.status === 'cancelled') {
      log(colors.green, `     ✅ 订阅状态已更新为 cancelled`)
    } else {
      log(colors.red, `     ❌ 订阅状态错误: ${subscription?.status}`)
      return false
    }

    await deleteTestUser(user.id)
    log(colors.green, '✅ 测试场景3通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景3失败:`, error)
    return false
  }
}

// 主测试函数
async function runTests() {
  log(colors.cyan, '\n🚀 开始订阅流程测试\n')
  log(colors.yellow, '确保开发服务器正在运行: pnpm dev\n')

  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET || ''

  if (!webhookSecret) {
    log(colors.red, '❌ Missing CREEM_WEBHOOK_SECRET environment variable')
    process.exit(1)
  }

  const results = {
    test1: false,
    test2: false,
    test3: false,
  }

  try {
    results.test1 = await testMonthlySubscription(webhookSecret)
    results.test2 = await testAnnualSubscription(webhookSecret)
    results.test3 = await testSubscriptionCancellation(webhookSecret)
  } catch (error) {
    log(colors.red, '\n❌ 测试运行出错:', error)
  }

  // 打印测试结果摘要
  log(colors.cyan, '\n📊 测试结果摘要:')
  log(colors.yellow, `  测试1 (月付订阅): ${results.test1 ? '✅ 通过' : '❌ 失败'}`)
  log(colors.yellow, `  测试2 (年付订阅): ${results.test2 ? '✅ 通过' : '❌ 失败'}`)
  log(colors.yellow, `  测试3 (订阅取消): ${results.test3 ? '✅ 通过' : '❌ 失败'}`)

  const allPassed = Object.values(results).every((r) => r)
  if (allPassed) {
    log(colors.green, '\n🎉 所有测试通过!\n')
  } else {
    log(colors.red, '\n❌ 部分测试失败，请检查日志\n')
    process.exit(1)
  }
}

runTests()
