import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { postId } = await params
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
      .from('blog_posts')
      .select('id, is_published')
      .eq('id', postId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const shouldPublish = publish !== undefined ? publish : !existing.is_published

    const updateData: Record<string, unknown> = {
      is_published: shouldPublish,
      published_at: shouldPublish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { data: post, error } = await adminClient
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select('id, title, is_published, published_at, updated_at')
      .single()

    if (error) {
      console.error('[Admin Blog Publish] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update publish status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      post,
      action: shouldPublish ? 'published' : 'unpublished',
    })
  } catch (error) {
    console.error('[Admin Blog Publish] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update publish status' },
      { status: 500 }
    )
  }
}
