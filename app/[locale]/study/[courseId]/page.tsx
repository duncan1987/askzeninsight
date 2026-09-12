import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { cookies } from "next/headers"
import { CourseDetailClient } from "./course-detail-client"
import { CocourseClient, type CoCourseSection } from "./cocourse-client"
import { BackToTop } from "@/components/study/back-to-top"

export const dynamic = "force-dynamic"

interface CoursePageProps {
  params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en"

  if (locale !== "zh") {
    redirect("/")
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  if (!supabase) {
    notFound()
  }

  const { data: course, error } = await supabase
    .from("study_courses")
    .select("id, title, content_html, truncation_index, published_at, course_type, cocreate_group_id, cocreate_status")
    .eq("id", courseId)
    .eq("is_published", true)
    .single()

  // Unpublished courses fall through to the co-create check below (group
  // members can open them); only notFound if that also yields nothing.
  if ((error || !course)) {
    const cocreate = await loadCocreateForMember(courseId)
    if (cocreate) {
      return renderCocreate(cocreate)
    }
    notFound()
  }

  // Published co-create courses are rendered with the standard course view
  // for everyone (including co-create members). Only unpublished co-create
  // courses fall through to the member co-edit view above.

  let isCheckedIn = false
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: checkin } = await supabase
      .from("study_checkins")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()

    isCheckedIn = !!checkin
  }

  if (!isCheckedIn && course.truncation_index != null) {
    const html = course.content_html || ""
    course.content_html = truncateHtml(html, course.truncation_index)
  }

  // Fetch comments via the admin client: profiles RLS only allows users to
  // read their own profile, so a user-scoped join would return user: null
  // for other users' comments and crash the client render. Published-course
  // comments are public content; only public fields (username, avatar_url)
  // are selected.
  const commentsClient = adminClient ?? supabase
  const { data: comments } = commentsClient
    ? await commentsClient
        .from("study_comments")
        .select("id, content, created_at, user:profiles!study_comments_user_id_fkey(username, avatar_url)")
        .eq("course_id", courseId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
    : { data: null }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <CourseDetailClient
            course={course}
            isCheckedIn={isCheckedIn}
            comments={comments || []}
          />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  )

  /**
   * Load a co-create course with its sections, but only when the current
   * user is a member of the course's user group. Returns null otherwise.
   */
  async function loadCocreateForMember(id: string): Promise<{
    course: { id: string; title: string; cocreate_status: string | null; is_published: boolean }
    sections: CoCourseSection[]
    userId: string | null
  } | null> {
    if (!adminClient) return null
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: coCourse } = await adminClient
      .from("study_courses")
      .select("id, title, cocreate_status, cocreate_group_id, course_type, is_published")
      .eq("id", id)
      .single()

    if (!coCourse || coCourse.course_type !== "cocreate" || !coCourse.cocreate_group_id) {
      return null
    }

    const { data: membership } = await adminClient
      .from("user_group_members")
      .select("id")
      .eq("group_id", coCourse.cocreate_group_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) return null

    const { data: rawSections } = await adminClient
      .from("study_course_sections")
      .select(
        "id, section_index, title, content_html, claimer_id, updated_by, created_at, updated_at, claimer:profiles!study_course_sections_claimer_id_fkey(username), editor:profiles!study_course_sections_updated_by_fkey(username)"
      )
      .eq("course_id", id)
      .order("section_index", { ascending: true })

    const sections: CoCourseSection[] = (rawSections || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      section_index: s.section_index as number,
      title: s.title as string,
      content_html: (s.content_html as string) || "",
      claimer_id: (s.claimer_id as string | null) ?? null,
      updated_by: (s.updated_by as string | null) ?? null,
      updated_at: s.updated_at as string,
      claimer_name: (s.claimer as { username: string } | null)?.username ?? null,
      editor_name: (s.editor as { username: string } | null)?.username ?? null,
    }))

    return {
      course: {
        id: coCourse.id,
        title: coCourse.title,
        cocreate_status: coCourse.cocreate_status,
        is_published: coCourse.is_published,
      },
      sections,
      userId: user.id,
    }
  }

  function renderCocreate(cocreate: {
    course: { id: string; title: string; cocreate_status: string | null; is_published: boolean }
    sections: CoCourseSection[]
    userId: string | null
  }) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <CocourseClient
              course={cocreate.course}
              sections={cocreate.sections}
              userId={cocreate.userId}
            />
          </div>
        </main>
        <Footer />
        <BackToTop />
      </div>
    )
  }
}

function truncateHtml(html: string, charIndex: number): string {
  if (charIndex >= html.length) return html
  let openTags: string[] = []
  let i = 0
  let textCount = 0

  while (i < html.length && textCount < charIndex) {
    if (html[i] === "<") {
      const closeIdx = html.indexOf(">", i)
      if (closeIdx === -1) break
      const tag = html.substring(i, closeIdx + 1)
      const tagName = tag.match(/^<\/?(\w+)/)?.[1]?.toLowerCase()
      if (tagName && !["br", "hr", "img", "input", "meta", "link"].includes(tagName)) {
        if (tag.startsWith("</")) {
          const last = openTags.lastIndexOf(tagName)
          if (last !== -1) openTags.splice(last, 1)
        } else if (!tag.endsWith("/>")) {
          openTags.push(tagName)
        }
      }
      i = closeIdx + 1
    } else {
      textCount++
      i++
    }
  }

  let result = html.substring(0, i)
  for (let j = openTags.length - 1; j >= 0; j--) {
    result += `</${openTags[j]}>`
  }
  return result
}
