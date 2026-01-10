import { Button } from "@/components/ui/button"
import { Sparkles, MessageCircle } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
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
            <span>AI-Powered Spiritual Guidance</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
            Seek Wisdom, Find <span className="text-primary">Peace</span>
          </h1>

          {/* Description */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto text-balance leading-relaxed">
            Experience thoughtful spiritual guidance through compassionate AI conversations. Explore faith, prayer, and
            religious teachings in a safe and welcoming space.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
              <Link href="/chat">
                <MessageCircle className="mr-2 h-5 w-5" />
                Start a Conversation
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Link href="/blog">Explore Our Blog</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Confidential & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
