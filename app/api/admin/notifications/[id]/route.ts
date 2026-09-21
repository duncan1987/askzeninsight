import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'announcement'] as const
type NotificationType = (typeof NOTIFICATION_TYPES)[number]

// PATCH /api/admin/notifications/[id] — update a notification
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: '缺少通知 ID' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const updates: Record<string, string | boolean | null> = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (!title) {
        return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
      }
      updates.title = title
    }
    if (typeof body.content === 'string') {
      const content = body.content.trim()
      updates.content = content || null
    }
    if (body.type !== undefined) {
      if (!NOTIFICATION_TYPES.includes(body.type)) {
        return NextResponse.json({ error: '无效的通知类型' }, { status: 400 })
      }
      updates.type = body.type as NotificationType
    }
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active === true
    }
    if (body.expires_at !== undefined) {
      const expiresAt: string | null =
        typeof body.expires_at === 'string' && body.expires_at.trim() !== '' ? body.expires_at : null
      if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
        return NextResponse.json({ error: '过期时间格式无效' }, { status: 400 })
      }
      updates.expires_at = expiresAt
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 })
    }

    const { data: notification, error } = await supabase
      .from('system_notifications')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[Admin Notifications] Update error:', error)
      return NextResponse.json({ error: '更新通知失败: ' + error.message }, { status: 500 })
    }
    if (!notification) {
      return NextResponse.json({ error: '通知不存在' }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch {
    return NextResponse.json({ error: '请求参数无效' }, { status: 400 })
  }
}

// DELETE /api/admin/notifications/[id] — delete a notification
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: '缺少通知 ID' }, { status: 400 })
  }

  const { error } = await supabase
    .from('system_notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Admin Notifications] Delete error:', error)
    return NextResponse.json({ error: '删除通知失败: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
