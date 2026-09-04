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

    const { data: courses, error: coursesError } = await adminClient
      .from('study_courses')
      .select('id, title')
      .eq('is_published', true)

    if (coursesError) {
      console.error('[Admin Study Checkins] Courses fetch error:', coursesError)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    const { data: checkinUserIds, error: checkinUserIdsError } = await adminClient
      .from('study_checkins')
      .select('user_id')

    if (checkinUserIdsError) {
      console.error('[Admin Study Checkins] Checkin user IDs fetch error:', checkinUserIdsError)
      return NextResponse.json(
        { error: 'Failed to fetch checkin users' },
        { status: 500 }
      )
    }

    const distinctUserIds = [...new Set((checkinUserIds || []).map((r) => r.user_id))]

    let users: { id: string; username: string | null }[] = []
    if (distinctUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, username')
        .in('id', distinctUserIds)

      if (profilesError) {
        console.error('[Admin Study Checkins] Profiles fetch error:', profilesError)
      }
      users = (profiles || []) as { id: string; username: string | null }[]
    }

    const { data: checkins, error: checkinsError } = await adminClient
      .from('study_checkins')
      .select('user_id, course_id')

    if (checkinsError) {
      console.error('[Admin Study Checkins] Checkins fetch error:', checkinsError)
      return NextResponse.json(
        { error: 'Failed to fetch checkins' },
        { status: 500 }
      )
    }

    const { data: comments, error: commentsError } = await adminClient
      .from('study_comments')
      .select('user_id, course_id')
      .is('deleted_at', null)

    if (commentsError) {
      console.error('[Admin Study Checkins] Comments fetch error:', commentsError)
    }

    const commentSet = new Set<string>()
    for (const c of comments || []) {
      commentSet.add(`${c.user_id}:${c.course_id}`)
    }

    const checkinSet = new Set<string>()
    for (const c of checkins || []) {
      checkinSet.add(`${c.user_id}:${c.course_id}`)
    }

    const matrix: Record<string, Record<string, { checked_in: boolean; has_comment: boolean }>> = {}

    for (const user of users) {
      matrix[user.id] = {}
      for (const course of courses || []) {
        matrix[user.id][course.id] = {
          checked_in: checkinSet.has(`${user.id}:${course.id}`),
          has_comment: commentSet.has(`${user.id}:${course.id}`),
        }
      }
    }

    const totalUsers = users.length
    const totalCourses = (courses || []).length
    const totalCells = totalUsers * totalCourses
    const totalCheckedIn = (checkins || []).length
    const avgRate = totalCells > 0
      ? ((totalCheckedIn / totalCells) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      stats: {
        courses: (courses || []).map((c) => ({ id: c.id, title: c.title })),
        users: users.map((u) => ({ id: u.id, username: u.username })),
        matrix,
        totalUsers,
        totalCourses,
        avgRate,
      },
    })
  } catch (error) {
    console.error('[Admin Study Checkins] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkin stats' },
      { status: 500 }
    )
  }
}
