import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')

    let query = supabase
      .from('study_checkins')
      .select('course_id, created_at, course:study_courses(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (month) {
      const startDate = `${month}-01T00:00:00Z`
      const [year, mon] = month.split('-').map(Number)
      const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`
      const endDate = `${nextMonth}-01T00:00:00Z`

      query = query.gte('created_at', startDate).lt('created_at', endDate)
    }

    const { data: checkins, error } = await query

    if (error) throw error

    const result = (checkins || []).map((c: any) => ({
      course_id: c.course_id,
      course_title: c.course?.title || null,
      created_at: c.created_at,
    }))

    return NextResponse.json({ checkins: result })
  } catch (error) {
    console.error('[Study Checkins] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch checkins' },
      { status: 500 }
    )
  }
}
