import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"
import Link from "next/link"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-b border-border py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Begin Your Spiritual Journey</span>
          </div>

          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Ready to Seek Guidance?
          </h2>

          <p className="mb-10 text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Start a meaningful conversation about faith, spirituality, and life's important questions. Our AI guide is
            here to listen and provide thoughtful wisdom.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
              <Link href="/chat">
                <MessageCircle className="mr-2 h-5 w-5" />
                Start Conversation Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent">
              <Link href="/blog">Explore Our Resources</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
