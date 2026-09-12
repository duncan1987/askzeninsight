-- Co-create Course Module: outline-based section collaboration
-- Depends on: 20260903_study_module.sql, 20260906_user_groups_and_password_reset.sql

-- Course table extension
ALTER TABLE study_courses ADD COLUMN course_type TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE study_courses ADD COLUMN cocreate_group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL;
ALTER TABLE study_courses ADD COLUMN cocreate_status TEXT; -- cocreate: 'in_progress' | 'merged'; standard: NULL

-- Course sections (outline blocks)
CREATE TABLE study_course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  claimer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, section_index)
);

CREATE INDEX idx_sections_course ON study_course_sections(course_id, section_index);

-- Membership check: user_group_members is service-role-only under RLS,
-- so a SECURITY DEFINER function is required for member-based policies.
CREATE OR REPLACE FUNCTION is_cocreate_member(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM study_courses sc
    JOIN user_group_members m ON m.group_id = sc.cocreate_group_id
    WHERE sc.id = p_course_id AND m.user_id = auth.uid()
  );
$$;

ALTER TABLE study_course_sections ENABLE ROW LEVEL SECURITY;

-- Unpublished co-create courses are visible to group members only
CREATE POLICY "Cocreate courses viewable by group members"
  ON study_courses FOR SELECT
  USING (course_type = 'cocreate' AND is_cocreate_member(id));

-- Sections: readable by group members, or by anyone once the course is published
CREATE POLICY "Cocreate sections viewable by group members"
  ON study_course_sections FOR SELECT
  USING (
    is_cocreate_member(course_id)
    OR EXISTS (SELECT 1 FROM study_courses WHERE study_courses.id = study_course_sections.course_id AND study_courses.is_published = true)
  );

-- Sections: editable by any group member (claim + content, no per-assignee lock)
CREATE POLICY "Cocreate members can update sections"
  ON study_course_sections FOR UPDATE
  USING (is_cocreate_member(course_id))
  WITH CHECK (is_cocreate_member(course_id));
