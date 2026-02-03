import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Clock, BookOpen, Target, Lock, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

const courseLevels = [
  {
    level: 1,
    title: "Mindfulness Foundation",
    description: "Build a daily meditation habit and relieve modern life anxiety through simple, proven techniques.",
    duration: "21 days",
    modules: 3,
    icon: Sparkles,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    available: true,
    features: [
      "Breath Awareness techniques",
      "Body Scan meditation",
      "Thought Labeling practice",
      "10-minute daily sessions",
      "Science-backed approach",
    ]
  },
  {
    level: 2,
    title: "Zen Wisdom for Modern Life",
    description: "Apply Zen principles to specific life scenarios including work, relationships, and digital wellness.",
    duration: "28 days",
    modules: 4,
    icon: BookOpen,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    available: false,
    comingSoon: true,
    features: [
      "Single-Tasking mastery",
      "Emotional Surfing techniques",
      "Digital Detox strategies",
      "Koan study for modern life",
      "Personal Zen Ritual design",
    ]
  },
  {
    level: 3,
    title: "Awakening in Everyday Life",
    description: "Transform meditation into a lifestyle, incorporating Zen wisdom into every aspect of daily living.",
    duration: "Ongoing",
    modules: 4,
    icon: Target,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    available: false,
    comingSoon: true,
    features: [
      "Work as Meditation practice",
      "Relationship Zen principles",
      "Impermanence acceptance",
      "Compassion in Action",
      "90-day Zen Life Project",
    ]
  },
]

export default function MeditationPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
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
                <span>Structured Meditation Courses</span>
              </div>

              {/* Heading */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
                From Chaos to <span className="text-primary">Clarity</span>
              </h1>

              {/* Description */}
              <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto text-balance leading-relaxed">
                Discover peace through structured meditation courses rooted in Zen wisdom.
                Each level combines ancient teachings with modern science to help you navigate
                life's challenges with clarity and compassion.
              </p>

              {/* Features */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Science-Based Techniques</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>15 Minutes Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Self-Paced Learning</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Levels Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
                  Choose Your Path
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                  A progressive three-level system designed to take you from beginner to practitioner
                </p>
              </div>

              {/* Course Cards */}
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
                          {/* Icon & Level Badge */}
                          <div className="mb-6 lg:mb-0 lg:shrink-0">
                            <div className={`relative inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${course.color} border ${course.borderColor}`}>
                              <IconComponent className="h-10 w-10 text-foreground" />
                              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {course.level}
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="mb-4">
                              <h3 className="text-2xl font-bold text-foreground mb-2">{course.title}</h3>
                            </div>

                            <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                              {course.description}
                            </p>

                            {/* Features */}
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

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>{course.modules} modules</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-8 lg:mt-0 lg:shrink-0">
                            {course.available ? (
                              <Button
                                asChild
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 group-hover:scale-105 transition-transform"
                              >
                                <Link href="/meditation/level-1" className="gap-2">
                                  Start Course
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
                                Coming Soon
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Coming Soon Banner */}
                        {course.comingSoon && (
                          <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <Lock className="h-3 w-3" />
                              <span>In Development</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Decorative gradient border for available courses */}
                      {course.available && (
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                      )}
                    </Card>
                  )
                })}
              </div>

              {/* CTA Section */}
              <div className="mt-20 text-center">
                <Card className="border-primary/20 bg-primary/5 p-8 md:p-12">
                  <h3 className="mb-4 text-2xl font-bold text-foreground">Ready to Begin Your Journey?</h3>
                  <p className="mb-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Start with Level 1: Mindfulness Foundation. Build a solid meditation practice
                    in just 21 days with short, accessible daily sessions.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/meditation/level-1" className="gap-2">
                      Start Level 1 Free
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
