import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const { siteName, supportEmail } = getSiteConfig()

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
        </div>
      </main>
      <Footer />
    </div>
  )
}

