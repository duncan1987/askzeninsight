import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const TTS_API_URL = 'https://open.bigmodel.cn/api/paas/v4/audio/speech'
const MAX_CHUNK_CHARS = 700

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// Deterministic chunking: split at sentence boundaries, chunks up to MAX_CHUNK_CHARS
function splitIntoChunks(text: string): string[] {
  if (!text) return []

  // Split keeping sentence-ending punctuation
  const sentences = text.match(/[^。！？!?；;\n]*[。！？!?；;\n]+|[^。！？!?；;\n]+$/g) || [text]

  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    // A single sentence longer than the limit gets hard-split
    if (trimmed.length > MAX_CHUNK_CHARS) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      for (let i = 0; i < trimmed.length; i += MAX_CHUNK_CHARS) {
        chunks.push(trimmed.slice(i, i + MAX_CHUNK_CHARS))
      }
      continue
    }

    if ((current + ' ' + trimmed).trim().length > MAX_CHUNK_CHARS) {
      if (current) chunks.push(current)
      current = trimmed
    } else {
      current = current ? current + ' ' + trimmed : trimmed
    }
  }

  if (current) chunks.push(current)
  return chunks
}

async function synthesizeChunk(text: string): Promise<Buffer> {
  const apiKey = process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_FREE
  if (!apiKey) {
    throw new Error('TTS API key is not configured')
  }

  const response = await fetch(TTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'cogtts',
      input: text,
      voice: 'tongtong',
      response_format: 'wav',
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    console.error('[Study TTS] Zhipu API error:', response.status, errText.slice(0, 200))
    throw new Error(`TTS API returned ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 100) {
    throw new Error('TTS API returned empty audio')
  }

  return buffer
}

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { courseId, chunkIndex } = body as { courseId: string; chunkIndex: number }

    if (!courseId || typeof chunkIndex !== 'number' || chunkIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    // 2. Verify the user has checked in for this course
    const { data: checkin, error: checkinError } = await supabase
      .from('study_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (checkinError || !checkin) {
      return NextResponse.json(
        { error: 'Check-in required' },
        { status: 403 }
      )
    }

    // 3. Load course content
    const { data: course, error: courseError } = await supabase
      .from('study_courses')
      .select('id, title, content_html')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // 4. Build text and chunk deterministically
    const plainText = stripHtml(course.content_html || '')
    const fullText = course.title ? `${course.title}。 ${plainText}` : plainText
    const chunks = splitIntoChunks(fullText)

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Course has no readable content' },
        { status: 400 }
      )
    }

    if (chunkIndex >= chunks.length) {
      return NextResponse.json(
        { error: 'Chunk index out of range' },
        { status: 400 }
      )
    }

    // 5. Synthesize the requested chunk
    const audio = await synthesizeChunk(chunks[chunkIndex])

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(audio.length),
        'X-Total-Chunks': String(chunks.length),
        'X-Chunk-Index': String(chunkIndex),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[Study TTS] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize audio' },
      { status: 500 }
    )
  }
}
