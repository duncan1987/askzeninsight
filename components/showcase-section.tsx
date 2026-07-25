import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export async function ShowcaseSection() {
  const t = await getTranslations("showcase")

  const showcaseItems = [
    {
      title: t("item1Title"),
      description: t("item1Description"),
      image: "/beautiful-mountain-landscape-sunset.jpg",
    },
    {
      title: t("item2Title"),
      description: t("item2Description"),
      image: "/lush-garden-flowers-colorful.jpg",
    },
    {
      title: t("item3Title"),
      description: t("item3Description"),
      image: "/tropical-beach-paradise-sunset.jpg",
    },
    {
      title: t("item4Title"),
      description: t("item4Description"),
      image: "/northern-lights-aurora-borealis-night-sky.jpg",
    },
  ]

  return (
    <section id="showcase" className="border-b border-border py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span>{t("badge")}</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t("heading")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {showcaseItems.map((item, index) => (
              <Card
                key={index}
                className="group overflow-hidden border-2 border-border bg-card transition-all hover:border-primary/30 hover:shadow-xl"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/chat">{t("cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
