import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export async function MeditationCtaSection() {
  const t = await getTranslations("meditationCta")

  return (
    <section className="border-b border-border bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t("badge")}</span>
          </div>

          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t("heading")}
          </h2>

          <p className="mb-10 text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
              <Link href="/meditation">
                <BookOpen className="mr-2 h-5 w-5" />
                {t("exploreCta")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Link href="/meditation/level-1">
                {t("startFreeCta")}
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("indicator1")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("indicator2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("indicator3")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
