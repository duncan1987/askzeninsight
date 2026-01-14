import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  const { siteName, supportEmail } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              This Privacy Policy explains how {siteName} collects, uses, and
              protects your information.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account information (such as email address)</li>
              <li>Usage data (such as usage limits and timestamps)</li>
              <li>Chat content you submit while using the service</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Payments</h2>
            <p className="text-muted-foreground">
              Payments are processed by Creem as merchant of record. We do not
              store your full payment card details on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">How We Use Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and improve the service</li>
              <li>Authenticate users and maintain sessions</li>
              <li>Enforce usage limits and prevent abuse</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              Questions about privacy? Email{' '}
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

