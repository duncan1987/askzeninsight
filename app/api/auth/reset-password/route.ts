import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = body as { token: string; password: string }

    if (!token || !password) {
      return NextResponse.json(
        { error: 'invalidRequest' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'passwordTooWeak' },
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

    const { data: resetToken, error: tokenError } = await adminClient
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'invalidToken' },
        { status: 400 }
      )
    }

    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'tokenUsed' },
        { status: 400 }
      )
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'tokenExpired' },
        { status: 400 }
      )
    }

    // Update the user's password via Supabase admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      resetToken.user_id,
      { password }
    )

    if (updateError) {
      console.error('[Reset Password] Update error:', updateError)
      return NextResponse.json(
        { error: 'resetFailed' },
        { status: 500 }
      )
    }

    // Mark token as used
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    console.log('[Reset Password] Success for user:', resetToken.user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'resetFailed' },
      { status: 500 }
    )
  }
}
