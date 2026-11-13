import { createAdminClient } from "@/lib/supabase/admin"
import { SERIES_META, parseSeriesPartFromSlug } from "@/lib/blog-series"

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
  series: string | null
  series_part: number | null
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

export interface DbSeriesPost {
  id: string
  title: string
  slug: string
  description: string
  series_part: number | null
  cover_image: string | null
  category: string
  tags: string[]
  published_at: string | null
  created_at: string
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST204" || error.code === "42703" || /does not exist/i.test(error.message || "")
}

/**
 * All published parts of a series, ordered by part number.
 *
 * Primary path uses the explicit `series`/`series_part` columns
 * (supabase/migrations/20261108_blog_series.sql). If the migration has not
 * been applied yet, it falls back to grouping by the series tag and parsing
 * part numbers from slugs (`*-part-12`), so series pages work out of the box.
 */
export async function getDbSeriesPosts(seriesKey: string): Promise<DbSeriesPost[]> {
  const adminClient = createAdminClient()
  if (!adminClient) return []

  const { data, error } = await adminClient
    .from("blog_posts")
    .select("id, title, slug, description, series_part, cover_image, category, tags, published_at, created_at")
    .eq("is_published", true)
    .eq("series", seriesKey)
    .order("series_part", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: true })

  if (!error && data) {
    return data as DbSeriesPost[]
  }

  if (error && !isMissingColumnError(error)) {
    console.error("[BlogDB] Error fetching series posts:", error)
    return []
  }

  // Fallback: series columns not migrated yet — group by the series tag.
  const meta = SERIES_META[seriesKey]
  if (!meta) return []

  const { data: tagged, error: tagError } = await adminClient
    .from("blog_posts")
    .select("id, title, slug, description, cover_image, category, tags, published_at, created_at")
    .eq("is_published", true)
    .contains("tags", [meta.tag])

  if (tagError) {
    console.error("[BlogDB] Error fetching series posts (tag fallback):", tagError)
    return []
  }

  const posts = ((tagged || []) as Array<Omit<DbSeriesPost, "series_part">>).map((p) => ({
    ...p,
    series_part: parseSeriesPartFromSlug(p.slug),
  }))

  posts.sort((a, b) => {
    const partA = a.series_part ?? Number.MAX_SAFE_INTEGER
    const partB = b.series_part ?? Number.MAX_SAFE_INTEGER
    if (partA !== partB) return partA - partB
    return new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime()
  })

  return posts
}

export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "")
  const chars = text.length
  return Math.max(1, Math.ceil(chars / 500))
}
