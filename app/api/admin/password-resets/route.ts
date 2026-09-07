import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function verifyAdmin(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }
  return null
}

export async function GET(req: Request) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: tokens, error: tokensError } = await adminClient
      .from('password_reset_tokens')
      .select('id, user_id, token, expires_at, used_at, created_at')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (tokensError) {
      console.error('[Admin Password Resets] Tokens fetch error:', tokensError)
      return NextResponse.json(
        { error: 'Failed to fetch reset requests' },
        { status: 500 }
      )
    }

    // Filter out expired tokens
    const now = new Date()
    const active = (tokens || []).filter((t) => new Date(t.expires_at) > now)

    const userIds = [...new Set(active.map((t) => t.user_id))]
    let usersMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      if (profilesError) {
        console.error('[Admin Password Resets] Profiles fetch error:', profilesError)
      }
      usersMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.username || '']))
    }

    return NextResponse.json({
      requests: active.map((t) => ({
        id: t.id,
        userId: t.user_id,
        username: usersMap[t.user_id] || '未知用户',
        token: t.token,
        expiresAt: t.expires_at,
        createdAt: t.created_at,
      })),
    })
  } catch (error) {
    console.error('[Admin Password Resets] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reset requests' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, username, account_status')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (profile.account_status !== 'approved') {
      return NextResponse.json(
        { error: 'User is not approved' },
        { status: 400 }
      )
    }

    // Invalidate previous unused tokens for this user
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .is('used_at', null)
      .eq('user_id', userId)

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await adminClient
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('[Admin Password Resets] Token insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create reset token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token,
      username: profile.username,
    })
  } catch (error) {
    console.error('[Admin Password Resets] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create reset token' },
      { status: 500 }
    )
  }
}
