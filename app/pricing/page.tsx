import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PricingCard } from '@/components/pricing-card'
import Link from 'next/link'

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
              All plans require a free account. Sign up to get started.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="/month"
              description="For registered users exploring spiritual guidance"
              features={[
                '✓ Requires free account registration',
                '10 messages per day',
                'Basic AI model (glm-4-flash)',
                'No chat history',
              ]}
              ctaText="Sign Up Free"
              ctaHref="/chat"
            />

            <PricingCard
              title="Monthly"
              price="$2.99"
              period="/month"
              description="For dedicated practitioners"
              features={[
                '30 premium messages/day with advanced AI (GLM-4)',
                'Unlimited basic model after quota',
                'Save chat history permanently',
                'Multiple conversation management',
                'Export and share spiritual conversations',
                'Best for daily practice',
              ]}
              ctaText="Subscribe Now"
              ctaHref="/pricing"
              highlighted
              creemPlan="pro"
            />

            <PricingCard
              title="Annual"
              price="$24.9"
              period="/year"
              description="Best value for serious practitioners"
              features={[
                'Same benefits as Monthly plan',
                'Save 30% vs monthly',
                'Advanced AI (GLM-4) for first 30 messages/day',
                'Unlimited basic model after quota',
                'Export and share spiritual conversations',
                'Perfect for long-term spiritual journey',
              ]}
              ctaText="Subscribe Now"
              ctaHref="/pricing"
              highlighted
              creemPlan="annual"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Subscriptions renew automatically until canceled.{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms apply
            </Link>
            {' '}. Taxes may apply depending on your location.
          </p>

          <p className="mt-2 text-center text-sm font-medium text-primary">
            💳 Payments processed securely by Creem
          </p>

          {/* Fair Use Policy */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>⚖️</span>
                Fair Use Policy
              </h2>
              <p className="text-muted-foreground mb-3">
                To ensure service quality and prevent abuse, Premium and Annual plans include a fair use policy:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>First 30 messages/day:</strong> Use our advanced AI model (GLM-4) with deeper insights and more nuanced guidance
                </li>
                <li>
                  <strong>After 30 messages:</strong> Automatically switch to basic model (glm-4-flash) - still fully functional, perfect for casual conversations
                </li>
                <li>
                  <strong>No hard limits:</strong> Continue using the service with basic model after quota
                </li>
                <li>
                  <strong>Daily reset:</strong> Premium quota resets at midnight UTC every day
                </li>
              </ul>
            </div>
          </div>

          {/* Why Choose Premium */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Premium?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🧠</div>
                <h3 className="font-semibold mb-2">Advanced AI Insights</h3>
                <p className="text-sm text-muted-foreground">
                  GLM-4 model provides deeper, more nuanced understanding of Zen philosophy and personal growth concepts
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">Chat History Saved</h3>
                <p className="text-sm text-muted-foreground">
                  All conversations permanently saved. Review your spiritual journey and track personal growth over time
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">📚</div>
                <h3 className="font-semibold mb-2">Multiple Conversations</h3>
                <p className="text-sm text-muted-foreground">
                  Organize different topics separately - work, relationships, meditation, or life decisions
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🔄</div>
                <h3 className="font-semibold mb-2">3x Daily Limit</h3>
                <p className="text-sm text-muted-foreground">
                  30 premium messages per day vs 10 for free users. Perfect for daily practice and deep exploration
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">📤</div>
                <h3 className="font-semibold mb-2">Export & Share Conversations</h3>
                <p className="text-sm text-muted-foreground">
                  Download your spiritual conversations as markdown or share insights with friends and community
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-2xl mb-3">🌙</div>
                <h3 className="font-semibold mb-2">Continuous Journey</h3>
                <p className="text-sm text-muted-foreground">
                  Build a lasting spiritual practice with tools that grow with you over time
                </p>
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>💰</span>
                Refund Policy
              </h2>
              <p className="text-muted-foreground mb-3">
                We offer a flexible refund policy within the first 7 days:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>48 hours:</strong> Full refund if you've used 5 or fewer messages
                </li>
                <li>
                  <strong>After 48 hours:</strong> Prorated refund based on actual usage
                </li>
                <li>
                  <strong>Up to 7 days:</strong> Cancellation requests accepted (subject to review)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Read the full <Link href="/refund" className="underline underline-offset-4 hover:text-primary font-medium">Refund Policy</Link> for details.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div id="faq" className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Can I try before subscribing?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! The free plan gives you 10 messages per day to explore the service. No credit card required.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  What's the difference between Free and Premium plans?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Free users get 10 messages/day with basic AI and no chat history. Premium users get 30 premium messages/day with advanced AI (GLM-4), permanent chat history, and conversation management. After exceeding 30 premium messages, Premium users can continue with the basic model.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  What is the Fair Use Policy?
                </h3>
                <p className="text-muted-foreground text-sm">
                  To ensure fair access for all users, Premium plans include 30 premium messages per day using our advanced AI model. After reaching this quota, you can continue using the service with the basic AI model at no extra cost. The premium quota resets daily at midnight UTC.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  What's the difference between the AI models?
                </h3>
                <p className="text-muted-foreground text-sm">
                  <strong>GLM-4 (Advanced):</strong> More nuanced understanding, deeper insights, better at complex philosophical concepts. Used for first 30 messages/day for Premium users.<br/>
                  <strong>glm-4-flash (Basic):</strong> Faster responses, good for casual conversations and basic guidance. Used for free users and after premium quota.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  How is the refund calculated?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Refunds are calculated based on your actual message usage (user messages only, not assistant responses). Within 48 hours with ≤5 messages, you get a full refund. After that, we calculate a prorated refund based on messages used vs. your plan's daily allowance.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  What happens to my chat history if I cancel?
                </h3>
                <p className="text-muted-foreground text-sm">
                  When you cancel, your subscription ends immediately. Your chat history remains accessible in your current billing period. After the period ends, your account reverts to Free tier and chat history features are no longer available. We recommend exporting important conversations before cancellation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Can I change between monthly and annual plans?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Yes! You can upgrade from monthly to annual at any time through your dashboard. When changing plans, your usage counter resets, giving you a fresh 30-message premium quota.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is this a medical or mental health service?</h3>
                <p className="text-muted-foreground text-sm">
                  No. Ask Zen Insight is an entertainment and personal spiritual exploration tool. The AI guidance provided is for informational and reflective purposes only. It is NOT professional medical, mental health, legal, or financial advice. If you're experiencing a mental health crisis, please contact emergency services or qualified healthcare professionals immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">More questions?</h3>
                <p className="text-muted-foreground text-sm">
                  Visit our <Link href="/faq" className="underline underline-offset-4 hover:text-primary font-medium">FAQ page</Link> or contact us at <a href="mailto:support@zeninsight.xyz" className="underline underline-offset-4 hover:text-primary font-medium">support@zeninsight.xyz</a>
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
