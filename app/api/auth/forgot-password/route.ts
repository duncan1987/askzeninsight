import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username } = body as { username: string }

    if (!username) {
      return NextResponse.json(
        { error: 'usernameRequired' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const normalizedUsername = username.toLowerCase()

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, username, account_status')
      .ilike('username', normalizedUsername)
      .maybeSingle()

    // Don't leak whether the username exists
    if (profileError || !profile) {
      console.log('[Forgot Password] User not found:', normalizedUsername)
      return NextResponse.json({ success: true })
    }

    if (profile.account_status !== 'approved') {
      // Don't reveal account status either
      return NextResponse.json({ success: true })
    }

    // Invalidate previous unused tokens for this user
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .is('used_at', null)
      .eq('user_id', profile.id)

    // Create a new token valid for 24 hours
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await adminClient
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        token,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('[Forgot Password] Token insert error:', insertError)
      return NextResponse.json(
        { error: 'requestFailed' },
        { status: 500 }
      )
    }

    console.log('[Forgot Password] Reset requested for:', normalizedUsername)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json(
      { error: 'requestFailed' },
      { status: 500 }
    )
  }
}
