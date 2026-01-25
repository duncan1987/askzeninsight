import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteConfig } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  const { siteName, legalName, supportEmail, businessAddress } = getSiteConfig()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: 1/20/2026
            </p>
            <p className="text-muted-foreground">
              This Privacy Policy explains how {legalName} (&quot;we&quot;, &quot;our&quot;,
              or &quot;us&quot;) collects, uses, and protects your information when you use
              {siteName} (&quot;the Service&quot;).
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information to provide, maintain, and improve our Service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Account Information:</strong> Email address, display name, and
                profile information when you create an account.
              </li>
              <li>
                <strong>Authentication Data:</strong> Session tokens and authentication
                cookies to keep you signed in.
              </li>
              <li>
                <strong>Chat Content:</strong> The messages you send and receive
                during your conversations, including your spiritual guidance requests
                and the AI&apos;s responses.
              </li>
              <li>
                <strong>Usage Data:</strong> Number of messages sent, timestamps,
                and interaction patterns to enforce usage limits and prevent abuse.
              </li>
              <li>
                <strong>Subscription Data:</strong> Subscription status, plan type, and
                billing information (processed securely by Creem).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <p className="text-muted-foreground">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide AI-powered spiritual guidance conversations</li>
              <li>Save and retrieve your chat history</li>
              <li>Authenticate your account and maintain your session</li>
              <li>Enforce usage limits (10 messages/day for free users)</li>
              <li>Process subscription payments and billing</li>
              <li>Provide customer support</li>
              <li>Improve our AI model and Service quality</li>
              <li>Detect and prevent fraud, abuse, and security threats</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data Storage & Security</h2>
            <p className="text-muted-foreground">
              <strong>Chat History:</strong> Your conversations are securely stored in
              our database and are linked to your account. You can access, view, or
              delete your conversations at any time from the chat interface.
            </p>
            <p className="text-muted-foreground">
              <strong>Encryption:</strong> We use industry-standard encryption for data
              in transit (HTTPS/TLS) and at rest to protect your information.
            </p>
            <p className="text-muted-foreground">
              <strong>Access Control:</strong> Only you and authorized {siteName}{' '}
              personnel have access to your data. We never share your chat content
              with third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Payment Processing</h2>
            <p className="text-muted-foreground">
              All payments are processed by Creem as our merchant of record. We do not
              store or have access to your full credit card numbers or bank account
              details. Creem handles all PCI DSS compliance for payment security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">AI Model & Data Usage</h2>
            <p className="text-muted-foreground">
              Our Service uses Zhipu AI&apos;s GLM-4.7 model to generate
              responses. When you send a message:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Your message is sent to Zhipu AI&apos;s API to generate a response
              </li>
              <li>
                The AI does not retain your conversation history beyond the current
                session
              </li>
              <li>
                Your chat content is stored in supabase database, not used to train the
                AI model
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cross-Border Data Transfer</h2>
            <p className="text-muted-foreground">
              <strong>Important Notice:</strong> When you use our Service, your
              messages are transmitted to Zhipu AI&apos;s servers located in
              <strong>China</strong> for AI processing. This constitutes a cross-border
              data transfer from your location to China.
            </p>
            <p className="text-muted-foreground">
              <strong>Data Protection:</strong> We ensure that your data is protected
              during transmission using industry-standard encryption (HTTPS/TLS).
              Zhipu AI processes your messages solely to generate AI responses and
              does not use your data for any other purposes, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Training or improving their AI models</li>
              <li>Marketing or advertising purposes</li>
              <li>Selling or sharing with third parties</li>
              <li>Profiling or tracking user behavior</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Your Consent:</strong> By using our Service, you acknowledge and
              consent to the transfer of your messages to Zhipu AI&apos;s servers in
              China for the sole purpose of generating AI responses. If you do not
              agree to this cross-border data transfer, please discontinue use of the
              Service.
            </p>
            <p className="text-muted-foreground">
              <strong>Data Minimization:</strong> We only transmit the minimum
              necessary data (your message content) required to generate AI responses.
              We do not transmit your account information, payment details, or other
              personal data to Zhipu AI.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data Retention & Deletion</h2>
            <p className="text-muted-foreground">
              <strong>Chat History:</strong> Your conversations are retained until
              you delete them or delete your account. You can delete individual
              conversations or your entire account from the chat interface.
            </p>
            <p className="text-muted-foreground">
              <strong>Account Deletion:</strong> Upon account deletion, all your chat
              history, profile data, and usage records are permanently removed from
              our systems within 30 days.
            </p>
            <p className="text-muted-foreground">
              <strong>Backup Data:</strong> Backup copies of deleted data may be
              retained for a limited time for disaster recovery purposes before being
              permanently deleted.
            </p>
            <p className="text-muted-foreground">
              <strong>Transaction Records:</strong> For tax, financial audit, and
              fraud prevention purposes, we will retain necessary transaction records
              (excluding chat content) for at least 5 years after account deletion,
              or as required by applicable local laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data Sharing</h2>
            <p className="text-muted-foreground">
              <strong>We do NOT sell your data.</strong> We only share your
              information in limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Service Providers:</strong> With Zhipu AI (for AI response
                generation), Creem (for payment processing), and Supabase (for
                data storage) as necessary to provide the Service.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law, court order,
                or to protect our rights and safety.
              </li>
              <li>
                <strong>Business Transfers:</strong> If we are acquired or merge
                with another company, your data may be transferred as part of the
                transaction.
              </li>
            </ul>
          </section>

          <section id="cookies" className="space-y-3">
            <h2 className="text-xl font-semibold">Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management. We do
              not use advertising, analytics, or tracking cookies for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your chat history or account</li>
              <li>Export your data (upon request)</li>
              <li>Opt out of marketing communications (if any)</li>
              <li>Object to processing of your data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our Service is not intended for children under 13. We do not knowingly
              collect personal information from children under 13. If we discover we
              have collected such information, we will delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you
              of significant changes by posting the new policy on our website and
              updating the &quot;Last updated&quot; date. Continued use of the
              Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or how we handle your
              data, please contact us at{' '}
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
