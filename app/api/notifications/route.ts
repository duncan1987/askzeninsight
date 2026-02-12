import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = supabase
      .from('system_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Only show active notifications by default
    // Show notifications where: is_active=true AND (expires_at IS NULL OR expires_at > now)
    if (!includeInactive) {
      const now = new Date().toISOString()
      query = query.eq('is_active', true).or('expires_at.is.null,expires_at.gt.' + now)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[Notifications] Error fetching:', error)
      throw error
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('[Notifications] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
