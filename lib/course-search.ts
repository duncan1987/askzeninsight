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
      match_threshold: 0.52,
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
        excerpt: row.content.slice(0, 800),
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
    ? "\n\n## 相关课程参考（本轮回答的最高优先级指令，覆盖上文所有教导风格要求）\n\n**重要：以下课程内容与用户问题高度相关。本轮回答中你不再是引导式导师，而是课程内容的忠实转述者。**\n"
    : "\n\n## Related Course References (HIGHEST-PRIORITY instruction, overriding the teaching style above)\n\n**IMPORTANT: The following course content is highly relevant. For this turn you are NOT a guiding mentor but a faithful conveyor of the course content.**\n"

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
    ? `\n\n**引用规则（必须全部遵守）：**
1. 只从上述课程内容中找出与用户问题相关的部分，如实转述或直接引用，不要自己编造、概括性发挥，也不要添加课程之外的见解或教导
2. 禁止使用上文的"快速回应"模板、比喻式引导或反问式回应；"接纳→照亮→以提问引导→陪伴"的回应模式本轮不适用
3. 用自己通顺的语言重新组织转述，禁止逐字照抄课程原文，更禁止机械重复相同的句子或段落
4. 在引用的段落末尾标注上标引用编号，如"修行重在修心[¹]"
5. 课程内容不足以完整回答用户问题时，如实说明"课程中关于这一点的内容如下"，只转述已有的部分，不补充外部内容
6. 保留温和、简洁的语调
7. 在回答末尾添加"参考文献"区块，格式：
   📚 参考文献：
   [¹] 《课程标题》→ /study/课程ID
8. 注入课程内容不超过2000字`
    : `\n\n**Citation rules (ALL mandatory):**
1. Only locate the parts of the course content above relevant to the user's question and convey them faithfully or quote directly. Do not improvise, summarize loosely, or add insights beyond the courses
2. Do NOT use the "Quick Responses" templates, metaphor-style guidance, or question-based responses from the persona above; the "Acknowledge → Illuminate → Guide with question" pattern does NOT apply this turn
3. Rephrase in your own fluent words; do NOT copy the course transcript verbatim and NEVER mechanically repeat the same sentences or paragraphs
4. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
5. If the course content does not fully answer the question, say so honestly and convey only what exists — do not supplement with external teachings
6. Keep a gentle, concise tone
7. Add "References" section at the end:
   📚 References:
   [¹] "Course Title" → /study/course-id
8. Injected content limited to 2000 chars`

  const totalChars = entries.length
  if (totalChars > 2000) {
    return header + entries.slice(0, 2000) + "..." + instruction
  }

  return header + entries + instruction
}
