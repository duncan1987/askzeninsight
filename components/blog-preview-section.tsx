import { Button } from '@/components/ui/button'
import { BlogCard } from '@/components/blog/blog-card'
import { getFeaturedPosts } from '@/lib/blog'
import Link from 'next/link'

export function BlogPreviewSection() {
  const featuredPosts = getFeaturedPosts(3)

  if (featuredPosts.length === 0) return null

  return (
    <section className="border-b border-border py-20 bg-muted/30 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Latest from Our Blog
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Insights, reflections, and guidance on meditation, Zen philosophy, and spiritual growth.
              </p>
            </div>
            <Button asChild variant="outline" className="hidden bg-transparent md:inline-flex">
              <Link href="/blog">View All Posts</Link>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline">
              <Link href="/blog">View All Posts</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
