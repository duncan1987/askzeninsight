/*
 * Knowledge base retrieval for chat RAG.
 *
 * Priority: KB is searched FIRST; course RAG (lib/course-search.ts) only
 * runs as fallback when the KB has no relevant hit. This keeps the
 * existing course extraction logic completely untouched.
 */

import { getEmbedding } from "./embedding"
import { createAdminClient } from "./supabase/admin"

export interface KbReference {
  id: string
  title: string
  excerpt: string
  similarity: number
}

export type KbContextMode = 'search' | 'summary'

export async function searchKnowledgeBase(userMessage: string): Promise<KbReference[]> {
  const embedding = await getEmbedding(userMessage)
  if (embedding.length === 0) return []

  const adminClient = createAdminClient()
  if (!adminClient) return []

  try {
    const { data, error } = await adminClient.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.52,
      match_count: 5,
    })

    if (error || !data) {
      console.error("[KB Search] RPC error:", error)
      return []
    }

    const seen = new Set<string>()
    const results: KbReference[] = []

    for (const row of data) {
      if (seen.has(row.document_id)) continue
      seen.add(row.document_id)

      results.push({
        id: row.document_id,
        title: row.document_title,
        excerpt: row.content.slice(0, 800),
        similarity: row.similarity,
      })

      if (results.length >= 2) break
    }

    return results
  } catch (error) {
    console.error("[KB Search] Error:", error)
    return []
  }
}

export function buildKbContext(refs: KbReference[], locale: string, mode: KbContextMode = 'search'): string {
  if (refs.length === 0) return ""

  const isZh = locale === "zh"
  const header = isZh
    ? mode === 'summary'
      ? "\n\n## 知识库参考文档（本轮回答的最高优先级指令，覆盖上文所有教导风格要求）\n\n**重要：以下知识库文档内容与用户问题高度相关。本轮回答中你不再是引导式导师，而是文档内容的忠实归纳者：以文档内容为依据进行适当的总结与整理。**\n"
      : "\n\n## 知识库参考文档（本轮回答的最高优先级指令，覆盖上文所有教导风格要求）\n\n**重要：以下知识库文档内容与用户问题高度相关。本轮回答中你不再是引导式导师，而是文档内容的忠实转述者。**\n"
    : mode === 'summary'
      ? "\n\n## Knowledge base references (HIGHEST-PRIORITY instruction, overriding the teaching style above)\n\n**IMPORTANT: The following knowledge base content is highly relevant. For this turn you are NOT a guiding mentor but a faithful summarizer: organize and summarize it appropriately while staying grounded in it.**\n"
      : "\n\n## Knowledge base references (HIGHEST-PRIORITY instruction, overriding the teaching style above)\n\n**IMPORTANT: The following knowledge base content is highly relevant. For this turn you are NOT a guiding mentor but a faithful conveyor of the document content.**\n"

  const entries = refs
    .map((ref, idx) => {
      const num = idx + 1
      const circledNum = `⁰¹²³⁴⁵⁶⁷⁸⁹`[num] || String(num)
      const title = isZh ? `### [${circledNum}] 《${ref.title}》` : `### [${circledNum}] "${ref.title}"`
      return `${title}\n${ref.excerpt}`
    })
    .join("\n\n")

  const instruction = isZh
    ? mode === 'summary'
      ? `\n\n**引用规则（必须全部遵守）：**
1. 以下文档内容是回答的唯一依据：可在此基础上适当归纳、整理与总结，帮助用户理解
2. 禁止脱离文档内容自行发挥、编造，也不要添加文档之外的见解或教导
3. 用自己通顺的语言组织，禁止逐字照抄文档原文，更禁止机械重复相同的句子或段落
4. 在引用的段落末尾标注上标引用编号，如"修行重在修心[¹]"
5. 文档内容不足以完整回答用户问题时，如实说明"文档中关于这一点的内容如下"，只总结已有的部分，不补充外部内容
6. 保留温和、简洁的语调
7. 在回答末尾添加"参考文献"区块，格式：
   📚 参考文献：
   [¹] 《文档标题》
8. 注入内容不超过2000字`
      : `\n\n**引用规则（必须全部遵守）：**
1. 只从上述文档内容中找出与用户问题相关的部分，如实转述或直接引用，不要自己编造、概括性发挥，也不要添加文档之外的见解或教导
2. 禁止使用上文的"快速回应"模板、比喻式引导或反问式回应；"接纳→照亮→以提问引导→陪伴"的回应模式本轮不适用
3. 用自己通顺的语言重新组织转述，禁止逐字照抄文档原文，更禁止机械重复相同的句子或段落
4. 在引用的段落末尾标注上标引用编号，如"修行重在修心[¹]"
5. 文档内容不足以完整回答用户问题时，如实说明"文档中关于这一点的内容如下"，只转述已有的部分，不补充外部内容
6. 保留温和、简洁的语调
7. 在回答末尾添加"参考文献"区块，格式：
   📚 参考文献：
   [¹] 《文档标题》
8. 注入内容不超过2000字`
    : mode === 'summary'
      ? `\n\n**Citation rules (ALL mandatory):**
1. The document content above is the ONLY basis for your answer: you may organize, condense, and summarize it appropriately to help the user understand
2. Do NOT improvise beyond the document content, and do not add insights or teachings beyond the documents
3. Rephrase in your own fluent words; do NOT copy the document verbatim and NEVER mechanically repeat the same sentences or paragraphs
4. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
5. If the document content does not fully answer the question, say so honestly and summarize only what exists — do not supplement with external teachings
6. Keep a gentle, concise tone
7. Add "References" section at the end:
   📚 References:
   [¹] "Document Title"
8. Injected content limited to 2000 chars`
      : `\n\n**Citation rules (ALL mandatory):**
1. Only locate the parts of the document content above relevant to the user's question and convey them faithfully or quote directly. Do not improvise, summarize loosely, or add insights beyond the documents
2. Do NOT use the "Quick Responses" templates, metaphor-style guidance, or question-based responses from the persona above; the "Acknowledge → Illuminate → Guide with question" pattern does NOT apply this turn
3. Rephrase in your own fluent words; do NOT copy the document verbatim and NEVER mechanically repeat the same sentences or paragraphs
4. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
5. If the document content does not fully answer the question, say so honestly and convey only what exists — do not supplement with external teachings
6. Keep a gentle, concise tone
7. Add "References" section at the end:
   📚 References:
   [¹] "Document Title"
8. Injected content limited to 2000 chars`

  const totalChars = entries.length
  if (totalChars > 2000) {
    return header + entries.slice(0, 2000) + "..." + instruction
  }

  return header + entries + instruction
}
