import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Ask Zen Insight - Zen Meditation & Mindfulness',
  description:
    'Explore articles on meditation techniques, Zen philosophy, mindfulness practices, and spiritual growth. Get guidance from our AI meditation teacher koji.',
  keywords: [
    'zen meditation blog',
    'mindfulness articles',
    'meditation guide',
    'spiritual growth',
    'zen philosophy',
    'buddhism blog',
  ],
  openGraph: {
    title: 'Blog | Ask Zen Insight',
    description:
      'Explore articles on meditation techniques, Zen philosophy, mindfulness practices, and spiritual growth.',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
