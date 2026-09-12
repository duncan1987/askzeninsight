import 'server-only'

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const ADMIN_GROUP_NAME = '管理组'

// Cross-border network to the Supabase API (auth endpoint and PostgREST
// share the same domain) is flaky: observed 150ms-3000ms latency with
// occasional stalls. supabase-js has no built-in timeout, so a stalled
// call would hang the request forever. Retry with a hard timeout per
// attempt to convert stalls into quick failures the retry loop can
// recover from.
const CALL_TIMEOUT_MS = 8000
const CALL_ATTEMPTS = 3
const RETRY_DELAY_MS = 400

async function withTimeoutAndRetry<T>(fn: () => PromiseLike<T>): Promise<T | null> {
  for (let attempt = 1; attempt <= CALL_ATTEMPTS; attempt++) {
    try {
      return await Promise.race([
        Promise.resolve(fn()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('supabase call timeout')), CALL_TIMEOUT_MS),
        ),
      ])
    } catch {
      // Network error or timeout — fall through to retry
    }
    if (attempt < CALL_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }
  }
  return null
}

/**
 * Whether the current session user is a member of the "管理组" user group.
 * This is the primary way to access the admin console; the legacy
 * ADMIN_SECRET_KEY is only kept as a fallback for API routes.
 */
export async function isAdminGroupUser(): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false

  const result = await withTimeoutAndRetry(() => supabase.auth.getUser())
  if (!result || result.error) return false

  return isUserInAdminGroup(result.data.user.id)
}

/**
 * Whether the given user id belongs to the "管理组" user group.
 */
export async function isUserInAdminGroup(userId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  if (!adminClient) return false

  const groupResult = await withTimeoutAndRetry(() =>
    adminClient
      .from('user_groups')
      .select('id')
      .eq('name', ADMIN_GROUP_NAME)
      .maybeSingle(),
  )
  if (!groupResult || groupResult.error || !groupResult.data) return false
  const adminGroupId: string = groupResult.data.id

  const memberResult = await withTimeoutAndRetry(() =>
    adminClient
      .from('user_group_members')
      .select('id')
      .eq('group_id', adminGroupId)
      .eq('user_id', userId)
      .maybeSingle(),
  )

  return !!memberResult && !memberResult.error && !!memberResult.data
}

/**
 * API-route guard: allows the request through when it either carries the
 * legacy ADMIN_SECRET_KEY header or is made by a session user in "管理组".
 * Returns a 401 NextResponse when unauthorized, null otherwise.
 */
export async function verifyAdminAccess(req: Request): Promise<NextResponse | null> {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
    return null
  }

  if (await isAdminGroupUser()) {
    return null
  }

  return NextResponse.json(
    { error: '登录状态已失效，请重新登录后再试' },
    { status: 401 },
  )
}
