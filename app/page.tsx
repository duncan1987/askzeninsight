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
import type { Metadata } from "next"

// Force dynamic rendering because Header uses cookies for authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI-Powered Zen Meditation Teacher | Ask Zen Insight - Spiritual Guidance',
  description: 'Discover inner wisdom through mindful conversation with koji, your AI meditation teacher. Get personalized zen guidance, meditation tips, and spiritual support for your daily practice.',
  keywords: ['AI meditation teacher', 'zen spiritual guidance', 'mindfulness AI', 'meditation coach', 'digital zen teacher'],
  openGraph: {
    title: 'AI-Powered Zen Meditation Teacher | Ask Zen Insight',
    description: 'Experience compassionate AI spiritual guidance and discover inner peace through mindful conversation with our Zen meditation teacher.',
  },
}

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
