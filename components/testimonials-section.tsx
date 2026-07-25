import { Card } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export async function TestimonialsSection() {
  const t = await getTranslations("testimonials")

  const highlights = [
    {
      title: t("highlight1Title"),
      description: t("highlight1Description"),
    },
    {
      title: t("highlight2Title"),
      description: t("highlight2Description"),
    },
    {
      title: t("highlight3Title"),
      description: t("highlight3Description"),
    },
  ]

  return (
    <section id="testimonials" className="border-b border-border py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t("heading")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item, index) => (
              <Card
                key={index}
                className="border-2 border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
              >
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
