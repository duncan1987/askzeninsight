import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSectionHtml, MAX_SECTION_HTML_LENGTH } from '@/lib/cocourse'

export const runtime = 'nodejs'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const { content_html } = body as { content_html?: string }

    if (typeof content_html !== 'string') {
      return NextResponse.json({ error: '内容格式错误' }, { status: 400 })
    }
    if (content_html.length > MAX_SECTION_HTML_LENGTH) {
      return NextResponse.json({ error: '内容超过长度限制' }, { status: 413 })
    }

    const cleaned = sanitizeSectionHtml(content_html)
    const now = new Date().toISOString()

    // RLS restricts the update to co-create group members
    const { data: section, error } = await supabase
      .from('study_course_sections')
      .update({
        content_html: cleaned,
        updated_by: user.id,
        updated_at: now,
      })
      .eq('id', sectionId)
      .select('id, section_index, title, updated_at')
      .single()

    if (error || !section) {
      return NextResponse.json(
        { error: '保存失败：无权限或编辑块不存在' },
        { status: error ? 403 : 404 }
      )
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('[Cocreate Section Save] PATCH error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
