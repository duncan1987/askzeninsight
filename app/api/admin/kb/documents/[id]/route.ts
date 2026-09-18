import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { deleteKbDocument } from '@/lib/kb'

export const runtime = 'nodejs'

// DELETE /api/admin/kb/documents/[id] — delete a document (chunks cascade)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: '缺少文档 ID' }, { status: 400 })
    }
    await deleteKbDocument(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
