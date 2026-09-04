import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { AuthorBio } from '@/components/blog/author-bio'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { RelatedPosts } from '@/components/blog/related-posts'
import { CategoryBadge } from '@/components/blog/category-badge'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import { getPostBySlug, getAllSlugs, getRelatedPosts } from '@/lib/blog'
import { getDbBlogPostBySlug, estimateReadTime } from '@/lib/blog-db'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMdxComponents } from '@/lib/mdx-components'
import { getTranslations } from 'next-intl/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ask.zeninsight.xyz'

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const title = `${post.title} | Ask Zen Insight Blog`
  const url = `${siteUrl}/blog/${slug}`

  return {
    title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      type: 'article',
      title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.description,
      images: [post.image],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const mdxPost = getPostBySlug(slug)
  
  let dbPost = null
  if (!mdxPost) {
    dbPost = await getDbBlogPostBySlug(slug)
  }
  
  if (!mdxPost && !dbPost) notFound()

  const t = await getTranslations('blog')

  if (mdxPost) {
    const relatedPosts = getRelatedPosts(mdxPost.slug, mdxPost.tags, 3)
    const components = getMdxComponents()

    const breadcrumbItems = [
      { name: t('home'), href: '/' },
      { name: t('blog'), href: '/blog' },
      { name: mdxPost.title, href: `/blog/${mdxPost.slug}` },
    ]

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: mdxPost.title,
      description: mdxPost.description,
      image: `${siteUrl}${mdxPost.image}`,
      datePublished: mdxPost.date,
      dateModified: mdxPost.updated || mdxPost.date,
      author: { '@type': 'Organization', name: 'Ask Zen Insight' },
      publisher: { '@type': 'Organization', name: 'Ask Zen Insight' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${mdxPost.slug}` },
      keywords: mdxPost.tags.join(', '),
      wordCount: mdxPost.content.split(/\s+/).length,
    }

    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <Breadcrumb items={breadcrumbItems} className="mb-8" />
            <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />{t('backToBlog')}
            </Link>
            <header className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <CategoryBadge category={mdxPost.category} />
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{mdxPost.title}</h1>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">{mdxPost.description}</p>
              <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(mdxPost.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{mdxPost.readTime} {t('minRead')}</span>
                <span>{t('by')} {mdxPost.author}</span>
              </div>
            </header>
            <div className="relative mb-10 overflow-hidden rounded-xl border border-border">
              <Image src={mdxPost.image} alt={mdxPost.imageAlt || mdxPost.title} width={1200} height={630} className="w-full object-cover" />
            </div>
            <div className="flex gap-12">
              <article className="min-w-0 flex-1 max-w-3xl" data-article-content>
                <MDXRemote source={mdxPost.content} components={components} />
              </article>
              <aside className="hidden w-56 flex-shrink-0 xl:block">
                <TableOfContents />
              </aside>
            </div>
            {mdxPost.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {mdxPost.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">#{tag}</span>
                ))}
              </div>
            )}
            <div className="mt-12"><AuthorBio author={mdxPost.author} /></div>
            <div className="mt-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-8 text-center">
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t('ctaTitle')}</h3>
              <p className="mb-4 text-muted-foreground">{t('ctaDesc')}</p>
              <Link href="/chat" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">{t('ctaButton')}</Link>
            </div>
            <RelatedPosts posts={relatedPosts} />
          </div>
        </main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    )
  }

  // Database blog post
  const post = dbPost!
  const readTime = estimateReadTime(post.content_html)
  const breadcrumbItems = [
    { name: t('home'), href: '/' },
    { name: t('blog'), href: '/blog' },
    { name: post.title, href: `/blog/${post.slug}` },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />
          <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />{t('backToBlog')}
          </Link>
          <header className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <CategoryBadge category={post.category} />
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">{post.title}</h1>
            {post.description && (
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">{post.description}</p>
            )}
            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(post.published_at || post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{readTime} {t('minRead')}</span>
              <span>{t('by')} {post.author}</span>
            </div>
          </header>
          {post.cover_image && (
            <div className="relative mb-10 overflow-hidden rounded-xl border border-border">
              <Image src={post.cover_image} alt={post.cover_image_alt || post.title} width={1200} height={630} className="w-full object-cover" />
            </div>
          )}
          <article className="prose prose-sm sm:prose-base max-w-none min-w-0 flex-1 max-w-3xl" data-article-content>
            <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
          </article>
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}
          <div className="mt-12"><AuthorBio author={post.author} /></div>
          <div className="mt-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-8 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">{t('ctaTitle')}</h3>
            <p className="mb-4 text-muted-foreground">{t('ctaDesc')}</p>
            <Link href="/chat" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">{t('ctaButton')}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
