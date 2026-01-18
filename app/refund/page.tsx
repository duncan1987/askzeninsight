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

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Refund Eligibility</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">48-Hour Refund Window:</strong> You
                can request a full refund within 48 hours of purchase if you have used
                fewer than 5 messages. No explanation required.
              </p>
              <p>
                <strong className="text-foreground">7-Day Refund Requests:</strong> For
                purchases between 48 hours and 7 days, you may request a refund by
                contacting support. Refunds are evaluated on a case-by-case basis.
              </p>
              <p>
                <strong className="text-foreground">After 7 Days:</strong> Refunds are
                generally not granted except in cases of technical issues or service
                failures.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Quick Summary:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>&lt; 48 hours and &lt; 5 messages: Automatic refund eligibility</li>
                <li>48 hours - 7 days: Contact support for review</li>
                <li>&gt; 7 days: No refund (unless technical issue)</li>
              </ul>
            </div>
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

