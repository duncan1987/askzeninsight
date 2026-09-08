import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decryptIncomingPassword } from '@/lib/auth-crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password: rawPassword } = body as {
      username: string
      password: string
    }

    if (!username || !rawPassword) {
      return NextResponse.json(
        { error: 'invalidCredentials' },
        { status: 400 }
      )
    }

    // Decrypt the transport-encrypted password (plaintext passes through)
    let password: string
    try {
      password = await decryptIncomingPassword(rawPassword)
    } catch (error) {
      console.error('[Sign-In] Password decryption failed:', error)
      return NextResponse.json(
        { error: 'invalidCredentials' },
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
      .select('id, username, account_status, email')
      .ilike('username', normalizedUsername)
      .maybeSingle()

    if (profileError || !profile) {
      console.log('[Sign-In] User not found:', normalizedUsername)
      return NextResponse.json(
        { error: 'invalidCredentials' },
        { status: 401 }
      )
    }

    if (profile.account_status === 'pending') {
      return NextResponse.json(
        { error: 'accountPending' },
        { status: 403 }
      )
    }

    if (profile.account_status === 'rejected') {
      return NextResponse.json(
        { error: 'accountRejected' },
        { status: 403 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()

    const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie setting can fail in Server Components
          }
        },
      },
    })

    const syntheticEmail = profile.email || `${normalizedUsername}@users.internal`

    const { data: signInData, error: signInError } = await ssrClient.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInError || !signInData.user) {
      console.log('[Sign-In] Invalid credentials for:', normalizedUsername)
      return NextResponse.json(
        { error: 'invalidCredentials' },
        { status: 401 }
      )
    }

    console.log('[Sign-In] Success:', {
      userId: signInData.user.id,
      username: normalizedUsername,
    })

    const response = NextResponse.json({
      success: true,
      userId: signInData.user.id,
    })

    return response
  } catch (error) {
    console.error('[Sign-In] Error:', error)
    return NextResponse.json(
      { error: 'invalidCredentials' },
      { status: 500 }
    )
  }
}
