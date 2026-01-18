/**
 * 订阅流程手动测试脚本 (JavaScript版本)
 *
 * 使用方法:
 * 1. 启动开发服务器: pnpm dev
 * 2. 运行测试: node tests/subscription-test.js
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// 读取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const webhookSecret = process.env.CREEM_WEBHOOK_SECRET || ''
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

if (!supabaseUrl || !serviceRoleKey) {
  log(colors.red, '❌ Missing environment variables. Please set:')
  log(colors.red, '   - NEXT_PUBLIC_SUPABASE_URL')
  log(colors.red, '   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// 生成签名
function generateSignature(payload, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  return `v1=${signature}`
}

// 发送webhook
async function sendWebhook(event) {
  const payload = JSON.stringify(event)
  const signature = generateSignature(payload, webhookSecret)

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

// 获取用户订阅状态
async function getUserTier(accessToken) {
  const response = await fetch(`${siteUrl}/api/user/tier`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.json()
}

// 等待函数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 测试1: 月付订阅
async function testMonthlySubscription() {
  const timestamp = Date.now()
  const email = `test-monthly-${timestamp}@example.com`
  const userId = `user-monthly-${timestamp}`

  log(colors.cyan, '\n🧪 测试场景1: 免费用户 → 月付Pro用户')

  try {
    // 首先创建一个profile（跳过auth用户创建，直接在profiles表插入）
    log(colors.blue, '  1. 创建测试用户profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
      })
    if (profileError) {
      log(colors.red, `     ❌ 创建profile失败: ${profileError.message}`)
      return false
    }
    log(colors.green, `     ✅ Profile创建成功`)

    // 发送月付订阅webhook
    log(colors.blue, '  2. 发送月付订阅webhook...')
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: userId,
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
          referenceId: userId,
          userEmail: email,
          plan: 'pro',
          interval: 'month',
        },
      },
    }

    const webhookResponse = await sendWebhook(webhookPayload)
    if (webhookResponse.ok) {
      log(colors.green, '     ✅ Webhook处理成功')
    } else {
      const text = await webhookResponse.text()
      log(colors.red, `     ❌ Webhook处理失败: ${webhookResponse.status} - ${text}`)
      return false
    }

    // 等待数据库更新
    await sleep(500)

    // 验证数据库记录
    log(colors.blue, '  3. 验证数据库记录...')
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      log(colors.red, `     ❌ 查询失败: ${error.message}`)
      return false
    }

    log(colors.yellow, `     记录内容: ${JSON.stringify(subscription, null, 2)}`)

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
      log(colors.red, `     ❌ 数据库记录不符合预期`)
      if (subscription) {
        log(colors.yellow, `        实际plan: ${subscription.plan}`)
        log(colors.yellow, `        实际interval: ${subscription.interval}`)
        log(colors.yellow, `        实际status: ${subscription.status}`)
      }
      return false
    }

    // 清理测试数据
    log(colors.blue, '  4. 清理测试数据...')
    await supabase.from('subscriptions').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    log(colors.green, '✅ 测试场景1通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景1失败:`, error.message)
    return false
  }
}

// 测试2: 年付订阅
async function testAnnualSubscription() {
  const timestamp = Date.now()
  const email = `test-annual-${timestamp}@example.com`
  const userId = `user-annual-${timestamp}`

  log(colors.cyan, '\n🧪 测试场景2: 免费用户 → 年付Annual用户')

  try {
    log(colors.blue, '  1. 创建测试用户profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
      })
    if (profileError) {
      log(colors.red, `     ❌ 创建profile失败: ${profileError.message}`)
      return false
    }
    log(colors.green, `     ✅ Profile创建成功`)

    log(colors.blue, '  2. 发送年付订阅webhook...')
    const webhookPayload = {
      eventType: 'checkout.completed',
      object: {
        request_id: userId,
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
          referenceId: userId,
          userEmail: email,
          plan: 'annual',
          interval: 'year',
        },
      },
    }

    const webhookResponse = await sendWebhook(webhookPayload)
    if (!webhookResponse.ok) {
      const text = await webhookResponse.text()
      log(colors.red, `     ❌ Webhook处理失败: ${webhookResponse.status} - ${text}`)
      return false
    }
    log(colors.green, '     ✅ Webhook处理成功')

    await sleep(500)

    log(colors.blue, '  3. 验证数据库记录...')
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    log(colors.yellow, `     记录内容: ${JSON.stringify(subscription, null, 2)}`)

    if (
      subscription &&
      subscription.plan === 'annual' &&
      subscription.interval === 'year'
    ) {
      log(colors.green, `     ✅ 数据库记录正确`)
      log(colors.yellow, `        plan: ${subscription.plan}`)
      log(colors.yellow, `        interval: ${subscription.interval}`)
    } else {
      log(colors.red, `     ❌ 数据库记录不符合预期`)
      if (subscription) {
        log(colors.yellow, `        实际plan: ${subscription.plan}`)
        log(colors.yellow, `        实际interval: ${subscription.interval}`)
      }
      return false
    }

    // 清理
    await supabase.from('subscriptions').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    log(colors.green, '✅ 测试场景2通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景2失败:`, error.message)
    return false
  }
}

// 测试3: 订阅取消
async function testSubscriptionCancellation() {
  const timestamp = Date.now()
  const userId = `user-cancel-${timestamp}`

  log(colors.cyan, '\n🧪 测试场景3: 订阅取消')

  try {
    log(colors.blue, '  1. 创建测试用户和订阅...')
    await supabase.from('profiles').insert({
      id: userId,
      email: `test-cancel-${timestamp}@example.com`,
    })

    await supabase.from('subscriptions').insert({
      user_id: userId,
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

    const webhookResponse = await sendWebhook(webhookPayload)
    if (!webhookResponse.ok) {
      log(colors.red, `     ❌ Webhook处理失败`)
      return false
    }
    log(colors.green, '     ✅ Webhook处理成功')

    await sleep(500)

    log(colors.blue, '  3. 验证订阅已取消...')
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single()

    if (subscription?.status === 'cancelled') {
      log(colors.green, `     ✅ 订阅状态已更新为 cancelled`)
    } else {
      log(colors.red, `     ❌ 订阅状态错误: ${subscription?.status}`)
      return false
    }

    // 清理
    await supabase.from('subscriptions').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    log(colors.green, '✅ 测试场景3通过!\n')
    return true
  } catch (error) {
    log(colors.red, `❌ 测试场景3失败:`, error.message)
    return false
  }
}

// 主测试函数
async function runTests() {
  log(colors.cyan, '\n🚀 开始订阅流程测试\n')
  log(colors.yellow, '确保开发服务器正在运行: pnpm dev')
  log(colors.yellow, '确保已配置环境变量:')
  log(colors.yellow, '  - NEXT_PUBLIC_SUPABASE_URL')
  log(colors.yellow, '  - SUPABASE_SERVICE_ROLE_KEY')
  log(colors.yellow, '  - CREEM_WEBHOOK_SECRET\n')

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
    results.test1 = await testMonthlySubscription()
    results.test2 = await testAnnualSubscription()
    results.test3 = await testSubscriptionCancellation()
  } catch (error) {
    log(colors.red, '\n❌ 测试运行出错:', error.message)
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
