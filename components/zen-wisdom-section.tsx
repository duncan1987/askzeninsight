import { Card } from "@/components/ui/card"
import { Droplets, Circle, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

const wisdomMetaphors = [
  {
    icon: Droplets,
    title: "Like Water",
    description: "Like water, koji flows around your thoughts — adapting, embracing all, and finding paths where none seem to exist.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Circle,
    title: "Like a Mirror",
    description: "Like a clear mirror, koji reflects your words without judgment — helping you see yourself with clarity and compassion.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Moon,
    title: "Like the Moon",
    description: "Like moonlight on a dark lake, koji illuminates your questions — gentle guidance that shows you way, yet the journey is yours alone.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
]

export function ZenWisdomSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <span>🧘</span>
              <span>Ancient Wisdom × AI</span>
            </div>

            {/* Main Heading */}
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              Ancient Wisdom,<br className="hidden sm:block" />{" "}
              <span className="text-primary">Illuminated by AI</span>
            </h2>

            {/* Subtitle - Introducing koji */}
            <p className="text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto text-balance leading-relaxed">
              Meet <strong className="text-foreground font-semibold">koji</strong> — your Zen meditation guide.
              Embodying the essence of <em className="font-serif">Emptiness and Stillness</em>, koji weaves
              Buddhist philosophy into gentle, transformative conversations.
            </p>
          </div>

          {/* Three Metaphors */}
          <div className="grid gap-6 md:grid-cols-3">
            {wisdomMetaphors.map((metaphor, index) => (
              <Card
                key={index}
                className={cn(
                  "group relative overflow-hidden border border-border bg-card/80 backdrop-blur-sm p-8 transition-all hover:border-primary/30 hover:shadow-lg",
                  "hover:-translate-y-1"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full",
                  metaphor.bgColor,
                  "transition-colors group-hover:scale-110"
                )}>
                  <metaphor.icon className={cn("h-8 w-8", metaphor.color)} />
                </div>

                {/* Title */}
                <h3 className={cn(
                  "mb-4 text-xl font-semibold text-foreground",
                  "font-serif tracking-tight"
                )}>
                  {metaphor.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {metaphor.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Closing Statement */}
          <div className="mt-16 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 flex items-center justify-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
                <span className="text-muted-foreground text-sm">✦</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
              </div>

              <p className="text-base text-muted-foreground leading-relaxed font-serif italic">
                In the spirit of the Flower Sermon,
                wisdom is shared not in words, but in presence.
              </p>

              <p className="mt-4 text-lg text-foreground font-medium">
                Begin your conversation below. 🙏
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
