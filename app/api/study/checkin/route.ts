import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const { data: course } = await supabase
      .from('study_courses')
      .select('id')
      .eq('id', courseId)
      .eq('is_published', true)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('study_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ checkin: existing })
    }

    const { data: checkin, error } = await supabase
      .from('study_checkins')
      .insert({ user_id: user.id, course_id: courseId })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ checkin })
  } catch (error) {
    console.error('[Study Checkin] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check in' },
      { status: 500 }
    )
  }
}
