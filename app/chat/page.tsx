import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ArrowRight } from "lucide-react"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Service Unavailable</h1>
            <p className="text-muted-foreground text-lg">
              Please try again later.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to home if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Authentication Required</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Please sign in to access the spiritual guidance chat and have a conversation with koji.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="gap-2">
                <a href="/">
                  Back to Home <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <Card className="max-w-2xl mx-auto p-6 bg-muted/50 mt-8">
              <h2 className="font-semibold mb-2">Why do I need to sign in?</h2>
              <p className="text-sm text-muted-foreground text-left">
                Creating an account allows us to save your conversations, track your progress,
                and provide a more personalized spiritual guidance experience. Your privacy is
                protected and your data is secure.
              </p>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ChatInterface />
      </main>
      <Footer />
    </div>
  )
}
