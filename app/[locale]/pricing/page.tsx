import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { PricingCard } from '@/components/pricing-card'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing & Plans | Ask Zen Insight - AI Meditation Teacher',
  description: 'Choose the perfect plan for your spiritual journey. Free tier with 10 messages/day, or Premium from $2.99/month with advanced AI and unlimited chat history.',
  keywords: ['pricing', 'subscription plans', 'AI meditation pricing', 'zen guidance cost', 'meditation app pricing'],
  openGraph: {
    title: 'Pricing & Plans | Ask Zen Insight',
    description: 'Affordable plans for AI-powered spiritual guidance and meditation support.',
  },
}

export default async function PricingPage() {
  const t = await getTranslations('pricing')
  const tc = await getTranslations('common')

  const breadcrumbItems = [
    { name: tc('home'), href: '/' },
    { name: tc('pricing'), href: '/pricing' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-20">
        {/* Breadcrumb Navigation */}
        <div className="mx-auto max-w-5xl mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('subtitle')}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title={t('free.name')}
              price={t('free.price')}
              period={t('free.period')}
              description={t('free.description')}
              features={[
                t('free.requiresAccount'),
                t('free.messagesPerDay'),
                t('free.basicModel'),
                t('free.noHistory'),
              ]}
              ctaText={t('free.cta')}
              ctaHref="/chat"
            />

            <PricingCard
              title={t('monthly.name')}
              price={t('monthly.price')}
              period={t('monthly.period')}
              description={t('monthly.description')}
              features={[
                t('monthly.premiumMessages'),
                t('monthly.unlimitedBasic'),
                t('monthly.saveHistory'),
                t('monthly.multipleConversations'),
                t('monthly.exportShare'),
                t('monthly.bestForDaily'),
              ]}
              ctaText={t('monthly.cta')}
              ctaHref="/pricing"
              highlighted
              creemPlan="pro"
            />

            <PricingCard
              title={t('annual.name')}
              price={t('annual.price')}
              period={t('annual.period')}
              description={t('annual.description')}
              features={[
                t('annual.sameBenefits'),
                t('annual.save30'),
                t('annual.advancedAI'),
                t('annual.unlimitedBasic'),
                t('annual.exportShare'),
                t('annual.perfectForLongTerm'),
              ]}
              ctaText={t('annual.cta')}
              ctaHref="/pricing"
              highlighted
              creemPlan="annual"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('note')}{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              {t('termsApply')}
            </Link>
            {' '}. {t('taxNote')}
          </p>

          <p className="mt-2 text-center text-sm font-medium text-primary">
            💳 {t('paymentProcessor')}
          </p>

          {/* Fair Use Policy */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>⚖️</span>
                {t('fairUse.title')}
              </h2>
              <p className="text-muted-foreground mb-3">
                {t('fairUse.description')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  {t('fairUse.first30')}
                </li>
                <li>
                  {t('fairUse.after30')}
                </li>
                <li>
                  {t('fairUse.noHardLimits')}
                </li>
                <li>
                  {t('fairUse.dailyReset')}
                </li>
              </ul>
            </div>
          </div>

          {/* Why Choose Premium */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">{t('whyPremium.title')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🧠</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.advancedInsights.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.advancedInsights.description')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.chatHistorySaved.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.chatHistorySaved.description')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">📚</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.multipleConversations.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.multipleConversations.description')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🔄</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.threeTimesLimit.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.threeTimesLimit.description')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">📤</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.exportShare.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.exportShare.description')}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🌙</div>
                <h3 className="font-semibold mb-2">{t('whyPremium.continuousJourney.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('whyPremium.continuousJourney.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>💰</span>
                {t('refundPolicy.title')}
              </h2>
              <p className="text-muted-foreground mb-3">
                {t('refundPolicy.description')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  {t('refundPolicy.within48h')}
                </li>
                <li>
                  {t('refundPolicy.after48h')}
                </li>
                <li>
                  {t('refundPolicy.upTo7days')}
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                {t.rich('refundPolicy.readFullPolicy', {
                  link: (chunks) => <Link href="/refund" className="underline underline-offset-4 hover:text-primary font-medium">{chunks}</Link>,
                })}
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div id="faq" className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              {t('faq.title')}
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">{t('faq.q1')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a1')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q2')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a2')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q3')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a3')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q4')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a4')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q5')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a5')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q6')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a6')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {t('faq.q7')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a7')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faq.q8')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('faq.a8')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faq.moreQuestions')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.rich('faq.visitFaqOrContact', {
                    faqLink: (chunks) => <Link href="/faq" className="underline underline-offset-4 hover:text-primary font-medium">{chunks}</Link>,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
