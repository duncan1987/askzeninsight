import { Card } from "@/components/ui/card"

const highlights = [
  {
    title: "Thoughtful, Calm Guidance",
    description:
      "Get reflective prompts and compassionate responses designed to support mindfulness and inner peace.",
  },
  {
    title: "Private by Design",
    description:
      "Your conversations stay within your account. We aim to keep the experience respectful and confidential.",
  },
  {
    title: "Simple Subscription",
    description:
      "Upgrade for higher daily usage limits, and manage or cancel anytime from your dashboard via the billing portal.",
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
              What You Can Expect
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              A clear, simple experience built for everyday practice
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
