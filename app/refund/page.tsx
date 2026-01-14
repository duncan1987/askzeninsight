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
              To request a refund, contact us at{' '}
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
        </div>
      </main>
      <Footer />
    </div>
  )
}

