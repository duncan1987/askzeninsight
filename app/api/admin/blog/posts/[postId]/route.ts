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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { postId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: post, error } = await adminClient
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[Admin Blog Post Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { postId } = await params
    const body = await req.json()

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const fields = [
      'title', 'slug', 'description', 'content_html',
      'cover_image', 'cover_image_alt', 'category', 'tags',
      'author', 'is_published', 'source_course_id', 'locale',
    ]
    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.is_published !== undefined) {
      updateData.published_at = body.is_published ? new Date().toISOString() : null
    }

    const { data: post, error } = await adminClient
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('[Admin Blog Post Detail] Update error:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A blog post with this slug already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update blog post' },
        { status: 500 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[Admin Blog Post Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { postId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { error } = await adminClient
      .from('blog_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      console.error('[Admin Blog Post Detail] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Blog Post Detail] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
