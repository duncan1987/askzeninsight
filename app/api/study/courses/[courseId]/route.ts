import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const supabase = await createClient()

  try {
    const { data: course, error } = await supabase
      .from('study_courses')
      .select('id, title, content_html, truncation_index, published_at')
      .eq('id', courseId)
      .eq('is_published', true)
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    let isCheckedIn = false

    if (user) {
      const { data: checkin } = await supabase
        .from('study_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      isCheckedIn = !!checkin
    }

    if (!isCheckedIn && course.truncation_index != null) {
      const html = course.content_html || ''
      const truncated = truncateHtml(html, course.truncation_index)
      course.content_html = truncated
    }

    const { data: comments, error: commentsError } = await supabase
      .from('study_comments')
      .select('id, content, created_at, user:profiles!study_comments_user_id_fkey(username, avatar_url)')
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (commentsError) throw commentsError

    return NextResponse.json({
      course,
      is_checked_in: isCheckedIn,
      comments: comments || [],
    })
  } catch (error) {
    console.error('[Study Course Detail] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

function truncateHtml(html: string, charIndex: number): string {
  if (charIndex >= html.length) return html
  let openTags: string[] = []
  let i = 0
  let textCount = 0

  while (i < html.length && textCount < charIndex) {
    if (html[i] === '<') {
      const closeIdx = html.indexOf('>', i)
      if (closeIdx === -1) break
      const tag = html.substring(i, closeIdx + 1)
      const tagName = tag.match(/^<\/?(\w+)/)?.[1]?.toLowerCase()
      if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
        if (tag.startsWith('</')) {
          const last = openTags.lastIndexOf(tagName)
          if (last !== -1) openTags.splice(last, 1)
        } else if (!tag.endsWith('/>')) {
          openTags.push(tagName)
        }
      }
      i = closeIdx + 1
    } else {
      textCount++
      i++
    }
  }

  let result = html.substring(0, i)
  for (let j = openTags.length - 1; j >= 0; j--) {
    result += `</${openTags[j]}>`
  }
  return result
}
