import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { getDbSeriesPosts, estimateReadTime } from '@/lib/blog-db'
import { getSeriesMeta } from '@/lib/blog-series'
import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Calendar, Clock, ListOrdered } from 'lucide-react'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ask.zeninsight.xyz'

interface SeriesPageProps {
  params: Promise<{ series: string }>
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { series } = await params
  const meta = getSeriesMeta(series)
  const locale = await getLocale()
  const lang = locale === 'zh' ? 'zh' : 'en'

  const title = meta ? `${meta.names[lang]} | Ask Zen Insight Blog` : `Series: ${series} | Ask Zen Insight Blog`
  const description = meta ? meta.descriptions[lang] : `All published parts of the ${series} series.`

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/series/${series}`,
    },
  }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { series } = await params
  const t = await getTranslations('blog')
  const locale = await getLocale()
  const lang = locale === 'zh' ? 'zh' : 'en'

  const meta = getSeriesMeta(series)
  const posts = await getDbSeriesPosts(series)

  if (!meta && posts.length === 0) {
    notFound()
  }

  const seriesName = meta ? meta.names[lang] : series
  const seriesDescription = meta ? meta.descriptions[lang] : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seriesName,
    description: seriesDescription || undefined,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: post.series_part ?? index + 1,
      // schema.org ListItem requires "item" (absolute URL), not a relative path
      item: `${siteUrl}/blog/${post.slug}`,
      name: post.title,
    })),
  }

  const breadcrumbItems = [
    { name: t('home'), href: '/' },
    { name: t('blog'), href: '/blog' },
    { name: seriesName, href: `/blog/series/${series}` },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <ListOrdered className="h-4 w-4" />
              {t('seriesLabel')}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {seriesName}
            </h1>
            {seriesDescription && (
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {seriesDescription}
              </p>
            )}
            {posts.length > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t('partsCount', { count: posts.length })}
              </p>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">{t('seriesEmpty')}</p>
            </div>
          ) : (
            <ol className="space-y-4">
              {posts.map((post, index) => {
                const partNumber = post.series_part ?? index + 1
                const readTime = estimateReadTime(post.description || '')
                return (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex items-stretch gap-5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <span className="text-2xl font-bold">{partNumber}</span>
                        <span className="text-xs text-muted-foreground">{t('partShort')}</span>
                      </div>
                      {post.cover_image ? (
                        <div className="relative hidden h-24 w-36 flex-shrink-0 overflow-hidden rounded-lg sm:block">
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 py-1">
                        <h2 className="mb-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                          {post.title}
                        </h2>
                        {post.description && (
                          <p className="mb-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readTime} {t('minRead')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t('backToBlog')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
