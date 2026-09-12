import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'


export async function POST(req: Request) {
  try {
    const authError = await verifyAdminAccess(req)
    if (authError) return authError

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { title, outline, group_id, sort_order } = body as {
      title?: string
      outline?: string
      group_id?: string
      sort_order?: number
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '课程标题不能为空' }, { status: 400 })
    }
    if (!outline || !outline.trim()) {
      return NextResponse.json({ error: '课程大纲不能为空' }, { status: 400 })
    }
    if (!group_id) {
      return NextResponse.json({ error: '请选择参与用户组' }, { status: 400 })
    }

    // Split outline into sections: one non-empty line per section
    const sectionTitles = outline
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    if (sectionTitles.length === 0) {
      return NextResponse.json({ error: '大纲至少需要一个章节' }, { status: 400 })
    }

    // Validate group exists
    const { data: group, error: groupError } = await adminClient
      .from('user_groups')
      .select('id, name')
      .eq('id', group_id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: '用户组不存在' }, { status: 400 })
    }

    // Create the course shell
    const { data: course, error: courseError } = await adminClient
      .from('study_courses')
      .insert({
        title: title.trim(),
        content_html: '',
        truncation_index: null,
        is_published: false,
        sort_order: sort_order ?? 0,
        course_type: 'cocreate',
        cocreate_group_id: group_id,
        cocreate_status: 'in_progress',
      })
      .select('id, title, course_type, cocreate_status')
      .single()

    if (courseError || !course) {
      console.error('[Cocreate Create] course insert error:', courseError)
      return NextResponse.json({ error: '创建课程失败' }, { status: 500 })
    }

    // Create section rows ordered by outline line number
    const sectionRows = sectionTitles.map((sectionTitle: string, index: number) => ({
      course_id: course.id,
      section_index: index,
      title: sectionTitle,
    }))

    const { error: sectionsError } = await adminClient
      .from('study_course_sections')
      .insert(sectionRows)

    if (sectionsError) {
      console.error('[Cocreate Create] sections insert error:', sectionsError)
      // Roll back the course shell to avoid an empty cocreate course
      await adminClient.from('study_courses').delete().eq('id', course.id)
      return NextResponse.json({ error: '创建编辑块失败' }, { status: 500 })
    }

    return NextResponse.json({
      course,
      section_count: sectionRows.length,
      group_name: group.name,
    })
  } catch (error) {
    console.error('[Cocreate Create] POST error:', error)
    return NextResponse.json({ error: 'Failed to create cocreate course' }, { status: 500 })
  }
}
