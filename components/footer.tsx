import Link from "next/link"
import { Sparkles } from "lucide-react"
import { getSiteConfig } from "@/lib/site"

export function Footer() {
  const { siteName, supportEmail } = getSiteConfig()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        {/* Main footer row */}
        <div className="flex flex-col items-center gap-3 text-sm">
          {/* Brand and links */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors">
              <Sparkles className="h-4 w-4" />
              <span>{siteName}</span>
            </Link>

            <span className="text-muted-foreground/30">|</span>

            {/* Navigation links */}
            <Link href="/chat" className="hover:text-foreground transition-colors">
              Chat
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/meditation" className="hover:text-foreground transition-colors">
              Course
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/pricing#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/refund" className="hover:text-foreground transition-colors">
              Refund
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {year} {siteName}. All rights reserved.
            <span className="mx-2 text-muted-foreground/30">•</span>
            <a
              href={`mailto:${supportEmail}`}
              className="hover:text-foreground transition-colors"
            >
              {supportEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
