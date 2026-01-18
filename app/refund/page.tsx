import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function RefundPolicyPage() {
  const { siteName, supportEmail } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Refund Policy</h1>
            <p className="text-muted-foreground">
              This policy describes how refunds work for purchases made through{' '}
              {siteName}.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Who Processes Payments</h2>
            <p className="text-muted-foreground">
              Payments are processed by Creem as merchant of record. Refunds, if
              approved, are issued back to the original payment method.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">How to Request a Refund</h2>
            <p className="text-muted-foreground">
              Refund requests must be submitted within 7 days of purchase. To
              request a refund, contact us at{' '}
              <a
                className="underline underline-offset-4"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>{' '}
              with your account email and a brief explanation.
            </p>
            <p className="text-muted-foreground">
              We aim to respond within 3 business days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Refund Eligibility</h2>
            <p className="text-muted-foreground">
              Refunds without reason are only available for orders purchased within
              48 hours and with message usage less than 5.
            </p>
            <p className="text-muted-foreground">
              Once digital content services have incurred significant consumption,
              refunds are generally not granted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Cancellations</h2>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from your dashboard
              via the billing portal. See our{' '}
              <Link className="underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>{' '}
              for details.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Important Note</h2>
            <p className="text-muted-foreground">
              Refund requests cannot be based solely on personal subjective
              preferences about AI-generated content.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

