import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { listKbDocuments } from '@/lib/kb'

export const runtime = 'nodejs'

// GET /api/admin/kb/documents — list all knowledge base documents
export async function GET(req: Request) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  try {
    const documents = await listKbDocuments()
    return NextResponse.json({ documents })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取列表失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
