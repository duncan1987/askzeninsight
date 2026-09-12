import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'


export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authError = await verifyAdminAccess(req)
    if (authError) return authError

    const { courseId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
    }

    const { data: course, error: courseError } = await adminClient
      .from('study_courses')
      .select(
        'id, title, course_type, cocreate_status, cocreate_group_id, is_published, sort_order, content_html, published_at, created_at, updated_at'
      )
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }
    if (course.course_type !== 'cocreate') {
      return NextResponse.json({ error: '该课程不是共创课程' }, { status: 400 })
    }

    let groupName: string | null = null
    if (course.cocreate_group_id) {
      const { data: group } = await adminClient
        .from('user_groups')
        .select('name')
        .eq('id', course.cocreate_group_id)
        .single()
      groupName = group?.name ?? null
    }

    const { data: rawSections, error: sectionsError } = await adminClient
      .from('study_course_sections')
      .select(
        'id, course_id, section_index, title, content_html, claimer_id, updated_by, created_at, updated_at, claimer:profiles!study_course_sections_claimer_id_fkey(username), editor:profiles!study_course_sections_updated_by_fkey(username)'
      )
      .eq('course_id', courseId)
      .order('section_index', { ascending: true })

    if (sectionsError) {
      console.error('[Cocreate Admin Detail] sections error:', sectionsError)
      return NextResponse.json({ error: '读取编辑块失败' }, { status: 500 })
    }

    const sections = (rawSections || []).map((s: Record<string, unknown>) => ({
      id: s.id,
      course_id: s.course_id,
      section_index: s.section_index,
      title: s.title,
      content_html: s.content_html,
      claimer_id: s.claimer_id,
      updated_by: s.updated_by,
      created_at: s.created_at,
      updated_at: s.updated_at,
      claimer_name: (s.claimer as { username: string } | null)?.username ?? null,
      editor_name: (s.editor as { username: string } | null)?.username ?? null,
    }))

    return NextResponse.json({
      course: { ...course, group_name: groupName },
      sections,
    })
  } catch (error) {
    console.error('[Cocreate Admin Detail] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cocreate course' }, { status: 500 })
  }
}
