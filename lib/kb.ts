/*
 * Knowledge base ingestion & management.
 *
 * KB is an independent document store (PDF uploads + courses merged in)
 * searched FIRST by the chat RAG, ahead of study_courses.
 * Vector space: bge-m3 1024-dim (same as course chunks, see lib/embedding.ts).
 */

import { createAdminClient } from "./supabase/admin"
import { getEmbeddings, chunkText, stripHtml } from "./embedding"

export interface KbDocument {
  id: string
  title: string
  source: string
  source_id: string | null
  filename: string | null
  page_count: number | null
  char_count: number | null
  chunk_count: number
  created_at: string
}

const BATCH_SIZE = 16

export interface IngestKbDocumentInput {
  title: string
  source: 'pdf' | 'course'
  sourceId?: string
  filename?: string
  pageCount?: number
  text: string
}

export interface IngestResult {
  id: string
  title: string
  chunkCount: number
  charCount: number
  replaced: boolean
}

/**
 * Ingest plain text into the knowledge base: chunk -> embed -> insert.
 * Re-ingesting the same course (sourceId) replaces the previous copy.
 */
export async function ingestKbDocument(input: IngestKbDocumentInput): Promise<IngestResult> {
  const adminClient = createAdminClient()
  if (!adminClient) {
    throw new Error('Database is not configured')
  }

  const text = input.text.trim()
  if (text.length === 0) {
    throw new Error('文档内容为空，无法向量化')
  }

  // Same course merged twice -> replace the old copy (chunks cascade-deleted)
  let replaced = false
  if (input.source === 'course' && input.sourceId) {
    const { data: existing } = await adminClient
      .from('kb_documents')
      .select('id')
      .eq('source', 'course')
      .eq('source_id', input.sourceId)
      .maybeSingle()
    if (existing) {
      const { error: delError } = await adminClient
        .from('kb_documents')
        .delete()
        .eq('id', existing.id)
      if (delError) {
        throw new Error(`替换旧版本失败: ${delError.message}`)
      }
      replaced = true
    }
  }

  const chunks = chunkText(text)

  const { data: doc, error: docError } = await adminClient
    .from('kb_documents')
    .insert({
      title: input.title,
      source: input.source,
      source_id: input.sourceId ?? null,
      filename: input.filename ?? null,
      page_count: input.pageCount ?? null,
      char_count: text.length,
      chunk_count: 0,
    })
    .select('id, title')
    .single()

  if (docError || !doc) {
    throw new Error(`创建知识库文档失败: ${docError?.message ?? 'unknown'}`)
  }

  let inserted = 0
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await getEmbeddings(batch)

    const records = batch.map((content, j) => ({
      document_id: doc.id,
      chunk_index: i + j,
      content,
      embedding: embeddings[j] || [],
    }))

    const validRecords = records.filter((r) => r.embedding.length > 0)
    if (validRecords.length > 0) {
      const { error: insertError } = await adminClient.from('kb_chunks').insert(validRecords)
      if (insertError) {
        console.error('[KB] Failed to insert chunks:', insertError)
        throw new Error(`写入向量数据失败: ${insertError.message}`)
      }
      inserted += validRecords.length
    }
  }

  if (inserted === 0) {
    // Nothing embedded (providers down) -> roll back the document row
    await adminClient.from('kb_documents').delete().eq('id', doc.id)
    throw new Error('向量化服务不可用（embedding 提供商无响应），请稍后重试')
  }

  await adminClient.from('kb_documents').update({ chunk_count: inserted }).eq('id', doc.id)

  console.log(`[KB] Ingested "${input.title}": ${chunks.length} chunks, ${inserted} embedded`)
  return { id: doc.id, title: doc.title, chunkCount: inserted, charCount: text.length, replaced }
}

/** Strip HTML and ingest course content into the KB. */
export async function ingestCourseIntoKb(courseId: string): Promise<IngestResult> {
  const adminClient = createAdminClient()
  if (!adminClient) {
    throw new Error('Database is not configured')
  }

  const { data: course, error } = await adminClient
    .from('study_courses')
    .select('id, title, content_html')
    .eq('id', courseId)
    .maybeSingle()

  if (error || !course) {
    throw new Error('课程不存在')
  }

  const plainText = stripHtml(course.content_html)
  return ingestKbDocument({
    title: course.title,
    source: 'course',
    sourceId: course.id,
    text: plainText,
  })
}

export async function listKbDocuments(): Promise<KbDocument[]> {
  const adminClient = createAdminClient()
  if (!adminClient) return []

  const { data, error } = await adminClient
    .from('kb_documents')
    .select('id, title, source, source_id, filename, page_count, char_count, chunk_count, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[KB] List error:', error)
    throw new Error('获取知识库文档列表失败')
  }
  return (data || []) as KbDocument[]
}

export async function deleteKbDocument(id: string): Promise<void> {
  const adminClient = createAdminClient()
  if (!adminClient) {
    throw new Error('Database is not configured')
  }

  const { error } = await adminClient.from('kb_documents').delete().eq('id', id)
  if (error) {
    throw new Error(`删除失败: ${error.message}`)
  }
  // kb_chunks cascade-deleted by FK
}
