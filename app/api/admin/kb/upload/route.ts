import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { verifyAdminAccess } from '@/lib/admin-auth'
import { ingestKbDocument } from '@/lib/kb'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_PDF_BYTES = 20 * 1024 * 1024 // 20MB

// POST /api/admin/kb/upload — multipart form: file (PDF), title (optional)
export async function POST(req: Request) {
  const authError = await verifyAdminAccess(req)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const titleInput = formData.get('title')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '请选择 PDF 文件' }, { status: 400 })
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 20MB` },
        { status: 400 }
      )
    }
    const filename = file.name || 'document.pdf'
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: '仅支持 PDF 文件' }, { status: 400 })
    }

    const title = (typeof titleInput === 'string' && titleInput.trim()) || filename.replace(/\.pdf$/i, '')

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    let text = ''
    let pageCount = 0
    try {
      const result = await parser.getText()
      text = result.text || ''
      pageCount = result.total || result.pages?.length || 0
    } finally {
      await parser.destroy().catch(() => {})
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: '无法从该 PDF 提取文字（可能是扫描件/纯图片 PDF），请提供文字版 PDF' },
        { status: 400 }
      )
    }

    const result = await ingestKbDocument({
      title,
      source: 'pdf',
      filename,
      pageCount,
      text,
    })

    return NextResponse.json({ document: result })
  } catch (error) {
    console.error('[KB Upload] Error:', error)
    const message = error instanceof Error ? error.message : '上传失败，请稍后重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
