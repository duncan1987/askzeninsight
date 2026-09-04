import Link from "next/link"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { UserMenu } from "@/components/auth/user-menu"
import { SignInButton } from "@/components/auth/sign-in-button"
import { SubscriptionButton } from "@/components/auth/subscription-button"
import { getSiteConfig } from "@/lib/site"
import { NotificationIcon } from "@/components/notification-icon"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getTranslations } from "next-intl/server"
import { cookies } from "next/headers"

export async function Header() {
  const { siteName } = getSiteConfig()
  const t = await getTranslations("header")
  let session = null

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en"

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
          <span className="text-foreground">{siteName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("home")}
          </Link>
          <Link
            href="/chat"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("chat")}
          </Link>
          {locale === "zh" && (
            <Link
              href="/study"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("course")}
            </Link>
          )}
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("blog")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("contact")}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("about")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {session?.user ? (
            <>
              <SubscriptionButton />
              <UserMenu user={session.user} />
              <NotificationIcon />
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
