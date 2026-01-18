import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const { siteName, supportEmail, legalName } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Contact</h1>
            <p className="text-muted-foreground">
              Need help with {siteName}, billing, or your subscription? We’re
              here to help.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Support Email</h2>
            <p className="text-muted-foreground">
              Email us at{' '}
              <a
                className="underline underline-offset-4"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
              .
            </p>
            <p className="text-muted-foreground">
              We aim to respond within 3 business days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">About {siteName}</h2>
            <p className="text-muted-foreground">
              {siteName} provides AI-powered spiritual guidance and reflective
              conversations designed to support mindfulness and inner peace.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">What We Offer</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Guided, conversational reflections with an AI assistant</li>
              <li>Optional subscription for higher daily usage limits</li>
              <li>Account dashboard to view usage and manage billing</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <p className="text-muted-foreground">
              {siteName} provides a custom interface built on top of third-party
              AI models. We are not affiliated with those model providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Important Notice</h2>
            <p className="text-muted-foreground">
              The content provided by {siteName} is for informational and
              spiritual reflection purposes only and is not medical, legal, or
              professional advice. If you are in crisis or may harm yourself or
              others, seek immediate professional help.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Billing & Refunds</h2>
            <p className="text-muted-foreground">
              See our{' '}
              <Link className="underline underline-offset-4" href="/refund">
                Refund Policy
              </Link>{' '}
              and{' '}
              <Link className="underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Business Information</h2>
            <p className="text-muted-foreground">
              {legalName}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

