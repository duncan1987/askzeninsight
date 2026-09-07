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
    const groupId = searchParams.get('group')

    // Fetch available groups for the filter dropdown
    const { data: groups, error: groupsError } = await adminClient
      .from('user_groups')
      .select('id, name')
      .order('created_at', { ascending: true })

    if (groupsError) {
      console.error('[Admin Study Checkins] Groups fetch error:', groupsError)
    }

    // If a group filter is set, get its member user IDs
    let groupUserIds: string[] | null = null
    if (groupId) {
      const { data: members, error: membersError } = await adminClient
        .from('user_group_members')
        .select('user_id')
        .eq('group_id', groupId)

      if (membersError) {
        console.error('[Admin Study Checkins] Group members fetch error:', membersError)
        return NextResponse.json(
          { error: 'Failed to fetch group members' },
          { status: 500 }
        )
      }
      groupUserIds = (members || []).map((m) => m.user_id)
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

    let checkinQuery = adminClient
      .from('study_checkins')
      .select('user_id')

    if (groupUserIds) {
      checkinQuery = checkinQuery.in('user_id', groupUserIds)
    }

    const { data: checkinUserIds, error: checkinUserIdsError } = await checkinQuery

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
      let profilesQuery = adminClient
        .from('profiles')
        .select('id, username')
        .in('id', distinctUserIds)

      const { data: profiles, error: profilesError } = await profilesQuery

      if (profilesError) {
        console.error('[Admin Study Checkins] Profiles fetch error:', profilesError)
      }
      users = (profiles || []) as { id: string; username: string | null }[]
    }

    let checkinsQuery = adminClient
      .from('study_checkins')
      .select('user_id, course_id')

    if (groupUserIds) {
      checkinsQuery = checkinsQuery.in('user_id', groupUserIds)
    }

    const { data: checkins, error: checkinsError } = await checkinsQuery

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
      groups: (groups || []).map((g) => ({ id: g.id, name: g.name })),
    })
  } catch (error) {
    console.error('[Admin Study Checkins] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkin stats' },
      { status: 500 }
    )
  }
}
