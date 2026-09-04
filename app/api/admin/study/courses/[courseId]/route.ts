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
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { courseId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: course, error } = await adminClient
      .from('study_courses')
      .select('id, title, content_html, truncation_index, is_published, sort_order, published_at, created_at, updated_at')
      .eq('id', courseId)
      .single()

    if (error || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('[Admin Course Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { courseId } = await params
    const body = await req.json()
    const { title, content_html, truncation_index, sort_order, is_published } = body as {
      title?: string
      content_html?: string
      truncation_index?: number
      sort_order?: number
      is_published?: boolean
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content_html !== undefined) updateData.content_html = content_html
    if (truncation_index !== undefined) updateData.truncation_index = truncation_index
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_published !== undefined) {
      updateData.is_published = is_published
      updateData.published_at = is_published ? new Date().toISOString() : null
    }

    const { data: course, error } = await adminClient
      .from('study_courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      console.error('[Admin Course Detail] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      )
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('[Admin Course Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authError = verifyAdmin(req)
    if (authError) return authError

    const { courseId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { error } = await adminClient
      .from('study_courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('[Admin Course Detail] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Course Detail] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
