/**
 * 测试辅助函数 - 用户认证相关
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export interface TestUser {
  id: string
  email: string
  accessToken: string
}

/**
 * 创建测试用户
 */
export async function createUser(params: {
  email: string
  password: string
}): Promise<TestUser> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Use admin API to create user without email confirmation
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true, // Auto-confirm email
  })

  if (adminError) {
    throw new Error(`Failed to create test user: ${adminError.message}`)
  }

  if (!adminData.user) {
    throw new Error('No user returned from admin.createUser')
  }

  // Now sign in to get a valid session token
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (signInError) {
    throw new Error(`Failed to sign in test user: ${signInError.message}`)
  }

  return {
    id: adminData.user.id,
    email: adminData.user.email!,
    accessToken: signInData.session?.access_token || '',
  }
}

/**
 * 删除测试用户及其相关数据
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // 删除订阅记录
  await supabase.from('subscriptions').delete().eq('user_id', userId)

  // 删除用量记录
  await supabase.from('usage_records').delete().eq('user_id', userId)

  // 删除用户 (ignore error if user doesn't exist)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error && !error.message.includes('User not found')) {
    console.warn(`Warning: Failed to delete test user: ${error.message}`)
  }
}

/**
 * 登录用户并返回token
 */
export async function signIn(params: {
  email: string
  password: string
}): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`)
  }

  return data.session?.access_token || ''
}
