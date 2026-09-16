import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const ZHIPU_CHAT_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MODEL = 'glm-4-flash-250414'

const MAX_TOTAL_CHARS = 20000
const CHUNK_SIZE = 6000
const CHUNK_TIMEOUT_MS = 30000

interface TypoFinding {
  wrong: string
  before: string
  after: string
  suggestion: string
  reason: string
}

const SYSTEM_PROMPT = `你是中文错别字检测器。检查用户文本中的错别字：写错的字/词，包括同音字误用（如"在/再"、"以/已"）、形近字误用（如"己/已"、"末/未"）、词语误写（如"迫不急待/迫不及待"）。

只报告高置信度、确定的错误；不确定的一律不报。以下情况不要报告：
- 标点符号、空格、排版格式问题
- 佛经、古文原文用词（如"般若""涅槃""无明""如是"等佛教用语一律不算错）
- 人名、地名、专有名词
- 有意为之的口语、方言、引文

返回纯 JSON 数组（不要任何其他文字、不要 markdown 代码块），每项格式：
{"wrong":"出错的原文片段（2-6字，只包含错误部分，必须与原文逐字一致）","before":"错误片段前紧邻的1-3个字（无则为空字符串）","after":"错误片段后紧邻的1-3个字（无则为空字符串）","suggestion":"正确的写法","reason":"简短原因"}

若没有错别字，返回 []

注意：wrong 必须是从原文中逐字复制的片段，before/after 用于在原文中唯一定位，同一处错误只报一次。`

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length)
    if (end < text.length) {
      // 尽量在换行处断开，避免拆断句子导致误报
      const lastBreak = text.lastIndexOf('\n', end)
      if (lastBreak > start) end = lastBreak
    }
    chunks.push(text.slice(start, end))
    start = end
  }
  return chunks
}

function parseTypos(raw: string): TypoFinding[] {
  let content = raw.trim()
  // 去掉可能的 markdown 代码块包裹
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  // 截取第一个 [ 到最后一个 ] 之间的内容，容错模型输出前后缀文字
  const firstBracket = content.indexOf('[')
  const lastBracket = content.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    content = content.slice(firstBracket, lastBracket + 1)
  }
  try {
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is TypoFinding =>
        item &&
        typeof item === 'object' &&
        typeof item.wrong === 'string' &&
        item.wrong.length > 0
    )
  } catch {
    console.error('[Typos API] Failed to parse model output:', raw.substring(0, 300))
    return []
  }
}

async function checkChunk(text: string, apiKey: string): Promise<TypoFinding[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS)

  try {
    const response = await fetch(ZHIPU_CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Typos API] AI error:', response.status, errorText.substring(0, 200))
      throw new Error(`AI service error (${response.status})`)
    }

    const data = await response.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    return parseTypos(content)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录后再使用错别字校验' }, { status: 401 })
    }

    const apiKey = process.env.ZHIPU_API_FREE || process.env.ZHIPU_API_KEY
    if (!apiKey) {
      console.error('[Typos API] No Zhipu API key configured')
      return NextResponse.json({ error: '校验服务未配置，请联系管理员' }, { status: 500 })
    }

    const body = await req.json()
    const text: unknown = body?.text
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: '没有可校验的文字' }, { status: 400 })
    }
    if (text.length > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: `文本过长（${text.length} 字），目前支持最长 ${MAX_TOTAL_CHARS} 字` },
        { status: 400 }
      )
    }

    const chunks = splitIntoChunks(text)
    const typos: TypoFinding[] = []
    for (const chunk of chunks) {
      // 顺序调用，避免并发触发限流
      typos.push(...(await checkChunk(chunk, apiKey)))
    }

    console.log('[Typos API] Checked', text.length, 'chars,', typos.length, 'typos found')
    return NextResponse.json({ typos })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: '校验超时，请稍后重试' }, { status: 504 })
    }
    console.error('[Typos API] Error:', error)
    return NextResponse.json({ error: '校验失败，请稍后重试' }, { status: 500 })
  }
}
