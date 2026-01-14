import Link from "next/link"
import { Sparkles } from "lucide-react"
import { getSiteConfig } from "@/lib/site"

export function Footer() {
  const { siteName, legalName, supportEmail, businessAddress } = getSiteConfig()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-foreground">{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find peace and wisdom through AI-powered Zen guidance
            </p>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>
                Support:{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  {supportEmail}
                </a>
              </p>
              {businessAddress && (
                <p className="leading-relaxed">
                  {legalName}
                  <br />
                  {businessAddress}
                </p>
              )}
            </div>
          </div>

          {/* Guidance */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Guidance</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
                  Start Chat
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/pricing#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {year} {siteName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
