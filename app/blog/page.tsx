import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { BlogCard } from '@/components/blog/blog-card'
import { getAllPostsMeta, BLOG_CATEGORIES, getCategoryName } from '@/lib/blog'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const breadcrumbItems = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
]

export default function BlogPage() {
  const posts = getAllPostsMeta()
  const categories = BLOG_CATEGORIES

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Zen Insights & Guidance
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Articles on meditation, Zen philosophy, mindfulness, and spiritual growth to support your journey toward inner peace.
            </p>
          </div>

          {/* Categories */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              All Posts
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog?category=${cat.slug}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Featured Posts */}
          {posts.filter((p) => p.featured).length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
                Featured Articles
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                {posts
                  .filter((p) => p.featured)
                  .slice(0, 2)
                  .map((post) => (
                    <BlogCard key={post.slug} post={post} featured />
                  ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section>
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
              All Articles
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {posts.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                Articles are on the way. Check back soon for insights on meditation and Zen philosophy.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
