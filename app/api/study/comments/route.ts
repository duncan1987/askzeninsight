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
    const { courseId, content } = body

    if (!courseId || !content) {
      return NextResponse.json({ error: 'Missing courseId or content' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content exceeds 1000 characters' }, { status: 400 })
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

    const { data: comment, error } = await supabase
      .from('study_comments')
      .insert({ user_id: user.id, course_id: courseId, content })
      .select('id, content, created_at, user:profiles!study_comments_user_id_fkey(username, avatar_url)')
      .single()

    if (error) throw error

    return NextResponse.json({ comment: { ...comment, user: comment.user } })
  } catch (error) {
    console.error('[Study Comments] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}
