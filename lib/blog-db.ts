import { createAdminClient } from "@/lib/supabase/admin"

export interface DbBlogPost {
  id: string
  title: string
  slug: string
  description: string
  content_html: string
  cover_image: string | null
  cover_image_alt: string
  category: string
  tags: string[]
  author: string
  is_published: boolean
  source_course_id: string | null
  locale: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DbBlogPostMeta {
  id: string
  title: string
  slug: string
  description: string
  cover_image: string | null
  category: string
  tags: string[]
  author: string
  published_at: string | null
  created_at: string
}

export async function getDbBlogPosts(category?: string): Promise<DbBlogPostMeta[]> {
  const adminClient = createAdminClient()
  if (!adminClient) return []

  let query = adminClient
    .from("blog_posts")
    .select("id, title, slug, description, cover_image, category, tags, author, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query
  if (error) {
    console.error("[BlogDB] Error fetching posts:", error)
    return []
  }

  return (data || []) as DbBlogPostMeta[]
}

export async function getDbBlogPostBySlug(slug: string): Promise<DbBlogPost | null> {
  const adminClient = createAdminClient()
  if (!adminClient) return null

  const { data, error } = await adminClient
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null

  return data as DbBlogPost
}

export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "")
  const chars = text.length
  return Math.max(1, Math.ceil(chars / 500))
}
