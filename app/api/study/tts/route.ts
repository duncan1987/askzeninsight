import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_CHUNK_CHARS = 700
const TTS_VOICE = process.env.TTS_EDGE_VOICE || 'zh-CN-XiaoxiaoNeural'
const CACHE_BUCKET = 'tts-cache'
const EDGE_TTS_RETRIES = 3

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

// The text is embedded in an SSML XML document, so XML-special characters must be escaped
function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function synthesizeChunkOnce(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS()
  await tts.setMetadata(TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
  const { audioStream } = tts.toStream(text)

  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (d: Buffer) => chunks.push(d))
    audioStream.on('close', () => resolve())
    audioStream.on('end', () => resolve())
    audioStream.on('error', reject)
  })

  const buffer = Buffer.concat(chunks)
  if (buffer.length < 100) {
    throw new Error('Edge TTS returned empty audio')
  }
  return buffer
}

async function synthesizeChunk(text: string): Promise<Buffer> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= EDGE_TTS_RETRIES; attempt++) {
    try {
      return await synthesizeChunkOnce(text)
    } catch (error) {
      lastError = error
      console.error(`[Study TTS] Edge TTS attempt ${attempt}/${EDGE_TTS_RETRIES} failed:`, error)
      if (attempt < EDGE_TTS_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Edge TTS synthesis failed')
}

function audioResponse(audio: Buffer, totalChunks: number, chunkIndex: number, cached: boolean): NextResponse {
  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.length),
      'X-Total-Chunks': String(totalChunks),
      'X-Chunk-Index': String(chunkIndex),
      'X-Cache': cached ? 'hit' : 'miss',
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!authError && user) {
      return handleTtsRequest(supabase, user.id, req)
    }

    // Cookie session missing: try Bearer token from Authorization header.
    // Requests authenticated this way get a user-context client so that
    // RLS policies evaluate queries as the token's user.
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
      if (tokenUser) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (url && anonKey) {
          const userClient = createClient(url, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          })
          return handleTtsRequest(userClient, tokenUser.id, req)
        }
      }
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  } catch (error) {
    console.error('[Study TTS] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize audio' },
      { status: 500 }
    )
  }
}

async function handleTtsRequest(
  supabase: SupabaseClient,
  userId: string,
  req: Request
): Promise<NextResponse> {
  try {
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
      .eq('user_id', userId)
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

    // 5. Cache lookup: path keyed by course id + content hash + chunk index,
    //    so edited content naturally invalidates old cache entries
    const contentHash = createHash('sha256').update(fullText).digest('hex').slice(0, 16)
    const objectPath = `${courseId}/${contentHash}/chunk_${chunkIndex}.mp3`

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 500 }
      )
    }

    const { data: cachedBlob, error: cacheError } = await admin.storage
      .from(CACHE_BUCKET)
      .download(objectPath)

    if (!cacheError && cachedBlob) {
      const audio = Buffer.from(await cachedBlob.arrayBuffer())
      if (audio.length > 100) {
        return audioResponse(audio, chunks.length, chunkIndex, true)
      }
    }
    if (cacheError) {
      // Expected for cache misses, but log unexpected storage errors
      const msg = String(cacheError.message || cacheError)
      if (!/not found|does not exist|404/i.test(msg)) {
        console.error('[Study TTS] cache download error:', msg.slice(0, 200))
      }
    }

    // 6. Synthesize with Edge TTS (free, no API key) and update the cache
    const audio = await synthesizeChunk(xmlEscape(chunks[chunkIndex]))

    const { error: uploadError } = await admin.storage
      .from(CACHE_BUCKET)
      .upload(objectPath, new Uint8Array(audio), {
        contentType: 'audio/mpeg',
        upsert: true,
      })
    if (uploadError) {
      // Cache write failure must not break playback
      console.error('[Study TTS] cache upload failed (non-fatal):', String(uploadError).slice(0, 200))
    }

    return audioResponse(audio, chunks.length, chunkIndex, false)
  } catch (error) {
    console.error('[Study TTS] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize audio' },
      { status: 500 }
    )
  }
}
