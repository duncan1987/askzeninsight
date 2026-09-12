// Shared helpers for the co-create course module (admin + student sides).

export const MAX_SECTION_HTML_LENGTH = 200_000

export interface CourseSectionBase {
  id: string
  course_id: string
  section_index: number
  title: string
  content_html: string
  claimer_id: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * A section counts as "filled" when it has visible text or at least one image.
 */
export function sectionIsFilled(contentHtml: string): boolean {
  if (!contentHtml) return false
  if (/<img\s/i.test(contentHtml)) return true
  return stripHtml(contentHtml).length > 0
}

/**
 * Defense-in-depth cleanup for member-authored HTML (rendered later to other
 * members via dangerouslySetInnerHTML). Group members are a curated set, but
 * strip the obvious vectors anyway.
 */
export function sanitizeSectionHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/<script[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"')
    .slice(0, MAX_SECTION_HTML_LENGTH)
}

/**
 * If a section's content already begins with a heading whose text equals the
 * section title, avoid duplicating it in the merged document.
 */
function contentWithoutDuplicateTitle(title: string, contentHtml: string): string {
  const content = contentHtml.trim()
  const headingMatch = content.match(/^<(h[1-3])[^>]*>([\s\S]*?)<\/\1\s*>/i)
  if (headingMatch) {
    const headingText = stripHtml(headingMatch[0])
    if (headingText === title.trim()) {
      return content.slice(headingMatch[0].length).trim()
    }
  }
  return content
}

/**
 * Merge sections (ordered by section_index) into a single course HTML body:
 * course title as H1, then a table of contents listing every section title,
 * then each section title as H2 followed by its content.
 */
export function buildMergedHtml(courseTitle: string, sections: CourseSectionBase[]): string {
  const ordered = [...sections].sort((a, b) => a.section_index - b.section_index)
  const parts: string[] = [`<h1>${escapeHtmlText(courseTitle)}</h1>`]
  if (ordered.length > 0) {
    const tocItems = ordered
      .map((section) => `<li>${escapeHtmlText(section.title)}</li>`)
      .join("")
    parts.push(`<h2>课程大纲</h2><ol>${tocItems}</ol>`)
  }
  for (const section of ordered) {
    parts.push(`<h2>${escapeHtmlText(section.title)}</h2>`)
    const body = contentWithoutDuplicateTitle(section.title, section.content_html || "")
    if (body) parts.push(body)
  }
  return parts.join("\n")
}

/**
 * Wrap merged content in a full HTML document for docx conversion.
 */
export function buildExportDocument(courseTitle: string, contentHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtmlText(
    courseTitle
  )}</title></head><body>${contentHtml}</body></html>`
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * RFC 5987 encoded Content-Disposition value for a (possibly Chinese) filename.
 */
export function contentDispositionFilename(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")
  return `attachment; filename="${ascii}.docx"; filename*=UTF-8''${encodeURIComponent(filename)}.docx`
}
