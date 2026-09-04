const EMBEDDING_API_URL = "https://open.bigmodel.cn/api/paas/v4/embeddings"
const EMBEDDING_MODEL = "embedding-3"
const EMBEDDING_DIMENSIONS = 1024

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_FREE
  if (!apiKey) {
    console.warn("[Embedding] No API key configured")
    return []
  }

  const response = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[Embedding] API error:", response.status, error)
    return []
  }

  const data = await response.json()
  return data.data?.[0]?.embedding || []
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_FREE
  if (!apiKey) return []

  const response = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    console.error("[Embedding] Batch API error:", response.status)
    return []
  }

  const data = await response.json()
  return (data.data || []).map((item: { embedding: number[] }) => item.embedding)
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
