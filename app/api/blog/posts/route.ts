import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, description, cover_image, cover_image_alt, category, tags, author, locale, published_at, created_at', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: posts, error, count } = await query

    if (error) {
      console.error('[Blog Posts] Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('[Blog Posts] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}
