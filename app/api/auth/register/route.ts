import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateUsername } from '@/lib/username'
import { validatePassword } from '@/lib/password'
import { decryptIncomingPassword } from '@/lib/auth-crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, nickname, password: rawPassword } = body as {
      username: string
      nickname: string
      password: string
    }

    if (!username || !nickname || !rawPassword) {
      return NextResponse.json(
        { error: 'username, nickname, and password are required' },
        { status: 400 }
      )
    }

    // Decrypt the transport-encrypted password (plaintext passes through)
    let password: string
    try {
      password = await decryptIncomingPassword(rawPassword)
    } catch (error) {
      console.error('[Register] Password decryption failed:', error)
      return NextResponse.json(
        { error: 'registerFailed' },
        { status: 400 }
      )
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: usernameValidation.errorKey },
        { status: 400 }
      )
    }

    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
      return NextResponse.json(
        { error: 'nicknameTooShort' },
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

    const normalizedUsername = username.toLowerCase()

    const { data: existingProfile, error: usernameCheckError } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('username', normalizedUsername)
      .maybeSingle()

    if (usernameCheckError) {
      console.error('[Register] Username check error:', usernameCheckError)
      return NextResponse.json(
        { error: 'registerFailed' },
        { status: 500 }
      )
    }

    if (existingProfile) {
      return NextResponse.json(
        { error: 'usernameExists' },
        { status: 409 }
      )
    }

    const syntheticEmail = `${normalizedUsername}@users.internal`

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUsername,
        full_name: nickname.trim(),
        account_status: 'pending',
      },
    })

    if (createError) {
      console.error('[Register] Create user error:', createError)

      if (createError.message?.includes('already been registered') || createError.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'usernameExists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'registerFailed' },
        { status: 500 }
      )
    }

    console.log('[Register] User created successfully:', {
      userId: userData.user?.id,
      username: normalizedUsername,
      email: syntheticEmail,
    })

    return NextResponse.json({
      success: true,
      message: 'registerPendingApproval',
      userId: userData.user?.id,
    })
  } catch (error) {
    console.error('[Register] Error:', error)
    return NextResponse.json(
      { error: 'registerFailed' },
      { status: 500 }
    )
  }
}
