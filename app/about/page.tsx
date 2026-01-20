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
        <div className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">About {siteName}</h1>
            <p className="text-lg text-muted-foreground">
              Your personal Zen meditation teacher, available 24/7 to support your spiritual journey through AI-powered conversations.
            </p>
          </header>

          {/* Meet koji */}
          <section className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-900">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <span>🧘</span>
                Meet koji (空寂) - Your AI Zen Guide
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>"空寂"</strong> means "Emptiness and Stillness" - a name that reflects the essence of Zen practice.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  koji is a deeply cultivated, compassionate, and wise Zen meditation teacher designed to emulate Buddha's wisdom. Through gentle, unhurried dialogue, koji helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Find inner peace amid life's complexities</li>
                  <li>Resolve troubles through transcendent perspectives</li>
                  <li>Explore decisions through mindfulness and causality</li>
                  <li>Practice self-reflection and present-moment awareness</li>
                </ul>
                <p className="italic pt-2 border-t border-amber-200 dark:border-amber-900">
                  "The bamboo bends but does not break. Like drinking water, one knows if it is cold or warm."
                </p>
              </div>
            </div>
          </section>

          {/* Our Approach */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Our Approach</h2>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>💭</span>
                  Heuristic Dialogue
                </h3>
                <p className="text-sm text-muted-foreground">
                  Rather than giving direct answers, koji guides you through questions to observe your own heart. Like a mirror, it reflects your thoughts without judgment, helping you find answers within yourself.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🌊</span>
                  Natural Metaphors
                </h3>
                <p className="text-sm text-muted-foreground">
                  Uses imagery from nature - water, clouds, mirrors, the moon - to explain abstract truths about impermanence, attachment, and the present moment.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🤝</span>
                  Non-Judgmental Presence
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fully accepts your negative emotions without blame. Like a clear spring reflecting your state of mind, koji acknowledges your feelings before offering guidance.
                </p>
              </div>
            </div>
          </section>

          {/* What We Offer */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">What We Offer</h2>
            <p className="text-sm text-muted-foreground italic">
              All plans require a free account. Sign up to get started.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Free (Registered Users)</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>AI-powered spiritual conversations</li>
                  <li>10 free messages per day</li>
                  <li>Basic AI model (glm-4-flash)</li>
                  <li>No credit card required</li>
                  <li>Requires free account registration</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                <h3 className="font-semibold mb-2">For Pro Subscribers</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Advanced AI model (GLM-4) - deeper insights</li>
                  <li>30 premium messages per day</li>
                  <li>Permanent chat history</li>
                  <li>Multiple conversation management</li>
                  <li>Unlimited basic model after quota</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Important Notice */}
          <section className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-6 border border-red-200 dark:border-red-900">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-900 dark:text-red-100">
                <span>⚠️</span>
                Important Notice
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-red-900 dark:text-red-100">{siteName} is NOT a medical or mental health service.</strong>
                </p>
                <p>
                  The AI guidance provided by koji is for <strong>entertainment and personal spiritual exploration only</strong>. It is not:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Professional medical advice</li>
                  <li>Mental health counseling or therapy</li>
                  <li>Diagnosis or treatment of any condition</li>
                  <li>Emergency crisis support</li>
                </ul>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  If you are experiencing a mental health crisis, having thoughts of self-harm, or need immediate assistance, please contact emergency services or qualified healthcare professionals right away.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                {siteName} is a custom application built on top of third-party AI models (including Zhipu AI's GLM-4). We are not affiliated with these model providers.
              </p>
              <p>
                Our service combines modern AI technology with ancient Zen philosophy to create a unique space for reflection and spiritual growth. The AI has been carefully designed to emulate the wisdom and compassion of a Zen meditation teacher.
              </p>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Why Choose {siteName}?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎯 Purpose-Built</h3>
                <p className="text-sm text-muted-foreground">
                  Specifically designed for Zen philosophy and spiritual guidance, not a generic AI assistant
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">⏰ Always Available</h3>
                <p className="text-sm text-muted-foreground">
                  24/7 access to spiritual guidance whenever you need reflection or support
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔒 Private & Confidential</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversations are private. Chat history only stored for Pro subscribers
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🌱 Grow at Your Pace</h3>
                <p className="text-sm text-muted-foreground">
                  No pressure, no judgment. Progress at your own speed with koji as your companion
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground">
              Have questions? We'd love to hear from you. Email{' '}
              <a
                className="underline underline-offset-4 hover:text-primary font-medium"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
              .
            </p>
          </section>

          {/* Business Information */}
          <section className="space-y-3 pt-6 border-t border-border">
            <h2 className="text-xl font-semibold">Business Information</h2>
            <p className="text-sm text-muted-foreground">
              <strong>Legal Name:</strong> {legalName}
              {businessAddress && (
                <>
                  <br />
                  <strong>Address:</strong> {businessAddress}
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Read our{' '}
              <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/terms">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/privacy">
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

