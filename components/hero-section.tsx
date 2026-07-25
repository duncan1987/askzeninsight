import { Button } from "@/components/ui/button"
import { Sparkles, MessageCircle } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export async function HeroSection() {
  const t = await getTranslations("hero")

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t("titlePrefix")}</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
            {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
          </h1>

          {/* Description */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto text-balance leading-relaxed">
            {t("description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
              <Link href="/chat">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("startCta")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Link href="/blog">{t("exploreCta")}</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("confidential")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("available")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
