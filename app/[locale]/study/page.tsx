import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { cookies } from "next/headers"
import { StudyPageClient } from "./study-client"

export const dynamic = "force-dynamic"

export default async function StudyPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en"

  if (locale !== "zh") {
    redirect("/")
  }

  const supabase = await createClient()
  let userId: string | undefined

  type CourseRow = {
    id: string
    title: string
    truncation_index: number | null
    sort_order: number
    published_at: string | null
    created_at: string
    study_comments: Array<{ id: string }>
  }

  type CourseItem = {
    id: string
    title: string
    truncation_index: number | null
    sort_order: number
    published_at: string | null
    created_at: string
    comment_count: number
    is_checked_in?: boolean
  }

  let courses: CourseItem[] = []

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) userId = user.id

    const { data: rawCourses, error } = await supabase
      .from("study_courses")
      .select("id, title, truncation_index, sort_order, published_at, created_at, study_comments(id)")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })

    if (!error && rawCourses) {
      courses = (rawCourses as CourseRow[]).map((c) => ({
        id: c.id,
        title: c.title,
        truncation_index: c.truncation_index,
        sort_order: c.sort_order,
        published_at: c.published_at,
        created_at: c.created_at,
        comment_count: c.study_comments?.length || 0,
      }))

      if (user) {
        const courseIds = courses.map((c) => c.id)
        const { data: checkins } = await supabase
          .from("study_checkins")
          .select("course_id")
          .eq("user_id", user.id)
          .in("course_id", courseIds)

        const checkedInIds = new Set((checkins || []).map((c: { course_id: string }) => c.course_id))
        courses = courses.map((c) => ({
          ...c,
          is_checked_in: checkedInIds.has(c.id),
        }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">共学社区</h1>
            <p className="text-muted-foreground">打卡解锁，共修共进</p>
          </div>
          <StudyPageClient courses={courses} userId={userId} />
        </div>
      </main>
    </div>
  )
}
