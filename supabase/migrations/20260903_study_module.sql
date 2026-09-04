-- Study Module: Course checkin community + Blog posts + RAG
-- Replaces /meditation with /study (zh-only)

CREATE EXTENSION IF NOT EXISTS vector;

-- Course table
CREATE TABLE study_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,
  truncation_index INTEGER,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  title_embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Course content chunks (RAG retrieval)
CREATE TABLE study_course_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checkin records
CREATE TABLE study_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Comments
CREATE TABLE study_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK(char_length(content) <= 1000 AND char_length(content) > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Blog posts (admin-published from courses or standalone)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  content_html TEXT NOT NULL,
  cover_image TEXT,
  cover_image_alt TEXT DEFAULT '',
  category TEXT DEFAULT 'meditation',
  tags TEXT[] DEFAULT '{}',
  author TEXT DEFAULT 'koji',
  is_published BOOLEAN DEFAULT false,
  source_course_id UUID REFERENCES study_courses(id),
  locale TEXT DEFAULT 'zh',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_study_checkins_user ON study_checkins(user_id);
CREATE INDEX idx_study_checkins_course ON study_checkins(course_id);
CREATE INDEX idx_study_comments_course ON study_comments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_study_comments_user ON study_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_study_courses_published ON study_courses(is_published, sort_order);
CREATE INDEX idx_study_course_chunks_course ON study_course_chunks(course_id);
CREATE INDEX idx_course_chunks_embedding ON study_course_chunks
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_course_title_embedding ON study_courses
  USING hnsw (title_embedding vector_cosine_ops);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category) WHERE is_published = true;

-- RLS
ALTER TABLE study_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_course_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by all"
  ON study_courses FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view own checkins"
  ON study_checkins FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own checkins"
  ON study_checkins FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Active comments are viewable by all"
  ON study_comments FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments"
  ON study_comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course chunks viewable by all"
  ON study_course_chunks FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_courses WHERE study_courses.id = study_course_chunks.course_id AND is_published = true));

CREATE POLICY "Published blogs are viewable by all"
  ON blog_posts FOR SELECT USING (is_published = true);

-- RAG matching function
CREATE OR REPLACE FUNCTION match_study_course_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  course_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  course_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.course_id,
    sc.chunk_index,
    sc.content,
    1 - (sc.embedding <=> query_embedding) AS similarity,
    stu.title AS course_title
  FROM study_course_chunks sc
  JOIN study_courses stu ON stu.id = sc.course_id
  WHERE stu.is_published = true
    AND 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
