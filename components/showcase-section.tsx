import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const showcaseItems = [
  {
    title: "Ultra-Fast Mountain Generation",
    description: "Created in 0.8 seconds with optimized neural engine",
    image: "/beautiful-mountain-landscape-sunset.jpg",
  },
  {
    title: "Instant Garden Creation",
    description: "Complex scene rendered in milliseconds",
    image: "/lush-garden-flowers-colorful.jpg",
  },
  {
    title: "Real-time Beach Synthesis",
    description: "Photorealistic results at lightning speed",
    image: "/tropical-beach-paradise-sunset.jpg",
  },
  {
    title: "Rapid Aurora Generation",
    description: "Advanced effects processed instantly",
    image: "/northern-lights-aurora-borealis-night-sky.jpg",
  },
]

export function ShowcaseSection() {
  return (
    <section id="showcase" className="border-b border-border py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <span className="text-lg">⚡</span>
              <span>Lightning-Fast AI Creations</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              See What Nano Banana Creates
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Professional-quality results generated in milliseconds
            </p>
          </div>

          {/* Showcase Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {showcaseItems.map((item, index) => (
              <Card
                key={index}
                className="group overflow-hidden border-2 border-border bg-card transition-all hover:border-accent/50 hover:shadow-xl"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground">
                    <span className="text-sm">🍌</span>
                    <span>Nano Banana Speed</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Try Nano Banana Generator
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
