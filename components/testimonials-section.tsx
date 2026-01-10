import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Creator",
    content:
      "This editor completely changed my workflow. The character consistency is incredible - miles ahead of Flux Kontext!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "UGC Specialist",
    content:
      "Creating consistent AI influencers has never been easier. It maintains perfect face details across edits!",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Professional Editor",
    content: "One-shot editing is basically solved with this tool. The scene blending is so natural and realistic!",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-b border-border py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              What Creators Are Saying
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Trusted by professionals and creators worldwide
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-2 border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
              >
                {/* Rating Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Content */}
                <p className="mb-6 text-foreground leading-relaxed">"{testimonial.content}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
