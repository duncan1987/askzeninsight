import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const withMembers = url.searchParams.get('with_members') === 'true'

  const { data: groups, error } = await adminClient
    .from('user_groups')
    .select(withMembers ? 'id, name, description, created_at, user_group_members(user_id)' : 'id, name, description, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (groups || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    created_at: g.created_at,
    member_count: g.user_group_members?.length || 0,
  }))

  return NextResponse.json({ groups: result })
}

export async function POST(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: group, error } = await adminClient
      .from('user_groups')
      .insert({ name, description: description || '' })
      .select('id, name, description, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
