import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const VALID_CATEGORIES = ['meditation', 'zen-philosophy', 'mindfulness', 'spiritual-growth', 'practice-guide']

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
    const fromCourseId = searchParams.get('fromCourseId')

    const { data: posts, error: postsError } = await adminClient
      .from('blog_posts')
      .select('id, title, slug, category, is_published, locale, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('[Admin Blog Posts] Fetch error:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    const result: Record<string, unknown> = { posts: posts || [] }

    if (fromCourseId) {
      const { data: course, error: courseError } = await adminClient
        .from('study_courses')
        .select('id, title, content_html')
        .eq('id', fromCourseId)
        .single()

      if (!courseError && course) {
        result.course = course
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Admin Blog Posts] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const body = await req.json()
    const {
      title,
      slug,
      description,
      content_html,
      cover_image,
      cover_image_alt,
      category,
      tags,
      author,
      is_published,
      source_course_id,
      locale,
    } = body as {
      title: string
      slug: string
      description?: string
      content_html: string
      cover_image?: string
      cover_image_alt?: string
      category?: string
      tags?: string[]
      author?: string
      is_published?: boolean
      source_course_id?: string
      locale?: string
    }

    if (!title || !slug || !content_html) {
      return NextResponse.json(
        { error: 'title, slug, and content_html are required' },
        { status: 400 }
      )
    }

    const finalCategory = category || 'meditation'
    if (!VALID_CATEGORIES.includes(finalCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const insertData: Record<string, unknown> = {
      title,
      slug,
      description: description || '',
      content_html,
      cover_image: cover_image || null,
      cover_image_alt: cover_image_alt || '',
      category: finalCategory,
      tags: tags || [],
      author: author || 'koji',
      is_published: is_published ?? false,
      published_at: is_published ? new Date().toISOString() : null,
      source_course_id: source_course_id || null,
      locale: locale || 'zh',
    }

    const { data: post, error } = await adminClient
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[Admin Blog Posts] Create error:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A blog post with this slug already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('[Admin Blog Posts] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
