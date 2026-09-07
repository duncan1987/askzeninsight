/**
 * Study TTS API integration tests (Edge TTS + Supabase Storage cache)
 *
 * Requires a running dev server on http://localhost:3000
 * Run: pnpm test study-tts.test.ts
 */

import { createClient } from '@supabase/supabase-js'
import { createUser, deleteUser, TestUser } from './helpers/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BASE_URL = 'http://localhost:3000'

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const TEST_COURSE_TITLE = 'TTS 测试课程'
const TEST_COURSE_CONTENT = '<p>这是一段用于测试语音合成的课程内容。第一句话用来验证分块逻辑！当内容足够长时，会被切分为多个分块；每个分块单独合成音频。测试完成后会自动清理数据，不会影响线上内容。</p>'

describe('Study TTS API (Edge TTS + cache)', () => {
  let testUser: TestUser
  let courseId: string
  const admin = getAdminClient()

  beforeAll(async () => {
    // 1. Create a test user
    testUser = await createUser({
      email: `tts-test-${Date.now()}@test.local`,
      password: 'Test1234pass',
    })

    // 2. Create a published course directly in DB
    const { data: course, error: courseError } = await admin
      .from('study_courses')
      .insert({
        title: TEST_COURSE_TITLE,
        content_html: TEST_COURSE_CONTENT,
        is_published: true,
        sort_order: 9999,
      })
      .select('id')
      .single()

    if (courseError) throw new Error(`Failed to create test course: ${courseError.message}`)
    courseId = course.id

    // 3. Create a check-in row for the test user (TTS requires check-in)
    const { error: checkinError } = await admin
      .from('study_checkins')
      .insert({ user_id: testUser.id, course_id: courseId })
    if (checkinError) throw new Error(`Failed to create check-in: ${checkinError.message}`)
  }, 120000)

  afterAll(async () => {
    // Clean up: storage cache objects, check-in, course, user
    if (courseId) {
      const { data: objects } = await admin.storage.from('tts-cache').list(courseId)
      if (objects && objects.length > 0) {
        const paths = objects.map((o) => `${courseId}/${o.name}`)
        // Objects may be nested under a hash dir; list one level deeper
        const deepPaths: string[] = []
        for (const o of objects) {
          const { data: nested } = await admin.storage.from('tts-cache').list(`${courseId}/${o.name}`)
          if (nested) {
            for (const n of nested) deepPaths.push(`${courseId}/${o.name}/${n.name}`)
          }
        }
        await admin.storage.from('tts-cache').remove([...paths, ...deepPaths])
      }
      await admin.from('study_checkins').delete().eq('course_id', courseId)
      await admin.from('study_courses').delete().eq('id', courseId)
    }
    if (testUser) {
      await deleteUser(testUser.id)
    }
  }, 120000)

  test('rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/study/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, chunkIndex: 0 }),
    })
    expect(res.status).toBe(401)
  })

  test('rejects requests without check-in', async () => {
    // Create a second user without a check-in
    const otherUser = await createUser({
      email: `tts-nocheckin-${Date.now()}@test.local`,
      password: 'Test1234pass',
    })
    try {
      const res = await fetch(`${BASE_URL}/api/study/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherUser.accessToken}`,
        },
        body: JSON.stringify({ courseId, chunkIndex: 0 }),
      })
      expect(res.status).toBe(403)
    } finally {
      await deleteUser(otherUser.id)
    }
  }, 60000)

  test('synthesizes audio on cache miss, then serves from cache on hit', async () => {
    const doRequest = () =>
      fetch(`${BASE_URL}/api/study/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUser.accessToken}`,
        },
        body: JSON.stringify({ courseId, chunkIndex: 0 }),
      })

    // First request: cache miss -> Edge TTS synthesis
    const first = await doRequest()
    expect(first.status).toBe(200)
    expect(first.headers.get('content-type')).toBe('audio/mpeg')
    expect(first.headers.get('x-cache')).toBe('miss')
    expect(Number(first.headers.get('x-total-chunks'))).toBeGreaterThanOrEqual(1)
    expect(first.headers.get('x-chunk-index')).toBe('0')

    const firstAudio = Buffer.from(await first.arrayBuffer())
    expect(firstAudio.length).toBeGreaterThan(1000)
    // MP3 frame sync: first byte 0xFF, second byte high bits set (0xFx)
    expect(firstAudio[0]).toBe(0xff)
    expect(firstAudio[1] & 0xe0).toBe(0xe0)

    // Second request: cache hit -> byte-identical audio
    const second = await doRequest()
    expect(second.status).toBe(200)
    expect(second.headers.get('x-cache')).toBe('hit')

    const secondAudio = Buffer.from(await second.arrayBuffer())
    expect(secondAudio.equals(firstAudio)).toBe(true)
  }, 120000)

  test('rejects out-of-range chunk index', async () => {
    const res = await fetch(`${BASE_URL}/api/study/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.accessToken}`,
      },
      body: JSON.stringify({ courseId, chunkIndex: 9999 }),
    })
    expect(res.status).toBe(400)
  })
})
