import { Card } from "@/components/ui/card"
import { Heart, Shield, Clock, BookOpen, MessageCircle, Users } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function FeaturesSection() {
  const t = await getTranslations("features")

  const features = [
    {
      icon: Heart,
      title: t("compassionateTitle"),
      description: t("compassionateDescription"),
    },
    {
      icon: Shield,
      title: t("safeTitle"),
      description: t("safeDescription"),
    },
    {
      icon: Clock,
      title: t("availableTitle"),
      description: t("availableDescription"),
    },
    {
      icon: BookOpen,
      title: t("scriptureTitle"),
      description: t("scriptureDescription"),
    },
    {
      icon: MessageCircle,
      title: t("naturalTitle"),
      description: t("naturalDescription"),
    },
    {
      icon: Users,
      title: t("allFaithsTitle"),
      description: t("allFaithsDescription"),
    },
  ]

  return (
    <section id="features" className="border-b border-border py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t("heading")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
