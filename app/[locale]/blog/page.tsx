import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { BlogCard } from '@/components/blog/blog-card'
import { getAllPostsMeta, BLOG_CATEGORIES } from '@/lib/blog'
import { getDbBlogPosts, estimateReadTime } from '@/lib/blog-db'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const t = await getTranslations('blog')
  const mdxPosts = getAllPostsMeta()
  const categories = BLOG_CATEGORIES

  let dbPosts: Array<{
    slug: string
    title: string
    description: string
    date: string
    category: string
    tags: string[]
    image: string
    imageAlt: string
    author: string
    readTime: number
    featured: boolean
  }> = []

  try {
    const dbPostsRaw = await getDbBlogPosts()
    dbPosts = dbPostsRaw.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.published_at || p.created_at,
      category: p.category,
      tags: p.tags,
      image: p.cover_image || '/og-image.svg',
      imageAlt: '',
      author: p.author,
      readTime: estimateReadTime(''),
      featured: false,
    }))
  } catch {
    console.error('Failed to fetch database blog posts')
  }

  const posts = [...mdxPosts, ...dbPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const categoryTranslationMap: Record<string, string> = {
    'meditation': t('meditation'),
    'zen-philosophy': t('zenPhilosophy'),
    'mindfulness': t('mindfulness'),
    'spiritual-growth': t('spiritualGrowth'),
    'practice-guide': t('practiceGuide'),
  }

  const breadcrumbItems = [
    { name: t('home'), href: '/' },
    { name: t('blog'), href: '/blog' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {t('allPosts')}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog?category=${cat.slug}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {categoryTranslationMap[cat.slug] || cat.name}
              </Link>
            ))}
          </div>

          {posts.filter((p) => p.featured).length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
                {t('featuredArticles')}
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

          <section>
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
              {t('allArticles')}
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
                {t('emptyState')}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
