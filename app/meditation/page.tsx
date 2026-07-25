import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Clock, BookOpen, Target, Lock, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function MeditationPage() {
  const t = await getTranslations('meditation')

  const courseLevels = [
    {
      level: 1,
      title: t('level1.title'),
      description: t('level1.description'),
      duration: t('level1.duration'),
      modules: 3,
      icon: Sparkles,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      available: true,
      features: [t('level1.f1'), t('level1.f2'), t('level1.f3'), t('level1.f4'), t('level1.f5')],
      startCourse: t('level1.startCourse'),
    },
    {
      level: 2,
      title: t('level2.title'),
      description: t('level2.description'),
      duration: t('level2.duration'),
      modules: 4,
      icon: BookOpen,
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      available: false,
      comingSoon: true,
      features: [t('level2.f1'), t('level2.f2'), t('level2.f3'), t('level2.f4'), t('level2.f5')],
      comingSoonLabel: t('level2.comingSoon'),
      inDevelopmentLabel: t('level2.inDevelopment'),
    },
    {
      level: 3,
      title: t('level3.title'),
      description: t('level3.description'),
      duration: t('level3.duration'),
      modules: 4,
      icon: Target,
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      available: false,
      comingSoon: true,
      features: [t('level3.f1'), t('level3.f2'), t('level3.f3'), t('level3.f4'), t('level3.f5')],
      comingSoonLabel: t('level3.comingSoon'),
      inDevelopmentLabel: t('level3.inDevelopment'),
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

          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <span>{t('badge')}</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
                {t('heroTitle', { highlight: t('heroHighlight') })}
              </h1>

              <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto text-balance leading-relaxed">
                {t('heroDesc')}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('scienceBased')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('fifteenMinutesDaily')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('selfPacedLearning')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
                  {t('chooseYourPath')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                  {t('chooseYourPathDesc')}
                </p>
              </div>

              <div className="space-y-8">
                {courseLevels.map((course) => {
                  const IconComponent = course.icon
                  return (
                    <Card
                      key={course.level}
                      className={`group relative overflow-hidden border-2 ${
                        course.available
                          ? "border-primary/50 bg-card hover:shadow-2xl hover:shadow-primary/5"
                          : "border-border bg-muted/30"
                      } transition-all duration-300`}
                    >
                      <div className="p-8 md:p-12">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
                          <div className="mb-6 lg:mb-0 lg:shrink-0">
                            <div className={`relative inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${course.color} border ${course.borderColor}`}>
                              <IconComponent className="h-10 w-10 text-foreground" />
                              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {course.level}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="mb-4">
                              <h3 className="text-2xl font-bold text-foreground mb-2">{course.title}</h3>
                            </div>

                            <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                              {course.description}
                            </p>

                            <div className="mb-6 flex flex-wrap gap-3">
                              {course.features.map((feature, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>{course.modules} {t('level1.modules')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 lg:mt-0 lg:shrink-0">
                            {course.available ? (
                              <Button
                                asChild
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 group-hover:scale-105 transition-transform"
                              >
                                <Link href="/meditation/level-1" className="gap-2">
                                  {course.startCourse}
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                size="lg"
                                disabled
                                className="bg-muted text-muted-foreground cursor-not-allowed gap-2"
                              >
                                <Lock className="h-4 w-4" />
                                {course.comingSoonLabel}
                              </Button>
                            )}
                          </div>
                        </div>

                        {course.comingSoon && (
                          <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <Lock className="h-3 w-3" />
                              <span>{course.inDevelopmentLabel}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {course.available && (
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                      )}
                    </Card>
                  )
                })}
              </div>

              <div className="mt-20 text-center">
                <Card className="border-primary/20 bg-primary/5 p-8 md:p-12">
                  <h3 className="mb-4 text-2xl font-bold text-foreground">{t('readyToBegin')}</h3>
                  <p className="mb-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {t('readyToBeginDesc')}
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/meditation/level-1" className="gap-2">
                      {t('startLevel1Free')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
