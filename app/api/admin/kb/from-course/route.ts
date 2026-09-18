import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { ingestCourseIntoKb } from '@/lib/kb'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/admin/kb/from-course — merge a course's content into the
// knowledge base. Re-merging the same course replaces the previous copy.
export async function POST(req: Request) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const courseId: unknown = body?.courseId
    if (typeof courseId !== 'string' || !courseId) {
      return NextResponse.json({ error: '缺少课程 ID' }, { status: 400 })
    }

    const result = await ingestCourseIntoKb(courseId)
    return NextResponse.json({ document: result })
  } catch (error) {
    console.error('[KB FromCourse] Error:', error)
    const message = error instanceof Error ? error.message : '加入知识库失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
