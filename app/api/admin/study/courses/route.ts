import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sectionIsFilled } from '@/lib/cocourse'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'


export async function GET(req: Request) {
  try {
    const authError = await verifyAdminAccess(req)
    if (authError) return authError

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: courses, error: coursesError } = await adminClient
      .from('study_courses')
      .select('id, title, is_published, sort_order, truncation_index, published_at, created_at, updated_at, course_type, cocreate_status')
      .order('sort_order', { ascending: true })

    if (coursesError) {
      console.error('[Admin Courses] Fetch error:', coursesError)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Co-create progress: fetch section contents for cocreate courses only
    const cocreateIds = (courses || []).filter((c) => c.course_type === 'cocreate').map((c) => c.id)
    const sectionProgress = new Map<string, { filled: number; total: number }>()
    if (cocreateIds.length > 0) {
      const { data: sectionRows } = await adminClient
        .from('study_course_sections')
        .select('course_id, content_html')
        .in('course_id', cocreateIds)
      for (const row of sectionRows || []) {
        const progress = sectionProgress.get(row.course_id) || { filled: 0, total: 0 }
        progress.total += 1
        if (sectionIsFilled(row.content_html || '')) progress.filled += 1
        sectionProgress.set(row.course_id, progress)
      }
    }

    const { data: commentCounts, error: commentError } = await adminClient
      .from('study_comments')
      .select('course_id')
      .is('deleted_at', null)

    if (commentError) {
      console.error('[Admin Courses] Comment count error:', commentError)
    }

    const { data: checkinCounts, error: checkinError } = await adminClient
      .from('study_checkins')
      .select('course_id')

    if (checkinError) {
      console.error('[Admin Courses] Checkin count error:', checkinError)
    }

    const commentMap = new Map<string, number>()
    for (const row of commentCounts || []) {
      commentMap.set(row.course_id, (commentMap.get(row.course_id) || 0) + 1)
    }

    const checkinMap = new Map<string, number>()
    for (const row of checkinCounts || []) {
      checkinMap.set(row.course_id, (checkinMap.get(row.course_id) || 0) + 1)
    }

    const result = (courses || []).map((course) => ({
      id: course.id,
      title: course.title,
      is_published: course.is_published,
      sort_order: course.sort_order,
      truncation_index: course.truncation_index,
      published_at: course.published_at,
      created_at: course.created_at,
      updated_at: course.updated_at,
      course_type: course.course_type,
      cocreate_status: course.cocreate_status,
      section_filled: sectionProgress.get(course.id)?.filled ?? null,
      section_total: sectionProgress.get(course.id)?.total ?? null,
      comment_count: commentMap.get(course.id) || 0,
      checkin_count: checkinMap.get(course.id) || 0,
    }))

    return NextResponse.json({ courses: result })
  } catch (error) {
    console.error('[Admin Courses] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const authError = await verifyAdminAccess(req)
    if (authError) return authError

    const body = await req.json()
    const { title, content_html, truncation_index, sort_order, is_published } = body as {
      title: string
      content_html: string
      truncation_index?: number
      sort_order?: number
      is_published?: boolean
    }

    if (!title || !content_html) {
      return NextResponse.json(
        { error: 'title and content_html are required' },
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

    const insertData: Record<string, unknown> = {
      title,
      content_html,
      truncation_index: truncation_index ?? null,
      sort_order: sort_order ?? 0,
      is_published: is_published ?? false,
      published_at: is_published ? new Date().toISOString() : null,
    }

    const { data: course, error } = await adminClient
      .from('study_courses')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[Admin Courses] Create error:', error)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('[Admin Courses] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
