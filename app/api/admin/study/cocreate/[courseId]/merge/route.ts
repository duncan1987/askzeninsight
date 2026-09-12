import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mergeCocreateCourse, CocourseError } from '@/lib/cocourse-server'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authError = await verifyAdminAccess(req)
    if (authError) return authError

    const { courseId } = await params

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
    }

    const result = await mergeCocreateCourse(adminClient, courseId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CocourseError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Cocreate Admin Merge] POST error:', error)
    return NextResponse.json({ error: '合并失败' }, { status: 500 })
  }
}
