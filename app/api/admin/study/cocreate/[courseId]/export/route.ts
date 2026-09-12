import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exportCocreateCourseDocx, docxResponse, CocourseError } from '@/lib/cocourse-server'
import { verifyAdminAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET(
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

    const { buffer, filename } = await exportCocreateCourseDocx(adminClient, courseId)
    return docxResponse(buffer, filename)
  } catch (error) {
    if (error instanceof CocourseError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Cocreate Admin Export] GET error:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
