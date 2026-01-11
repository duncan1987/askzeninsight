import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { UserMenu } from "@/components/auth/user-menu"
import { SignInButton } from "@/components/auth/sign-in-button"
import { SubscriptionButton } from "@/components/auth/subscription-button"

export async function Header() {
  let session = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const result = await supabase.auth.getSession()
      session = result.data.session
    }
  } catch (error) {
    console.error('Error getting session:', error)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-foreground">Ask Zen Insight</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href="/chat"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Chat
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <SubscriptionButton />
              <UserMenu user={session.user} />
            </>
          ) : (
            <>
              <SubscriptionButton />
              <SignInButton />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
