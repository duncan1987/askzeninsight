import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: courses, error } = await supabase
      .from('study_courses')
      .select('id, title, truncation_index, sort_order, published_at, created_at')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    if (!courses || courses.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const courseIds = courses.map((c: any) => c.id)
      const { data: checkins } = await supabase
        .from('study_checkins')
        .select('course_id')
        .eq('user_id', user.id)
        .in('course_id', courseIds)

      const checkedInIds = new Set((checkins || []).map((c: any) => c.course_id))

      const result = courses.map((course: any) => ({
        ...course,
        is_checked_in: checkedInIds.has(course.id),
      }))

      return NextResponse.json({ courses: result })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('[Study Courses] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
