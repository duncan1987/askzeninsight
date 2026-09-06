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
      match_threshold: 0.5,
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
    ? "\n\n## 相关课程参考（必须优先引用）\n\n**重要指令：以下课程内容与用户问题高度相关，你必须优先参考这些内容来回答，而不是自行发挥。回答时请在相关段落末尾用上标标注引用来源，格式如[¹]、[²]，并在回答最后列出参考文献。**\n"
    : "\n\n## Related Course References (MUST prioritize)\n\n**IMPORTANT: The following course content is highly relevant. You MUST prioritize referencing this content over generating your own. Add superscript citations like [¹], [²] after relevant paragraphs, and list references at the end.**\n"

  const entries = refs
    .map((ref, idx) => {
      const num = idx + 1
      const circledNum = `⁰¹²³⁴⁵⁶⁷⁸⁹`[num] || String(num)
      const title = isZh ? `### [${circledNum}] 《${ref.title}》` : `### [${circledNum}] "${ref.title}"`
      const link = isZh
        ? `/study/${ref.id}`
        : `/study/${ref.id}`
      return `${title}\n${ref.excerpt}\n链接：${link}`
    })
    .join("\n\n")

  const instruction = isZh
    ? `\n\n**引用规则：**
1. 回答时必须优先使用上述课程内容，不要自己编造
2. 在引用的段落末尾标注上标引用编号，如"修行重在修心[¹]"
3. 在回答末尾添加"参考文献"区块，格式：
   📚 参考文献：
   [¹] 《课程标题》→ /study/课程ID
4. 注入课程内容不超过1000字`
    : `\n\n**Citation rules:**
1. MUST prioritize the course content above over your own knowledge
2. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
3. Add "References" section at the end:
   📚 References:
   [¹] "Course Title" → /study/course-id
4. Injected content limited to 1000 chars`

  const totalChars = entries.length
  if (totalChars > 1000) {
    return header + entries.slice(0, 1000) + "..." + instruction
  }

  return header + entries + instruction
}
