import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const adminKey = req.headers.get("x-admin-key")
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const [pendingUsers, pendingRefunds, courses, comments, blogs, checkins] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "pending")
        .not("username", "is", null),
      adminClient
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("refund_status", "requested"),
      adminClient
        .from("study_courses")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      adminClient
        .from("study_comments")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      adminClient
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      adminClient
        .from("study_checkins")
        .select("id", { count: "exact", head: true }),
    ])

    return NextResponse.json({
      stats: {
        pendingUsers: pendingUsers.count || 0,
        pendingRefunds: pendingRefunds.count || 0,
        courseCount: courses.count || 0,
        commentCount: comments.count || 0,
        blogCount: blogs.count || 0,
        totalCheckins: checkins.count || 0,
      },
    })
  } catch (error) {
    console.error("[Admin Stats] Error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
