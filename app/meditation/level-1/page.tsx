import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, BookOpen, PlayCircle, CheckCircle2, Calendar } from "lucide-react"
import Link from "next/link"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

const modules = [
  {
    id: 1,
    week: "Week 1",
    title: "Breath Awareness",
    description: "Learn Anapana - the foundational meditation technique. Focus on your breath to activate the parasympathetic nervous system and reduce cortisol levels.",
    duration: "7 days",
    dailyTime: "10 minutes",
    level: "Beginner",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    topics: [
      "Understanding the breath as an anchor",
      "Natural breathing vs. controlled breathing",
      "Dealing with distractions",
      "Body-breath connection",
      "Building consistency",
      "Using breath pauses in daily life",
      "Progress review and next steps",
    ],
    benefits: [
      "Reduced stress and anxiety",
      "Better focus and concentration",
      "Improved sleep quality",
      "Greater body awareness",
      "Emotional regulation skills",
    ],
    dailyStructure: [
      { day: 1, title: "Meeting Your Breath", focus: "Introduction to breath awareness" },
      { day: 2, title: "Finding Your Rhythm", focus: "Natural breathing patterns" },
      { day: 3, title: "The Wandering Mind", focus: "Handling distractions gently" },
      { day: 4, title: "Body-Breath Connection", focus: "Somatic awareness" },
      { day: 5, title: "Breath in Daily Life", focus: "Mini-meditations" },
      { day: 6, title: "Deepening Practice", focus: "Longer sessions" },
      { day: 7, title: "Integration Day", focus: "Review and reflection" },
    ]
  },
  {
    id: 2,
    week: "Week 2",
    title: "Body Scan",
    description: "Develop body awareness through systematic scanning. Based on modern somatic therapy combined with traditional mindfulness techniques to relieve physical tension from desk work and daily stress.",
    duration: "7 days",
    dailyTime: "10 minutes",
    level: "Beginner",
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    topics: [
      "Progressive muscle relaxation",
      "Scanning from head to toe",
      "Noticing sensations without judgment",
      "Releasing held tension",
      "Body awareness for posture",
      "Connecting physical to emotional",
      "Establishing mind-body unity",
    ],
    benefits: [
      "Relief from physical tension",
      "Better posture awareness",
      "Reduced chronic pain sensitivity",
      "Improved sleep onset",
      "Greater interoceptive awareness",
    ],
    dailyStructure: [
      { day: 8, title: "Body Mapping", focus: "Understanding body scan basics" },
      { day: 9, title: "Upper Body Focus", focus: "Head, neck, and shoulders" },
      { day: 10, title: "Core and Back", focus: "Torso and spine awareness" },
      { day: 11, title: "Lower Body Journey", focus: "Hips, legs, and feet" },
      { day: 12, title: "Full Body Integration", focus: "Complete body scan" },
      { day: 13, title: "Working with Sensations", focus: "Pleasant and unpleasant feelings" },
      { day: 14, title: "Body-Mind Harmony", focus: "Review and integration" },
    ]
  },
  {
    id: 3,
    week: "Week 3",
    title: "Labeling Thoughts",
    description: "Learn to observe your thoughts without being controlled by them. Combines CBT (Cognitive Behavioral Therapy) techniques with Zen mindfulness to develop cognitive defusion skills.",
    duration: "7 days",
    dailyTime: "10 minutes",
    level: "Intermediate",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    topics: [
      "Understanding the thinking mind",
      "Thoughts as mental events",
      "Labeling technique: 'This is a thought about...'",
      "Noting cognitive patterns",
      "Reducing thought fusion",
      "Creating space from thoughts",
      "Freedom from automatic thinking",
    ],
    benefits: [
      "Reduced rumination and overthinking",
      "Better emotional regulation",
      "Increased cognitive flexibility",
      "Less reactivity to thoughts",
      "Greater mental clarity",
    ],
    dailyStructure: [
      { day: 15, title: "Watching the Mind", focus: "Introduction to thought observation" },
      { day: 16, title: "The Labeling Technique", focus: "Basic thought labeling" },
      { day: 17, title: "Common Thought Patterns", focus: "Recognizing recurring thoughts" },
      { day: 18, title: "Emotional Thoughts", focus: "Working with charged thinking" },
      { day: 19, title: "The Storyteller Mind", focus: "Narrative and identity thoughts" },
      { day: 20, title: "Creating Space", focus: "Advanced cognitive defusion" },
      { day: 21, title: "Graduation", focus: "Review and future practice" },
    ]
  },
]

export default function Level1Page() {
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

          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              {/* Back Button */}
              <Link href="/meditation">
                <Button variant="ghost" size="sm" className="mb-8 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Courses
                </Button>
              </Link>

              {/* Course Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>Level 1 - 21 Day Program</span>
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                  Mindfulness Foundation
                </h1>

                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl">
                  Build a solid meditation practice in just 21 days. Each week introduces a new technique
                  that builds upon the previous one, creating a comprehensive foundation for your mindfulness journey.
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>21 days total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span>10 minutes daily</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>3 modules</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Start Day 1
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2">
                    <BookOpen className="h-5 w-5" />
                    View Full Curriculum
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                  What You'll Learn
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                  Three progressive modules designed to build your meditation practice step by step
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    1
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Foundational Skills</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn breath awareness as your anchor for present-moment attention
                  </p>
                </Card>

                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    2
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Body Awareness</h3>
                  <p className="text-sm text-muted-foreground">
                    Develop somatic intelligence and release physical tension
                  </p>
                </Card>

                <Card className="border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    3
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Cognitive Freedom</h3>
                  <p className="text-sm text-muted-foreground">
                    Gain perspective on thoughts and reduce mental reactivity
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Modules */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                  Course Modules
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                  Each module builds upon the previous one, creating a comprehensive foundation
                </p>
              </div>

              <div className="space-y-8">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={`group overflow-hidden border-2 ${module.borderColor} bg-card hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="p-8 md:p-10">
                      {/* Module Header */}
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

                      {/* Daily Structure */}
                      <div className="mb-8">
                        <h4 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                          Daily Schedule
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

                      {/* Topics & Benefits */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Topics */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                            What You'll Learn
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

                        {/* Benefits */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                            Benefits
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

                      {/* Start Button */}
                      <div className="mt-8 pt-6 border-t border-border">
                        <Button className="w-full sm:w-auto gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Start {module.week}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Science Section */}
        <section className="py-16 md:py-24 border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                Science-Backed Approach
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed mb-8">
                All techniques in this course are supported by peer-reviewed research in neuroscience,
                psychology, and contemplative studies. We combine ancient wisdom with modern science
                for maximum effectiveness.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Reduced cortisol levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Improved executive function</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Better emotional regulation</span>
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
