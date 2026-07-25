import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RefundPolicyPage() {
  const { siteName, supportEmail } = getSiteConfig()
  const t = await getTranslations('refundPage')

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('description', { siteName })}
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('whoProcessesPayments')}</h2>
            <p className="text-muted-foreground">
              {t('whoProcessesPaymentsDesc')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('howToRequest')}</h2>
            <p className="text-muted-foreground">
              {t('howToRequestDesc', { supportEmail })}
            </p>
            <p className="text-muted-foreground">
              {t('respondWithin')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('refundEligibility')}</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">{t('48hourWindow')}</strong>{' '}
                {t('48hourWindowDesc')}
              </p>
              <p>
                <strong className="text-foreground">{t('7dayRequests')}</strong>{' '}
                {t('7dayRequestsDesc')}
              </p>
              <p>
                <strong className="text-foreground">{t('after7days')}</strong>{' '}
                {t('after7daysDesc')}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">{t('quickSummary')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('summary48h')}</li>
                <li>{t('summary7d')}</li>
                <li>{t('summaryAfter7d')}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('cancellations')}</h2>
            <p className="text-muted-foreground">
              {t.rich('cancellationsDesc', {
                terms: (chunks) => <Link className="underline underline-offset-4" href="/terms">{chunks}</Link>
              })}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('importantNote')}</h2>
            <p className="text-muted-foreground">
              {t('importantNoteDesc')}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

