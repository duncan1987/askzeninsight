import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function FAQPage() {
  const faqCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          q: 'Do I need to create an account?',
          a: 'Yes, all plans require a free account registration. Creating an account is free and only takes a minute. It allows you to track your usage, manage your subscription, and upgrade to Pro plans for additional features like chat history and advanced AI.'
        },
        {
          q: 'How do I start a conversation?',
          a: 'Simply navigate to the Chat page and start typing. Your first message can be anything - a question, a concern, or just a thought. koji will respond with Zen-inspired guidance.'
        },
        {
          q: 'What should I talk about?',
          a: 'You can discuss anything related to your spiritual journey, life decisions, emotional challenges, or philosophical questions. Common topics include: meditation practice, relationships, work stress, personal growth, and finding meaning in life.'
        }
      ]
    },
    {
      title: 'Plans & Pricing',
      icon: '💰',
      questions: [
        {
          q: 'What\'s the difference between Free and Pro plans?',
          a: 'Free users get 10 messages/day with basic AI (glm-4-flash) and no chat history. Pro users ($2.99/month or $24.99/year) get 30 premium messages/day with advanced AI (GLM-4), permanent chat history, multiple conversation management, and unlimited basic model usage after quota.'
        },
        {
          q: 'What is the Fair Use Policy?',
          a: 'To ensure fair access, Pro plans include 30 premium messages per day using advanced AI (GLM-4). After reaching this quota, you can continue using the basic AI model (glm-4-flash) at no extra cost. The premium quota resets daily at midnight UTC.'
        },
        {
          q: 'What\'s the difference between the AI models?',
          a: 'GLM-4 (Advanced): Deeper insights, better understanding of complex philosophical concepts, more nuanced guidance. Used for first 30 messages/day for Pro users.\nglm-4-flash (Basic): Faster responses, suitable for casual conversations. Used for free users and after premium quota.'
        },
        {
          q: 'Can I change between monthly and annual plans?',
          a: 'Yes! You can upgrade from monthly to annual at any time through your dashboard. When changing plans, your usage counter resets, giving you a fresh 30-message premium quota.'
        }
      ]
    },
    {
      title: 'Subscription & Billing',
      icon: '💳',
      questions: [
        {
          q: 'How do I subscribe?',
          a: 'Click the "Subscribe" button on the Pricing page or in your dashboard. You\'ll be redirected to our secure payment processor (Creem) to complete your subscription.'
        },
        {
          q: 'How do I cancel my subscription?',
          a: 'You can cancel directly from your dashboard. Click the "Cancel Subscription" button and follow the prompts. Cancellations take effect immediately, and you\'ll retain access until the end of your current billing period.'
        },
        {
          q: 'What is your refund policy?',
          a: 'We offer refunds within 7 days of subscription:\n• 48 hours: Full refund if you\'ve used 5 or fewer messages\n• After 48 hours: Prorated refund based on actual usage\n• Up to 7 days: Cancellation requests accepted (subject to review)\n\nRead the full Refund Policy for details.'
        },
        {
          q: 'How is the refund calculated?',
          a: 'Refunds are based on your actual message usage (user messages only). Within 48 hours with ≤5 messages = full refund. After that, we calculate: (Plan Days - Days Used) / Plan Days × Refund Percentage × Plan Price.'
        },
        {
          q: 'What happens to my chat history if I cancel?',
          a: 'When you cancel, your subscription ends immediately. Your chat history remains accessible until the end of your current billing period. After that, your account reverts to Free tier and chat history features are no longer available. Export important conversations before cancellation.'
        },
        {
          q: 'Can I get a refund if I\'m not satisfied?',
          a: 'Yes. If you\'re not satisfied within 48 hours and have used 5 or fewer messages, you\'re eligible for a full refund. Contact support@zeninsight.xyz to request a refund.'
        }
      ]
    },
    {
      title: 'Using the Service',
      icon: '💬',
      questions: [
        {
          q: 'How many messages can I send per day?',
          a: 'Free (registered) users: 10 messages/day with basic AI. Pro and Annual subscribers: 30 premium messages/day with advanced AI (GLM-4), plus unlimited basic model usage after quota. The quota resets at midnight UTC. Note: All plans require a free account registration.'
        },
        {
          q: 'What happens when I reach my daily limit?',
          a: 'Free users will see an upgrade prompt. Pro users will be switched to the basic AI model (glm-4-flash) but can continue using the service without interruption.'
        },
        {
          q: 'Are my conversations private?',
          a: 'Yes. Your conversations are confidential. For Pro subscribers, chat history is stored securely in your account. We do not share your conversations with third parties. See our Privacy Policy for details.'
        },
        {
          q: 'Can I delete my chat history?',
          a: 'Yes, Pro users can delete individual conversations from the sidebar. Click the trash icon on any conversation to permanently delete it and all its messages.'
        },
        {
          q: 'Can I have multiple conversations?',
          a: 'Yes! Pro and Annual subscribers can create and manage multiple conversations. Each conversation is saved separately, making it easy to organize different topics or life areas.'
        }
      ]
    },
    {
      title: 'About the Service',
      icon: '🧘',
      questions: [
        {
          q: 'Who is koji?',
          a: 'koji (meaning "Emptiness and Stillness") is your AI Zen meditation teacher. Designed to emulate Buddha\'s wisdom, koji provides compassionate guidance using Zen philosophy, natural metaphors, and heuristic dialogue.'
        },
        {
          q: 'Is this a religious service?',
          a: 'No. While koji draws from Buddhist and Zen philosophy, the service is non-religious and focuses on philosophy, psychology, and personal growth rather than religious rituals or promoting superstition.'
        },
        {
          q: 'Is this a medical or mental health service?',
          a: 'NO. This is an entertainment and personal spiritual exploration tool. It is NOT professional medical, mental health, or psychological advice. If you\'re experiencing a mental health crisis or thoughts of self-harm, please contact emergency services or qualified healthcare professionals immediately.'
        },
        {
          q: 'Can koji help with serious mental health issues?',
          a: 'No. koji is not qualified to provide mental health diagnosis or treatment. For serious mental health concerns, depression, anxiety, or crisis, please seek professional help from licensed therapists, counselors, or healthcare providers.'
        },
        {
          q: 'What AI models do you use?',
          a: 'We use Zhipu AI\'s GLM models. Pro users get GLM-4 (advanced) for the first 30 messages/day. All users have access to glm-4-flash (basic). We are not affiliated with Zhipu AI.'
        }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: '🔒',
      questions: [
        {
          q: 'Is my data secure?',
          a: 'Yes. We use industry-standard encryption and security practices. Your data is stored securely in Supabase databases. We never sell your personal information or conversations to third parties.'
        },
        {
          q: 'Do you train AI models on my conversations?',
          a: 'No. We do not use your conversations to train AI models. Your chats remain private and are only used to provide the service to you.'
        },
        {
          q: 'What data do you collect?',
          a: 'We collect account information (email, name), usage data (message counts for billing), and chat history (for Pro subscribers only). See our Privacy Policy for full details.'
        },
        {
          q: 'Can I download my data?',
          a: 'Currently, we don\'t offer a data export feature. However, you can manually copy important conversations. We\'re working on adding a data export feature in the future.'
        },
        {
          q: 'How do I delete my account?',
          a: 'To delete your account, please contact support@zeninsight.xyz. Account deletion is permanent and will remove all your data, including chat history and subscription information.'
        }
      ]
    },
    {
      title: 'Technical Support',
      icon: '🔧',
      questions: [
        {
          q: 'The service isn\'t working. What should I do?',
          a: 'First, try refreshing the page. If that doesn\'t work, clear your browser cache and cookies. If the issue persists, contact support@zeninsight.xyz with details about the problem.'
        },
        {
          q: 'I\'m seeing an error message. What does it mean?',
          a: 'Common errors include:\n• "Daily limit exceeded" - You\'ve used your message quota. Wait until midnight UTC or upgrade.\n• "API error" - Temporary connection issue. Try again in a moment.\n• "Unauthorized" - You may need to sign in again.\n\nIf you see other errors, please contact support.'
        },
        {
          q: 'Which browsers are supported?',
          a: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your browser.'
        },
        {
          q: 'Is there a mobile app?',
          a: 'Currently, Ask Zen Insight is a web-based service that works on any device with a browser. We\'re exploring mobile app development for the future.'
        }
      ]
    },
    {
      title: 'Billing & Payments',
      icon: '💳',
      questions: [
        {
          q: 'How is payment processed?',
          a: 'Payments are securely processed by Creem, our merchant of record. Creem handles PCI DSS compliance, and we never see or store your credit card information.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'Creem accepts major credit cards and debit cards. The available payment methods depend on your location.'
        },
        {
          q: 'Will I be charged taxes?',
          a: 'Applicable taxes may be charged depending on your location. The final price will be shown before you complete your purchase.'
        },
        {
          q: 'Can I update my payment information?',
          a: 'Yes. You can manage your payment method through the billing portal accessible from your dashboard.'
        },
        {
          q: 'Do you offer refunds for automatic renewals?',
          a: 'Refund eligibility is determined based on when you subscribed and your usage. See our Refund Policy for details. Contact support@zeninsight.xyz if you believe you\'re eligible for a refund.'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Ask Zen Insight
            </p>
          </div>

          {/* Quick Links */}
          <div className="bg-muted/50 rounded-lg p-6 mb-12 border border-border">
            <h2 className="font-semibold mb-3">Quick Links</h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <Link href="/pricing" className="text-primary hover:underline underline-offset-4">
                → View Pricing & Plans
              </Link>
              <Link href="/about" className="text-primary hover:underline underline-offset-4">
                → Learn About koji
              </Link>
              <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                → Terms of Service
              </Link>
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                → Privacy Policy
              </Link>
              <Link href="/refund" className="text-primary hover:underline underline-offset-4">
                → Refund Policy
              </Link>
              <a href="mailto:support@zeninsight.xyz" className="text-primary hover:underline underline-offset-4">
                → Contact Support
              </a>
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {faqCategories.map((category, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIdx) => (
                    <details
                      key={faqIdx}
                      className="group bg-card border border-border rounded-lg"
                    >
                      <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50 transition-colors flex items-center justify-between">
                        {faq.q}
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still Have Questions */}
          <div className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-8 border border-amber-200 dark:border-amber-900 text-center">
            <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-4">
              We're here to help. Reach out to us anytime.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@zeninsight.xyz"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Email Support
              </a>
              <p className="text-sm text-muted-foreground mt-3">
                We typically respond within 24 hours
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
