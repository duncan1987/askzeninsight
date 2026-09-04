import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { Footer } from "@/components/footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ArrowRight } from "lucide-react"
import { Suspense } from "react"
import { AuthErrorToast } from "@/components/auth/auth-error-toast"
import type { Metadata } from "next"
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Chat - Zen Meditation Guidance | Ask Zen Insight',
  description: 'Start a conversation with koji, your AI meditation teacher. Get personalized spiritual guidance, mindfulness tips, and zen wisdom.',
  keywords: ['AI chat', 'zen meditation', 'mindfulness conversation', 'spiritual guidance chat', 'meditation teacher AI'],
  openGraph: {
    title: 'AI Chat - Zen Meditation Guidance | Ask Zen Insight',
    description: 'Have a meaningful conversation with our AI meditation teacher and discover inner wisdom.',
  },
}

export default async function ChatPage() {
  const t = await getTranslations('chatPage')
  const tc = await getTranslations('common')

  const breadcrumbItems = [
    { name: tc('home'), href: '/' },
    { name: tc('chat'), href: '/chat' },
  ]

  const supabase = await createClient()
  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">{t('serviceUnavailable')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('tryAgainLater')}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('authRequired')}</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('signInPrompt')}
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="gap-2">
                <a href="/">
                  {t('backToHome')} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <Card className="max-w-2xl mx-auto p-6 bg-muted/50 mt-8">
              <h2 className="font-semibold mb-2">{t('whySignIn')}</h2>
              <p className="text-sm text-muted-foreground text-left">
                {t('whySignInDesc')}
              </p>
            </Card>
          </div>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <AuthErrorToast />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-2">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <ChatInterface />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
    </div>
  )
}
