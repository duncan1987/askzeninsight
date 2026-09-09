import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCourseEmbeddings } from '@/lib/embedding'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/admin/study/courses/reembed
// Regenerates embeddings for all published courses with the currently
// configured embedding provider. Run once after switching embedding
// models (vector spaces are model-specific and must not be mixed).
export async function POST(req: Request) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }

  // Require at least one free provider to be configured; refuse to run on
  // the legacy Zhipu path by accident (that would just rebuild the old
  // vector space and waste paid API calls).
  const freeProviderConfigured =
    !!process.env.SILICONFLOW_API_KEY ||
    !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
  if (!freeProviderConfigured) {
    return NextResponse.json(
      { error: 'No free embedding provider configured (SILICONFLOW_API_KEY or CLOUDFLARE_ACCOUNT_ID+CLOUDFLARE_API_TOKEN). Set one before re-embedding.' },
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

  const { data: courses, error } = await adminClient
    .from('study_courses')
    .select('id, title, content_html')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Reembed] Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }

  const results: { id: string; title: string; status: string }[] = []
  let failed = 0

  for (const course of courses || []) {
    try {
      await generateCourseEmbeddings(course.id, course.content_html, course.title)
      results.push({ id: course.id, title: course.title, status: 'ok' })
    } catch (err) {
      failed++
      console.error('[Reembed] Failed for course', course.id, err)
      results.push({ id: course.id, title: course.title, status: 'failed' })
    }
  }

  console.log(`[Reembed] Completed: ${results.length - failed} ok, ${failed} failed`)

  return NextResponse.json({
    reembedded: results.length - failed,
    failed,
    courses: results,
  })
}
