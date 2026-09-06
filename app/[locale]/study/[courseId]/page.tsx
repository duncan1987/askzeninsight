import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Header } from "@/components/header"
import { cookies } from "next/headers"
import { CourseDetailClient } from "./course-detail-client"

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

  if (!supabase && !adminClient) {
    notFound()
  }

  const { data: course, error } = await supabase
    .from("study_courses")
    .select("id, title, content_html, truncation_index, published_at")
    .eq("id", courseId)
    .eq("is_published", true)
    .single()

  if (error || !course) {
    notFound()
  }

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

  const { data: comments } = await supabase
    .from("study_comments")
    .select("id, content, created_at, user:profiles!study_comments_user_id_fkey(username, avatar_url)")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <CourseDetailClient
            course={course}
            isCheckedIn={isCheckedIn}
            comments={comments || []}
          />
        </div>
      </main>
    </div>
  )
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
