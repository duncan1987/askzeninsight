import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, BookOpen, PlayCircle, CheckCircle2, Calendar } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

interface DayItem {
  title: string
  focus: string
}

interface WeekModule {
  id: number
  week: string
  title: string
  description: string
  duration: string
  dailyTime: string
  level: string
  color: string
  borderColor: string
  topics: string[]
  benefits: string[]
  dailyStructure: DayItem[]
}

export default async function Level1Page() {
  const t = await getTranslations("meditation.level1")

  const modules: WeekModule[] = [
    {
      id: 1,
      week: t("week1.week"),
      title: t("week1.title"),
      description: t("week1.description"),
      duration: t("week1.duration"),
      dailyTime: t("week1.dailyTime"),
      level: t("week1.level"),
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      topics: [0,1,2,3,4,5,6].map(i => t(`week1.topics.${i}`)),
      benefits: [0,1,2,3,4].map(i => t(`week1.benefits.${i}`)),
      dailyStructure: [0,1,2,3,4,5,6].map(i => ({
        day: i + 1,
        title: t(`week1.daily.${i}.title`),
        focus: t(`week1.daily.${i}.focus`),
      })),
    },
    {
      id: 2,
      week: t("week2.week"),
      title: t("week2.title"),
      description: t("week2.description"),
      duration: t("week2.duration"),
      dailyTime: t("week2.dailyTime"),
      level: t("week2.level"),
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      topics: [0,1,2,3,4,5,6].map(i => t(`week2.topics.${i}`)),
      benefits: [0,1,2,3,4].map(i => t(`week2.benefits.${i}`)),
      dailyStructure: [0,1,2,3,4,5,6].map(i => ({
        day: i + 8,
        title: t(`week2.daily.${i}.title`),
        focus: t(`week2.daily.${i}.focus`),
      })),
    },
    {
      id: 3,
      week: t("week3.week"),
      title: t("week3.title"),
      description: t("week3.description"),
      duration: t("week3.duration"),
      dailyTime: t("week3.dailyTime"),
      level: t("week3.level"),
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      topics: [0,1,2,3,4,5,6].map(i => t(`week3.topics.${i}`)),
      benefits: [0,1,2,3,4].map(i => t(`week3.benefits.${i}`)),
      dailyStructure: [0,1,2,3,4,5,6].map(i => ({
        day: i + 15,
        title: t(`week3.daily.${i}.title`),
        focus: t(`week3.daily.${i}.focus`),
      })),
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <Link href="/meditation">
                <Button variant="ghost" size="sm" className="mb-8 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToCourses")}
                </Button>
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>{t("badge")}</span>
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                  {t("title")}
                </h1>

                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl">
                  {t("subtitle")}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{t("daysTotal")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span>{t("dailyTime")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>{t("modulesCount")}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <PlayCircle className="h-5 w-5" />
                    {t("startDay1")}
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t("viewCurriculum")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                  {t("whatYouLearn")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                  {t("whatYouLearnDesc")}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    1
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("learnSkill1")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("learnSkill1Desc")}
                  </p>
                </Card>

                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    2
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("learnSkill2")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("learnSkill2Desc")}
                  </p>
                </Card>

                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    3
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("learnSkill3")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("learnSkill3Desc")}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                  {t("courseModules")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                  {t("courseModulesDesc")}
                </p>
              </div>

              <div className="space-y-8">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={`group overflow-hidden border-2 ${module.borderColor} bg-card hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="p-8 md:p-10">
                      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {module.week}
                          </div>
                          <h3 className="text-2xl font-bold text-foreground mb-1">{module.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{module.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <PlayCircle className="h-4 w-4" />
                            <span>{module.dailyTime}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-8 leading-relaxed">
                        {module.description}
                      </p>

                      <div className="mb-8">
                        <h4 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                          {t("dailySchedule")}
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {module.dailyStructure.map((day) => (
                            <div
                              key={day.day}
                              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm"
                            >
                              <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                {day.day}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{day.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{day.focus}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                            {t("whatYouWillLearn")}
                          </h4>
                          <div className="space-y-2">
                            {module.topics.map((topic, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                            {t("benefits")}
                          </h4>
                          <div className="space-y-2">
                            {module.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-border">
                        <Button className="w-full sm:w-auto gap-2">
                          <PlayCircle className="h-4 w-4" />
                          {t("startWeek", { week: module.week })}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                {t("scienceTitle")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed mb-8">
                {t("scienceDesc")}
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t("science1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t("science2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t("science3")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
