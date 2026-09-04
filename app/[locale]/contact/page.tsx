import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const { siteName, supportEmail, legalName } = getSiteConfig()
  const t = await getTranslations('contact')

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
            <h2 className="text-xl font-semibold">{t('supportEmail')}</h2>
            <p className="text-muted-foreground">
              {t('emailUsAt', { email: supportEmail })}
            </p>
            <p className="text-muted-foreground">
              {t('respondWithin')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('aboutSiteName', { siteName })}</h2>
            <p className="text-muted-foreground">
              {t('aboutDesc', { siteName })}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('whatWeOffer')}</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>{t('offer1')}</li>
              <li>{t('offer2')}</li>
              <li>{t('offer3')}</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('howItWorks')}</h2>
            <p className="text-muted-foreground">
              {t('howItWorksDesc', { siteName })}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('importantNotice')}</h2>
            <p className="text-muted-foreground">
              {t('importantNoticeDesc', { siteName })}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('billingRefunds')}</h2>
            <p className="text-muted-foreground">
              {t.rich('billingRefundsDesc', {
                refund: (chunks) => <Link className="underline underline-offset-4" href="/refund">{chunks}</Link>,
                terms: (chunks) => <Link className="underline underline-offset-4" href="/terms">{chunks}</Link>
              })}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('businessInfo')}</h2>
            <p className="text-muted-foreground">{legalName}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
