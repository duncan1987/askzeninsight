import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Ask Zen Insight',
  description: 'Find answers to common questions about Ask Zen Insight, our AI meditation teacher, subscription plans, and spiritual guidance services.',
  keywords: ['FAQ', 'zen meditation questions', 'AI meditation teacher help', 'subscription pricing questions', 'meditation guidance support'],
  openGraph: {
    title: 'Frequently Asked Questions | Ask Zen Insight',
    description: 'Get answers to common questions about our AI-powered spiritual guidance service.',
  },
}

const breadcrumbItems = [
  { name: 'Home', href: '/' },
  { name: 'FAQ', href: '/faq' },
]

export default async function FAQPage() {
  const t = await getTranslations('faqPage')

  const categoryKeys = [
    'gettingStarted',
    'plansPricing',
    'subscriptionBilling',
    'usingService',
    'aboutService',
    'privacySecurity',
    'techSupport',
    'billingPayments',
  ] as const

  const questionCounts: Record<string, number> = {
    gettingStarted: 3,
    plansPricing: 4,
    subscriptionBilling: 6,
    usingService: 5,
    aboutService: 5,
    privacySecurity: 5,
    techSupport: 4,
    billingPayments: 5,
  }

  const faqCategories = categoryKeys.map((key) => {
    const count = questionCounts[key]
    const questions = []
    for (let i = 1; i <= count; i++) {
      questions.push({
        q: t(`categories.${key}.q${i}`),
        a: t(`categories.${key}.a${i}`),
      })
    }
    return {
      title: t(`categories.${key}.title`),
      icon: t(`categories.${key}.icon`),
      questions,
    }
  })

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-12 border border-border">
            <h2 className="font-semibold mb-3">{t('quickLinks.title')}</h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <Link href="/pricing" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.pricing')}
              </Link>
              <Link href="/about" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.about')}
              </Link>
              <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.terms')}
              </Link>
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.privacy')}
              </Link>
              <Link href="/refund" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.refund')}
              </Link>
              <a href="mailto:support@zeninsight.xyz" className="text-primary hover:underline underline-offset-4">
                → {t('quickLinks.support')}
              </a>
            </div>
          </div>

          <div className="space-y-12">
            {faqCategories.map((category, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIdx) => (
                    <details
                      key={faqIdx}
                      className="group bg-card border border-border rounded-lg"
                    >
                      <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50 transition-colors flex items-center justify-between">
                        {faq.q}
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-8 border border-amber-200 dark:border-amber-900 text-center">
            <h2 className="text-2xl font-bold mb-3">{t('stillHaveQuestions')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('hereToHelp')}
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@zeninsight.xyz"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {t('emailSupport')}
              </a>
              <p className="text-sm text-muted-foreground mt-3">
                {t('respondWithin')}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
