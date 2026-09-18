import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'


export async function GET(req: Request) {
  try {
    const authError = await verifyAdminAccess(req)
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
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    // 日期范围：未传参数时默认最近 1 个月
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    let fromIso: string
    let toIso: string
    if (fromStr || toStr) {
      if (!fromStr || !toStr || !DATE_RE.test(fromStr) || !DATE_RE.test(toStr)) {
        return NextResponse.json(
          { error: '日期参数格式错误，应为 YYYY-MM-DD' },
          { status: 400 }
        )
      }
      if (fromStr > toStr) {
        return NextResponse.json(
          { error: '开始日期不能晚于结束日期' },
          { status: 400 }
        )
      }
      // 用北京时间（UTC+8）作为自然日边界，与用户所选日期一致
      fromIso = `${fromStr}T00:00:00+08:00`
      toIso = `${toStr}T23:59:59+08:00`
    } else {
      const now = new Date()
      const from = new Date(now)
      from.setMonth(from.getMonth() - 1)
      fromIso = from.toISOString()
      toIso = now.toISOString()
    }

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
      .gte('published_at', fromIso)
      .lte('published_at', toIso)

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
      .gte('created_at', fromIso)
      .lte('created_at', toIso)

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
      .gte('created_at', fromIso)
      .lte('created_at', toIso)

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
