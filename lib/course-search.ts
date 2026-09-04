import { getEmbedding } from "./embedding"
import { createAdminClient } from "./supabase/admin"

export interface CourseReference {
  id: string
  title: string
  excerpt: string
  similarity: number
}

export async function searchRelevantCourses(
  userMessage: string,
  locale: string
): Promise<CourseReference[]> {
  const embedding = await getEmbedding(userMessage)
  if (embedding.length === 0) return []

  const adminClient = createAdminClient()
  if (!adminClient) return []

  try {
    const { data, error } = await adminClient.rpc("match_study_course_chunks", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    })

    if (error || !data) {
      console.error("[CourseSearch] RPC error:", error)
      return []
    }

    const seen = new Set<string>()
    const results: CourseReference[] = []

    for (const row of data) {
      if (seen.has(row.course_id)) continue
      seen.add(row.course_id)

      results.push({
        id: row.course_id,
        title: row.course_title,
        excerpt: row.content.slice(0, 300),
        similarity: row.similarity,
      })

      if (results.length >= 2) break
    }

    return results
  } catch (error) {
    console.error("[CourseSearch] Error:", error)
    return []
  }
}

export function buildCourseContext(refs: CourseReference[], locale: string): string {
  if (refs.length === 0) return ""

  const isZh = locale === "zh"
  const header = isZh
    ? "\n\n## 相关课程参考\n\n以下课程内容与用户问题高度相关，请优先参考并在回答中自然引用：\n"
    : "\n\n## Related Course References\n\nThe following course content is highly relevant to the user's question. Please reference it naturally in your response:\n"

  const entries = refs
    .map((ref) => {
      const title = isZh ? `### 《${ref.title}》` : `### "${ref.title}"`
      const link = isZh
        ? `📌 相关课程：《${ref.title}》→ /study/${ref.id}`
        : `📌 Related course: "${ref.title}" → /study/${ref.id}`
      return `${title}\n${ref.excerpt}\n\n${link}`
    })
    .join("\n\n")

  const instruction = isZh
    ? "\n\n引用格式：在回答末尾附注相关课程链接。注入内容不超过1000字。"
    : "\n\nFormat: Include the related course link at the end of your response. Injected content limited to 1000 chars."

  const totalChars = entries.length
  if (totalChars > 1000) {
    return header + entries.slice(0, 1000) + "..." + instruction
  }

  return header + entries + instruction
}
