import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCourseEmbeddings } from '@/lib/embedding'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { courseId } = await params
    const body = await req.json()
    const { publish } = body as { publish?: boolean }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: existing, error: fetchError } = await adminClient
      .from('study_courses')
      .select('id, is_published')
      .eq('id', courseId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const shouldPublish = publish !== undefined ? publish : !existing.is_published

    const updateData: Record<string, unknown> = {
      is_published: shouldPublish,
      published_at: shouldPublish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { data: course, error } = await adminClient
      .from('study_courses')
      .update(updateData)
      .eq('id', courseId)
      .select('id, title, is_published, published_at, updated_at')
      .single()

    if (error) {
      console.error('[Admin Course Publish] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update publish status' },
        { status: 500 }
      )
    }

    if (shouldPublish && course) {
      const { data: fullCourse } = await adminClient
        .from('study_courses')
        .select('content_html, title')
        .eq('id', courseId)
        .single()

      if (fullCourse) {
        generateCourseEmbeddings(courseId, fullCourse.content_html, fullCourse.title).catch((err) => {
          console.error('[Admin Course Publish] Embedding generation failed:', err)
        })
      }
    }

    return NextResponse.json({
      course,
      action: shouldPublish ? 'published' : 'unpublished',
    })
  } catch (error) {
    console.error('[Admin Course Publish] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update publish status' },
      { status: 500 }
    )
  }
}
