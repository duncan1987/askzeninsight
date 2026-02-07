import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Download exported file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Fetch export record
    const { data: exportRecord, error } = await supabase
      .from('conversation_exports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 })
    }

    // Check if export is completed
    if (exportRecord.status !== 'completed') {
      return NextResponse.json(
        { error: `Export is ${exportRecord.status}. Please wait.` },
        { status: 400 }
      )
    }

    // Check if export has expired
    const now = new Date()
    const expiresAt = new Date(exportRecord.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Export link has expired. Please create a new export.' },
        { status: 410 }
      )
    }

    // Parse the data URL
    const fileUrl = exportRecord.file_url as string
    if (!fileUrl.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 500 })
    }

    // Extract mime type and base64 content
    const [mimeInfo, base64Content] = fileUrl.split(',')
    const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'application/octet-stream'
    const content = Buffer.from(base64Content, 'base64')

    // Generate filename
    const dateStr = new Date(exportRecord.created_at).toISOString().split('T')[0]
    const extension = exportRecord.format === 'json' ? 'json' : 'md'
    const filename = `zen-insight-conversations-${dateStr}.${extension}`

    // Return file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    })

  } catch (error) {
    console.error('[Download Export] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download export' },
      { status: 500 }
    )
  }
}
