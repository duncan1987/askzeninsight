import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    let query = adminClient
      .from('profiles')
      .select('id, username, full_name, email, account_status, created_at')
      .not('username', 'is', null)

    if (status !== 'all') {
      query = query.eq('account_status', status)
    }

    const { data: profiles, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[User Review] Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const pending = (profiles || []).filter((p) => p.account_status === 'pending').length
    const approved = (profiles || []).filter((p) => p.account_status === 'approved').length
    const rejected = (profiles || []).filter((p) => p.account_status === 'rejected').length

    return NextResponse.json({
      success: true,
      stats: { pending, approved, rejected, total: (profiles || []).length },
      users: profiles || [],
    })
  } catch (error) {
    console.error('[User Review] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId, action, notes } = body as {
      userId: string
      action: 'approve' | 'reject'
      notes?: string
    }

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. userId and action (approve/reject) are required.' },
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

    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('id, username, account_status')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (profile.account_status !== 'pending') {
      return NextResponse.json(
        { error: `User account status is '${profile.account_status}'. Can only review users with status 'pending'.` },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ account_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[User Review] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    console.log('[User Review] Review completed:', {
      userId,
      username: profile.username,
      action,
      newStatus,
      notes: notes || null,
    })

    return NextResponse.json({
      success: true,
      userId,
      username: profile.username,
      action,
      newStatus,
    })
  } catch (error) {
    console.error('[User Review] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    )
  }
}
