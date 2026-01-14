import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PricingCard } from '@/components/pricing-card'

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-muted-foreground text-lg">
              Start free, upgrade when you need more
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="/month"
              description="Perfect for exploring spiritual guidance"
              features={[
                '10 messages per day',
                'Anonymous access',
                'Basic AI guidance',
                'No credit card required',
              ]}
              ctaText="Get Started"
              ctaHref="/chat"
            />

            <PricingCard
              title="Pro"
              price="$1"
              period="/month"
              description="For dedicated practitioners"
              features={[
                '100 messages per day',
                'Save chat history',
                'Advanced AI insights',
                'Priority support',
                'Early access to features',
              ]}
              ctaText="Subscribe Now"
              ctaHref="/pricing"
              highlighted
              creemPlan="pro"
            />

            <PricingCard
              title="Annual"
              price="$9"
              period="/year"
              description="Best value for serious practitioners"
              features={[
                '100 messages per day',
                'Save chat history',
                'Advanced AI insights',
                'Priority support',
                'Early access to features',
                'Save 75% vs monthly',
              ]}
              ctaText="Subscribe Now"
              ctaHref="/pricing"
              highlighted
              creemPlan="annual"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Subscriptions renew monthly until canceled. Payments are processed by
            Creem as merchant of record. Taxes may apply depending on your
            location.
          </p>

          {/* FAQ */}
          <div id="faq" className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Can I try before subscribing?</h3>
                <p className="text-muted-foreground">
                  Yes! The free plan gives you 10 messages per day to explore
                  the service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  What happens if I exceed my limit?
                </h3>
                <p className="text-muted-foreground">
                  You&apos;ll see a message inviting you to upgrade. Your
                  conversations are saved when you subscribe.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground">
                  Absolutely. Cancel anytime from your dashboard in the billing
                  portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
