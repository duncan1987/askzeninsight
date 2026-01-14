import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  const { siteName, legalName, supportEmail, businessAddress } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">About {siteName}</h1>
            <p className="text-muted-foreground">
              {siteName} provides AI-powered spiritual guidance and reflective
              conversations designed to support mindfulness and inner peace.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What We Offer</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Guided, conversational reflections with an AI assistant</li>
              <li>Optional subscription for higher daily usage limits</li>
              <li>Account dashboard to view usage and manage billing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <p className="text-muted-foreground">
              {siteName} provides a custom interface built on top of third-party
              AI models. We are not affiliated with those model providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Important Notice</h2>
            <p className="text-muted-foreground">
              The content provided by {siteName} is for informational and
              spiritual reflection purposes only and is not medical, legal, or
              professional advice. If you are in crisis or may harm yourself or
              others, seek immediate professional help.
            </p>
          </section>

          <section className="space-y-3">
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

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Business Information</h2>
            <p className="text-muted-foreground">
              {legalName}
              {businessAddress ? (
                <>
                  <br />
                  {businessAddress}
                </>
              ) : null}
            </p>
            <p className="text-muted-foreground">
              Read our{' '}
              <Link className="underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

