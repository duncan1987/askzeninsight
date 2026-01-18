import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ZenWisdomSection } from "@/components/zen-wisdom-section"
import { FeaturesSection } from "@/components/features-section"
import { BlogPreviewSection } from "@/components/blog-preview-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ZenWisdomSection />
        <FeaturesSection />
        <BlogPreviewSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
