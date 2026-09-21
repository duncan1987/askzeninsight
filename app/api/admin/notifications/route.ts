import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'announcement'] as const
type NotificationType = (typeof NOTIFICATION_TYPES)[number]

// GET /api/admin/notifications — list all notifications (including inactive)
export async function GET(req: Request) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: notifications, error } = await supabase
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[Admin Notifications] List error:', error)
    return NextResponse.json({ error: '获取通知列表失败' }, { status: 500 })
  }

  return NextResponse.json({ notifications })
}

// POST /api/admin/notifications — create a notification
export async function POST(req: Request) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const type: NotificationType = NOTIFICATION_TYPES.includes(body.type) ? body.type : 'info'
    const isActive = body.is_active !== false
    const expiresAt: string | null =
      typeof body.expires_at === 'string' && body.expires_at.trim() !== '' ? body.expires_at : null

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
      return NextResponse.json({ error: '过期时间格式无效' }, { status: 400 })
    }

    const { data: notification, error } = await supabase
      .from('system_notifications')
      .insert({
        title,
        content: content || null,
        type,
        is_active: isActive,
        expires_at: expiresAt,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[Admin Notifications] Create error:', error)
      return NextResponse.json({ error: '创建通知失败: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch {
    return NextResponse.json({ error: '请求参数无效' }, { status: 400 })
  }
}
