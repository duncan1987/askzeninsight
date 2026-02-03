import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ZenWisdomSection } from "@/components/zen-wisdom-section"
import { FeaturesSection } from "@/components/features-section"
import { BlogPreviewSection } from "@/components/blog-preview-section"
import { MeditationCtaSection } from "@/components/meditation-cta-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import { AuthErrorToast } from "@/components/auth/auth-error-toast"

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
        <MeditationCtaSection />
        <BlogPreviewSection />
        <CtaSection />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
    </div>
  )
}
