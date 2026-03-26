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
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMdxComponents } from '@/lib/mdx-components'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zeninsight.xyz'

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
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const relatedPosts = getRelatedPosts(post.slug, post.tags, 3)
  const components = getMdxComponents()

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: post.title, href: `/blog/${post.slug}` },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${siteUrl}${post.image}`,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      '@type': 'Organization',
      name: 'Ask Zen Insight',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ask Zen Insight',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    wordCount: post.content.split(/\s+/).length,
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          {/* Back link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <CategoryBadge category={post.category} />
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {post.description}
            </p>
            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime} min read
              </span>
              <span>By {post.author}</span>
            </div>
          </header>

          {/* Hero image */}
          <div className="relative mb-10 overflow-hidden rounded-xl border border-border">
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              width={1200}
              height={630}
              className="w-full object-cover"
            />
          </div>

          {/* Article body with TOC sidebar */}
          <div className="flex gap-12">
            <article
              className="min-w-0 flex-1 max-w-3xl"
              data-article-content
            >
              <MDXRemote source={post.content} components={components} />
            </article>

            {/* Table of Contents sidebar */}
            <aside className="hidden w-56 flex-shrink-0 xl:block">
              <TableOfContents />
            </aside>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author bio */}
          <div className="mt-12">
            <AuthorBio author={post.author} />
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-8 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Ready to deepen your practice?
            </h3>
            <p className="mb-4 text-muted-foreground">
              Chat with koji, our AI meditation teacher, for personalized guidance on your spiritual journey.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start a Conversation
            </Link>
          </div>

          {/* Related posts */}
          <RelatedPosts posts={relatedPosts} />
        </div>
      </main>
      <Footer />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
