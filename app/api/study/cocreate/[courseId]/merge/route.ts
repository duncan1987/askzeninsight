import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mergeCocreateCourse, CocourseError } from '@/lib/cocourse-server'

export const runtime = 'nodejs'

export async function POST(
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
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
    }

    // Verify the caller is a member of the course's co-create group
    // (user_group_members is service-role-only under RLS)
    const { data: course } = await adminClient
      .from('study_courses')
      .select('id, cocreate_group_id, course_type')
      .eq('id', courseId)
      .single()

    if (!course || course.course_type !== 'cocreate' || !course.cocreate_group_id) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }

    const { data: membership } = await adminClient
      .from('user_group_members')
      .select('id')
      .eq('group_id', course.cocreate_group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: '仅共创组成员可以合并课程' }, { status: 403 })
    }

    const result = await mergeCocreateCourse(adminClient, courseId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CocourseError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Cocreate Merge] POST error:', error)
    return NextResponse.json({ error: '合并失败' }, { status: 500 })
  }
}
