import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function TermsPage() {
  const { siteName, supportEmail } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              These Terms govern your use of {siteName}.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Service Description</h2>
            <p className="text-muted-foreground">
              {siteName} provides AI-powered spiritual guidance and reflective
              conversations. Content is provided for informational purposes and
              is not medical, legal, or professional advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Subscriptions & Billing</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Subscriptions renew automatically on a recurring basis until
                canceled.
              </li>
              <li>
                Payments are processed by Creem as merchant of record. Taxes may
                apply depending on your location.
              </li>
              <li>
                You can manage or cancel your subscription from your dashboard
                via the billing portal.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Refunds</h2>
            <p className="text-muted-foreground">
              Refund requests are handled according to our{' '}
              <Link className="underline underline-offset-4" href="/refund">
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Acceptable Use</h2>
            <p className="text-muted-foreground">
              You agree not to use the service for unlawful, abusive, or harmful
              activities, or to generate content that violates applicable laws
              or third-party rights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="text-muted-foreground">
              Our{' '}
              <Link className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>{' '}
              explains how we handle your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              For support, email{' '}
              <a
                className="underline underline-offset-4"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

