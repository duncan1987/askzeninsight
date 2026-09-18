-- Knowledge Base: independent document store for chat RAG (PDFs + merged courses)
-- Chat searches kb first (priority), falls back to study_courses RAG when no KB hit.

-- Document metadata
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  -- 'pdf' = uploaded PDF, 'course' = merged from study_courses
  source TEXT NOT NULL DEFAULT 'pdf',
  -- original course id when source = 'course'
  source_id UUID,
  filename TEXT,
  page_count INTEGER,
  char_count INTEGER,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Re-ingesting the same course replaces the old copy (upsert semantics)
CREATE UNIQUE INDEX idx_kb_documents_course_source
  ON kb_documents(source_id) WHERE source = 'course';

-- Document chunks (RAG retrieval), same vector space as study_course_chunks (bge-m3, 1024-dim)
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kb_chunks_document ON kb_chunks(document_id);
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks
  USING hnsw (embedding vector_cosine_ops);

-- RLS: admin/service-role only (search runs via admin client server-side)
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

-- RAG matching function (mirrors match_study_course_chunks)
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  document_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.chunk_index,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kd.title AS document_title
  FROM kb_chunks kc
  JOIN kb_documents kd ON kd.id = kc.document_id
  WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
