import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function verifyAdmin(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }
  return null
}

export async function GET(req: Request) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    let query = adminClient
      .from('study_comments')
      .select('id, content, created_at, course_id, study_courses(title), user_id, profiles(username)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: comments, error } = await query

    if (error) {
      console.error('[Admin Study Comments] Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const result = (comments || []).map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      course_id: row.course_id,
      course_title: (row.study_comments as Record<string, string>)?.title ?? null,
      user_id: row.user_id,
      username: (row.profiles as Record<string, string>)?.username ?? null,
    }))

    return NextResponse.json({ comments: result })
  } catch (error) {
    console.error('[Admin Study Comments] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
