import 'server-only'
import HTMLtoDOCX from 'html-to-docx'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildMergedHtml,
  buildExportDocument,
  contentDispositionFilename,
  sectionIsFilled,
  type CourseSectionBase,
} from '@/lib/cocourse'

export interface MergeResult {
  ok: true
  mergedHtml: string
  totalSections: number
  filledSections: number
}

/**
 * Merge all sections of a co-create course into study_courses.content_html.
 * Caller must have already verified the actor (admin key or group member).
 */
export async function mergeCocreateCourse(
  adminClient: SupabaseClient,
  courseId: string
): Promise<MergeResult> {
  const { data: course, error: courseError } = await adminClient
    .from('study_courses')
    .select('id, title, course_type, cocreate_status')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    throw new CocourseError('课程不存在', 404)
  }
  if (course.course_type !== 'cocreate') {
    throw new CocourseError('该课程不是共创课程', 400)
  }

  const { data: sections, error: sectionsError } = await adminClient
    .from('study_course_sections')
    .select('id, course_id, section_index, title, content_html, claimer_id, updated_by, created_at, updated_at')
    .eq('course_id', courseId)
    .order('section_index', { ascending: true })

  if (sectionsError) {
    throw new CocourseError('读取编辑块失败', 500)
  }

  const sectionList = (sections || []) as CourseSectionBase[]
  if (sectionList.length === 0) {
    throw new CocourseError('该课程没有编辑块', 400)
  }

  const filled = sectionList.filter((s) => sectionIsFilled(s.content_html || ''))
  if (filled.length < sectionList.length) {
    throw new CocourseError(
      `还有 ${sectionList.length - filled.length} 个编辑块未填充，无法合并`,
      400
    )
  }

  const mergedHtml = buildMergedHtml(course.title, sectionList)

  const { error: updateError } = await adminClient
    .from('study_courses')
    .update({
      content_html: mergedHtml,
      cocreate_status: 'merged',
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (updateError) {
    throw new CocourseError('合并结果写入失败', 500)
  }

  return {
    ok: true,
    mergedHtml,
    totalSections: sectionList.length,
    filledSections: filled.length,
  }
}

/**
 * Build a .docx buffer from the course's current section contents
 * (merge status is irrelevant — exports always reflect the latest content).
 */
export async function exportCocreateCourseDocx(
  adminClient: SupabaseClient,
  courseId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const { data: course, error: courseError } = await adminClient
    .from('study_courses')
    .select('id, title, course_type')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    throw new CocourseError('课程不存在', 404)
  }
  if (course.course_type !== 'cocreate') {
    throw new CocourseError('该课程不是共创课程', 400)
  }

  const { data: sections, error: sectionsError } = await adminClient
    .from('study_course_sections')
    .select('id, course_id, section_index, title, content_html, claimer_id, updated_by, created_at, updated_at')
    .eq('course_id', courseId)
    .order('section_index', { ascending: true })

  if (sectionsError) {
    throw new CocourseError('读取编辑块失败', 500)
  }

  const mergedHtml = buildMergedHtml(course.title, (sections || []) as CourseSectionBase[])
  const document = buildExportDocument(course.title, mergedHtml)

  const buffer = (await HTMLtoDOCX(document)) as Buffer

  return { buffer, filename: course.title }
}

export function docxResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': contentDispositionFilename(filename),
      'Cache-Control': 'no-store',
    },
  })
}

export class CocourseError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
