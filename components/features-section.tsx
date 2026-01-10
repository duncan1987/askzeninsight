import { Card } from "@/components/ui/card"
import { Heart, Shield, Clock, BookOpen, MessageCircle, Users } from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "Compassionate Guidance",
    description: "Receive thoughtful, empathetic responses rooted in spiritual wisdom and religious teachings.",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description: "Your conversations are completely confidential. Share your thoughts and questions freely.",
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "Spiritual guidance whenever you need it. No appointments necessary, available 24/7.",
  },
  {
    icon: BookOpen,
    title: "Scripture-Based Wisdom",
    description: "Answers grounded in sacred texts and traditional religious teachings from various faiths.",
  },
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    description: "Discuss faith, prayer, and life's challenges in a comfortable, conversational manner.",
  },
  {
    icon: Users,
    title: "All Faith Traditions",
    description: "Respectful guidance across different religious backgrounds and spiritual paths.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              Why Seek Guidance Here?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              A trusted companion for your spiritual journey and faith exploration
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
