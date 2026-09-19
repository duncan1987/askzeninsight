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

// Retrieval sizing: with a 128K-token model context window, injecting a few
// thousand characters of source text costs almost nothing but dramatically
// improves answer completeness (a single ~500-char chunk starves the model).
const KB_MAX_CHUNKS = 6 // total chunks injected per query
const KB_MAX_CHUNKS_PER_DOC = 4 // per-document cap for cross-doc diversity
const KB_EXCERPT_LIMIT = 2200 // chars per merged document excerpt

export async function searchKnowledgeBase(userMessage: string): Promise<KbReference[]> {
  const embedding = await getEmbedding(userMessage)
  if (embedding.length === 0) return []

  const adminClient = createAdminClient()
  if (!adminClient) return []

  try {
    const { data, error } = await adminClient.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.52,
      match_count: 10,
    })

    if (error || !data) {
      console.error("[KB Search] RPC error:", error)
      return []
    }

    // Take up to KB_MAX_CHUNKS chunks overall, with a per-document cap.
    // Multiple chunks from the same document are allowed (a whole book may
    // have many relevant passages) and are merged into one excerpt, ordered
    // by chunk_index so the text reads coherently.
    const chunksPerDoc = new Map<string, number>()
    const selected: Array<{ documentId: string, documentTitle: string, similarity: number, chunkIndex: number, content: string }> = []

    for (const row of data) {
      if (selected.length >= KB_MAX_CHUNKS) break
      const count = chunksPerDoc.get(row.document_id) || 0
      if (count >= KB_MAX_CHUNKS_PER_DOC) continue

      chunksPerDoc.set(row.document_id, count + 1)
      selected.push({
        documentId: row.document_id,
        documentTitle: row.document_title,
        similarity: row.similarity,
        chunkIndex: row.chunk_index,
        content: row.content,
      })
    }

    // Group selected chunks by document (keeping first-seen order)
    const byDoc = new Map<string, typeof selected>()
    for (const chunk of selected) {
      const list = byDoc.get(chunk.documentId) || []
      list.push(chunk)
      byDoc.set(chunk.documentId, list)
    }

    const results: KbReference[] = []
    for (const [documentId, chunks] of byDoc) {
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
      const mergedExcerpt = chunks
        .map(c => c.content)
        .join("\n……\n")
        .slice(0, KB_EXCERPT_LIMIT)
      results.push({
        id: documentId,
        title: chunks[0].documentTitle,
        excerpt: mergedExcerpt,
        similarity: chunks[0].similarity,
      })
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
1. 将上述文档内容中与用户问题相关的**全部**内容完整转述，分段或分点组织，不要遗漏相关要点，也不要只回答一句话；不得编造，也不得添加文档之外的见解或教导
2. 禁止使用上文的"快速回应"模板、比喻式引导或反问式回应；"接纳→照亮→以提问引导→陪伴"的回应模式本轮不适用
3. 用自己通顺的语言重新组织转述，禁止逐字照抄文档原文，更禁止机械重复相同的句子或段落
4. 在引用的段落末尾标注上标引用编号，如"修行重在修心[¹]"
5. 文档内容不足以完整回答用户问题时，如实说明"文档中关于这一点的内容如下"，只转述已有的部分，不补充外部内容
6. 保留温和、简洁的语调
7. 在回答末尾**必须**添加"参考文献"区块（不可省略），格式：
   📚 参考文献：
   [¹] 《文档标题》
8. 注入内容不超过6000字`
    : mode === 'summary'
      ? `\n\n**Citation rules (ALL mandatory):**
1. The document content above is the ONLY basis for your answer: you may organize, condense, and summarize it appropriately to help the user understand
2. Do NOT improvise beyond the document content, and do not add insights or teachings beyond the documents
3. Rephrase in your own fluent words; do NOT copy the document verbatim and NEVER mechanically repeat the same sentences or paragraphs
4. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
5. If the document content does not fully answer the question, say so honestly and summarize only what exists — do not supplement with external teachings
6. Keep a gentle, concise tone
7. You MUST add a "References" section at the end (never omit it):
   📚 References:
   [¹] "Document Title"
8. Injected content limited to 6000 chars`
      : `\n\n**Citation rules (ALL mandatory):**
1. Convey ALL parts of the document content above that are relevant to the user's question, organized in paragraphs or bullet points. Do not omit relevant points and do NOT answer with just a single sentence; do not improvise or add insights beyond the documents
2. Do NOT use the "Quick Responses" templates, metaphor-style guidance, or question-based responses from the persona above; the "Acknowledge → Illuminate → Guide with question" pattern does NOT apply this turn
3. Rephrase in your own fluent words; do NOT copy the document verbatim and NEVER mechanically repeat the same sentences or paragraphs
4. Add superscript citation numbers after referenced paragraphs, e.g. "practice focuses on the mind[¹]"
5. If the document content does not fully answer the question, say so honestly and convey only what exists — do not supplement with external teachings
6. Keep a gentle, concise tone
7. You MUST add a "References" section at the end (never omit it):
   📚 References:
   [¹] "Document Title"
8. Injected content limited to 6000 chars`

  const totalChars = entries.length
  if (totalChars > 6000) {
    return header + entries.slice(0, 6000) + "..." + instruction
  }

  return header + entries + instruction
}
