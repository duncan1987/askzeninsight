import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function TermsPage() {
  const { siteName, legalName, supportEmail, businessAddress } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-muted-foreground">
              These Terms of Service (&quot;Terms&quot;) govern your use of {siteName}
              (&quot;the Service&quot;) provided by {legalName} (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;). By accessing or using the Service,
              you agree to be bound by these Terms.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By creating an account or using the Service, you agree to these Terms and
              our{' '}
              <Link className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>
              . If you do not agree to these Terms, you may not access or use the
              Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Service Description</h2>
            <p className="text-muted-foreground">
              {siteName} provides an AI-powered spiritual guidance and meditation
              support service. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Conversational AI responses from a Zen meditation teacher persona</li>
              <li>Chat history storage for subscribed users</li>
              <li>Usage limits and subscription plans</li>
              <li>Customer support</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Important:</strong> The Service is for informational and
              reflective purposes only. It is not a substitute for professional medical,
              mental health, legal, or financial advice.
            </p>
            <p className="text-muted-foreground">
              <strong>AI-Generated Content Disclaimer:</strong> AI-generated content
              is provided for reference only and does not represent an official position
              or endorsed interpretation. AI models may produce hallucinations or
              inaccuracies. Users are encouraged to independently verify Buddhist and
              Zen classics, scriptures, and teachings from authoritative sources.
            </p>
            <p className="text-muted-foreground">
              <strong>Service Purpose:</strong> This Service is for entertainment and
              personal spiritual exploration only. It does not constitute medical
              advice, psychological counseling, or professional diagnosis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old to use the Service. By using the
              Service, you represent and warrant that you are of legal age to form a
              binding contract with us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Account Registration</h2>
            <p className="text-muted-foreground">
              To use certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate, complete, and current information</li>
              <li>
                Maintain the security of your password and account information
              </li>
              <li>
                Accept responsibility for all activities that occur under your account
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these
              Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Subscription Plans & Billing</h2>
            <p className="text-muted-foreground">
              We offer Free and paid subscription plans:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Free Plan:</strong> 10 messages per day, no chat history
                storage
              </li>
              <li>
                <strong>Pro Plan ($2.99/month):</strong> 30 premium messages per day, chat
                history saved, advanced AI model
              </li>
              <li>
                <strong>Annual Plan ($24.9/year):</strong> 30 premium messages per day,
                chat history saved, advanced AI model, best value
              </li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Fair Use Policy:</strong> To prevent abuse and ensure service
              stability, premium messages (first 30 per day) use advanced AI models.
              After exceeding the premium quota, messages will use a basic AI model.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Payment Terms</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Automatic Renewal:</strong> Subscriptions renew automatically
                until canceled. You will be charged at the beginning of each billing
                period.
              </li>
              <li>
                <strong>Payment Processing:</strong> All payments are processed by
                Creem as our merchant of record. Creem handles PCI DSS compliance.
              </li>
              <li>
                <strong>Taxes:</strong> Applicable taxes may be charged depending on
                your location.
              </li>
              <li>
                <strong>Payment Changes:</strong> We reserve the right to change
                prices with 30 days notice. Existing subscribers will be notified
                before any price change takes effect.
              </li>
              <li>
                <strong>AI Model Cost Adjustment:</strong> Subscription fees are
                subject to adjustment in response to changes in third-party AI model
                pricing and infrastructure costs. As our service relies on external
                AI providers (including but not limited to Zhipu AI, OpenAI, Anthropic,
                and other LLM providers), significant fluctuations in their pricing
                or the introduction of new cost structures may necessitate corresponding
                adjustments to our subscription fees. Any such adjustments will be made
                with reasonable notice (minimum 30 days) to existing subscribers, and
                you will have the opportunity to cancel your subscription before the
                new pricing takes effect. We strive to maintain price stability while
                ensuring sustainable service delivery.
              </li>
              <li>
                <strong>Dispute Resolution:</strong> You agree to contact us via
                support@zeninsight.xyz before initiating any disputes with the
                payment platform. Direct disputes or chargebacks with Creem without
                prior communication may result in account suspension.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Cancellation & Refunds</h2>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from your dashboard. Upon
              cancellation:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Your access continues until the end of the current billing period
              </li>
              <li>You will not be charged for subsequent periods</li>
              <li>No refunds are provided for partial billing periods</li>
            </ul>
            <p className="text-muted-foreground">
              For refund requests, please refer to our{' '}
              <Link className="underline underline-offset-4" href="/refund">
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Usage Limits & Fair Use Policy</h2>
            <p className="text-muted-foreground">
              <strong>Daily Message Limits:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Free Plan:</strong> 10 messages per day
              </li>
              <li>
                <strong>Pro & Annual Plans:</strong> 30 premium messages per day
              </li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Fair Use Policy Details:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Premium messages (within daily quota) use advanced AI models for higher
                quality responses
              </li>
              <li>
                After exceeding the premium quota, messages will use a basic AI model
              </li>
              <li>
                To prevent abuse and ensure service availability, we may apply
                rate limits to excessive usage patterns
              </li>
              <li>
                Extremely long messages or repetitive automated queries may be
                restricted
              </li>
              <li>
                We reserve the right to modify usage limits based on service capacity
                and abuse prevention needs
              </li>
            </ul>
            <p className="text-muted-foreground">
              When you reach your premium limit, you will be notified. You can continue
              using the Service with the basic model, or wait for the quota to reset at
              midnight UTC.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Acceptable Use</h2>
            <p className="text-muted-foreground">
              You agree not to use the Service for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Unlawful, fraudulent, or malicious activities</li>
              <li>Generating harmful, violent, or hate content</li>
              <li>Harassing, threatening, or abusing others</li>
              <li>Spamming, botting, or automated access</li>
              <li>
                Reverse engineering, disassembling, or hacking the Service
              </li>
              <li>
                Violating any applicable local, state, national, or international law
              </li>
              <li>Infringing upon the rights of others</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to terminate accounts that violate these acceptable use
              policies without notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              10. Health & Medical Disclaimer
            </h2>
            <p className="text-muted-foreground">
              <strong>Important:</strong> {siteName} is NOT a medical or mental
              health service. The AI guidance provided is for informational and
              reflective purposes only. It is not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Professional medical advice</li>
              <li>Mental health counseling or therapy</li>
              <li>Diagnosis or treatment of any condition</li>
              <li>Emergency crisis support</li>
            </ul>
            <p className="text-muted-foreground">
              If you are experiencing a mental health crisis, having thoughts of
              self-harm or harming others, or need immediate assistance, please contact
              emergency services or a qualified healthcare professional immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              11. Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              <strong>Our Content:</strong> The Service, including its design, text,
              graphics, and code, is owned by {legalName} and protected by
              intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              <strong>Your Content:</strong> You retain ownership of the content you
              provide. By submitting content, you grant us a license to use, modify,
              display, and distribute it solely to provide the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Privacy</h2>
            <p className="text-muted-foreground">
              Your privacy is important to us. Please review our{' '}
              <Link className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>
              , which also governs your use of the Service, to understand how we
              collect, use, and protect your information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              13. Disclaimers & Warranties
            </h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
              WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR
              IMPLIED, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Reliability, availability, or timeliness</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              14. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {legalName}{' '}
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS,
              DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM
              YOUR USE OR INABILITY TO USE THE SERVICE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              15. Indemnification
            </h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold {legalName} harmless from any claims,
              damages, losses, liabilities, and expenses arising from your use of the
              Service or violation of these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">16. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your access to the Service at any time, with
              or without cause, with or without notice, effective immediately. Upon
              termination, your right to use the Service will cease.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">17. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will notify you of material
              changes by posting the updated Terms on our website and updating the
              &quot;Last updated&quot; date. Continued use of the Service after
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">18. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with
              applicable laws. Any disputes arising from these Terms shall be subject
              to the exclusive jurisdiction of the courts in the jurisdiction where
              {legalName} is established.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">19. Severability</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision will be limited or eliminated to the minimum
              extent necessary so that the remaining Terms remain in full force and
              effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">20. Waiver</h2>
            <p className="text-muted-foreground">
              Our failure to enforce any right or provision of these Terms will not be
              considered a waiver of those rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">21. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms, please contact us at{' '}
              <a
                className="underline underline-offset-4"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
              .
            </p>
            {businessAddress && (
              <p className="text-muted-foreground">
                <strong>Business Address:</strong> {businessAddress}
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
