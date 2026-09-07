import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { groupId } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: group, error } = await adminClient
    .from('user_groups')
    .select('id, name, description, created_at, user_group_members(user_id, added_at)')
    .eq('id', groupId)
    .single()

  if (error || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const memberIds = (group.user_group_members || []).map((m: any) => m.user_id)

  let members: any[] = []
  if (memberIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, username, full_name')
      .in('id', memberIds)
    members = profiles || []
  }

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      created_at: group.created_at,
      members,
    },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { groupId } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { name, description, addMembers, removeMembers } = body

    if (name || description !== undefined) {
      const updates: Record<string, string> = {}
      if (name) updates.name = name
      if (description !== undefined) updates.description = description

      await adminClient
        .from('user_groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', groupId)
    }

    if (addMembers && addMembers.length > 0) {
      const records = addMembers.map((userId: string) => ({
        group_id: groupId,
        user_id: userId,
      }))
      await adminClient.from('user_group_members').insert(records)
    }

    if (removeMembers && removeMembers.length > 0) {
      await adminClient
        .from('user_group_members')
        .delete()
        .eq('group_id', groupId)
        .in('user_id', removeMembers)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { groupId } = await params
  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { error } = await adminClient
    .from('user_groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
