import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exportCocreateCourseDocx, docxResponse, CocourseError } from '@/lib/cocourse-server'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
    }

    // Access: co-create group member, or the course is published
    const { data: course } = await adminClient
      .from('study_courses')
      .select('id, cocreate_group_id, course_type, is_published')
      .eq('id', courseId)
      .single()

    if (!course || course.course_type !== 'cocreate') {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }

    if (!course.is_published) {
      if (!user) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }
      const { data: membership } = await adminClient
        .from('user_group_members')
        .select('id')
        .eq('group_id', course.cocreate_group_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json({ error: '仅共创组成员可以导出该课程' }, { status: 403 })
      }
    }

    const { buffer, filename } = await exportCocreateCourseDocx(adminClient, courseId)
    return docxResponse(buffer, filename)
  } catch (error) {
    if (error instanceof CocourseError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Cocreate Export] GET error:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
