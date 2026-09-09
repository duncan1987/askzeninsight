/*
 * Embedding providers (all 1024-dim).
 *
 * Priority chain:
 *   1. SiliconFlow BAAI/bge-m3 — free (primary)
 *   2. Cloudflare Workers AI bge-m3 — free (fallback; SAME model as #1,
 *      same vector space, safe to mix)
 *   3. Zhipu embedding-3 — paid legacy (used ONLY when neither free
 *      provider is configured, i.e. the pre-migration index)
 *
 * Vector-space safety: when a free provider is configured, a failure never
 * falls through to Zhipu — mixing embedding-3 vectors with a bge-m3 index
 * (or vice versa) would silently corrupt retrieval. Failures degrade to
 * an empty vector, and the RAG layer skips course injection.
 */

const SILICONFLOW_EMBEDDING_URL = "https://api.siliconflow.cn/v1/embeddings"
const SILICONFLOW_EMBEDDING_MODEL = "BAAI/bge-m3"

const CLOUDFLARE_AI_RUN_URL = "https://api.cloudflare.com/client/v4/accounts"
const CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-m3"

const ZHIPU_EMBEDDING_API_URL = "https://open.bigmodel.cn/api/paas/v4/embeddings"
const ZHIPU_EMBEDDING_MODEL = "embedding-3"

const EMBEDDING_DIMENSIONS = 1024
const REQUEST_TIMEOUT_MS = 15000

interface CloudflareConfig {
  accountId: string
  token: string
}

function getSiliconFlowKey(): string | null {
  return process.env.SILICONFLOW_API_KEY || null
}

function getCloudflareConfig(): CloudflareConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  return accountId && token ? { accountId, token } : null
}

function getZhipuKey(): string | null {
  return process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_FREE || null
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function embedViaSiliconFlow(inputs: string[]): Promise<number[][]> {
  const key = getSiliconFlowKey()
  if (!key) return []

  const response = await fetchWithTimeout(SILICONFLOW_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: SILICONFLOW_EMBEDDING_MODEL,
      input: inputs,
      encoding_format: "float",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[Embedding] SiliconFlow error:", response.status, error.slice(0, 200))
    return []
  }

  const data = await response.json()
  return (data.data || []).map((item: { embedding: number[] }) => item.embedding)
}

async function embedViaCloudflare(inputs: string[], cf: CloudflareConfig): Promise<number[][]> {
  const response = await fetchWithTimeout(
    `${CLOUDFLARE_AI_RUN_URL}/${cf.accountId}/ai/run/${CLOUDFLARE_EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cf.token}`,
      },
      body: JSON.stringify({ text: inputs }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error("[Embedding] Cloudflare error:", response.status, error.slice(0, 200))
    return []
  }

  const data = await response.json()
  if (!data?.success || !data?.result?.data) {
    console.error("[Embedding] Cloudflare unexpected response:", JSON.stringify(data).slice(0, 200))
    return []
  }
  return (data.result.data || []).map((item: { embedding: number[] }) => item.embedding)
}

async function embedViaZhipu(inputs: string[]): Promise<number[][]> {
  const key = getZhipuKey()
  if (!key) return []

  const response = await fetchWithTimeout(ZHIPU_EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: ZHIPU_EMBEDDING_MODEL,
      input: inputs,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[Embedding] Zhipu error:", response.status, error.slice(0, 200))
    return []
  }

  const data = await response.json()
  return (data.data || []).map((item: { embedding: number[] }) => item.embedding)
}

async function embed(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return []

  const sfKey = getSiliconFlowKey()
  const cf = getCloudflareConfig()

  // Free bge-m3 chain (same vector space, safe fallback within the chain)
  if (sfKey) {
    try {
      const out = await embedViaSiliconFlow(inputs)
      if (out.length === inputs.length) return out
    } catch (err) {
      console.error("[Embedding] SiliconFlow request failed:", err)
    }
  }
  if (cf) {
    try {
      const out = await embedViaCloudflare(inputs, cf)
      if (out.length === inputs.length) return out
    } catch (err) {
      console.error("[Embedding] Cloudflare request failed:", err)
    }
  }

  // No free provider configured at all -> legacy Zhipu path (pre-migration
  // index is embedding-3, so this keeps RAG working until migration).
  if (!sfKey && !cf) {
    return embedViaZhipu(inputs)
  }

  // A free provider IS configured but failed: never fall through to Zhipu
  // (incompatible vector space). RAG degrades gracefully instead.
  console.warn("[Embedding] All free providers failed; skipping embeddings")
  return []
}

export async function getEmbedding(text: string): Promise<number[]> {
  const vectors = await embed([text])
  return vectors[0] || []
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  return embed(texts)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  if (text.length <= chunkSize) return [text]

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + chunkSize
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf("。", end)
      const lastNewline = text.lastIndexOf("\n", end)
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > start) end = breakPoint + 1
    }
    chunks.push(text.slice(start, end))
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

export async function generateCourseEmbeddings(
  courseId: string,
  contentHtml: string,
  title: string
): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin")
  const adminClient = createAdminClient()
  if (!adminClient) return

  const plainText = stripHtml(contentHtml)
  const chunks = chunkText(plainText)

  // Generate title embedding
  const titleEmbedding = await getEmbedding(title)
  if (titleEmbedding.length > 0) {
    await adminClient
      .from("study_courses")
      .update({ title_embedding: titleEmbedding })
      .eq("id", courseId)
  }

  // Delete existing chunks
  await adminClient.from("study_course_chunks").delete().eq("course_id", courseId)

  // Generate chunk embeddings in batches of 16
  const batchSize = 16
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddings = await getEmbeddings(batch)

    const records = batch.map((content, j) => ({
      course_id: courseId,
      chunk_index: i + j,
      content,
      embedding: embeddings[j] || [],
    }))

    const validRecords = records.filter((r) => r.embedding.length > 0)
    if (validRecords.length > 0) {
      const { error } = await adminClient.from("study_course_chunks").insert(validRecords)
      if (error) {
        console.error("[Embedding] Failed to insert chunks:", error)
      }
    }
  }

  console.log(`[Embedding] Generated ${chunks.length} chunks for course ${courseId}`)
}
