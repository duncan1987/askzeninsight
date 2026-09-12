import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
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

    // Atomic first-come-first-served claim: the conditional update only
    // succeeds when claimer_id is still NULL. RLS additionally requires
    // the caller to be a member of the course's co-create group.
    const { data: section, error } = await supabase
      .from('study_course_sections')
      .update({ claimer_id: user.id })
      .eq('id', sectionId)
      .is('claimer_id', null)
      .select('id, section_index, title, claimer_id')
      .single()

    if (error || !section) {
      // Either the section is already claimed, it does not exist,
      // or the caller is not a group member.
      return NextResponse.json({ error: '认领失败：该块可能已被认领，或你没有权限' }, { status: 409 })
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('[Cocreate Section Claim] POST error:', error)
    return NextResponse.json({ error: '认领失败' }, { status: 500 })
  }
}
