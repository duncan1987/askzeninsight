import { notFound } from 'next/navigation'
import { ShareCard } from '@/components/share-card'
import type { Metadata } from 'next'

interface SharePageProps {
  params: Promise<{ shareId: string }>
}

interface ShareData {
  username?: string
  messages: Array<{ role: string; content: string }>
  createdAt: string
}

async function getShareData(shareId: string): Promise<ShareData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/shares/${shareId}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch share:', error)
    return null
  }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareId } = await params
  const shareData = await getShareData(shareId)

  if (!shareData) {
    return {
      title: 'Share Not Found - Ask Zen Insight',
    }
  }

  const firstUserMessage = shareData.messages.find(m => m.role === 'user')?.content || 'Spiritual Conversation'
  const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : '')

  return {
    title: `${title} - Ask Zen Insight`,
    description: 'A spiritual conversation shared from Ask Zen Insight',
    openGraph: {
      title: `${title} - Ask Zen Insight`,
      description: 'A spiritual conversation shared from Ask Zen Insight',
      type: 'website',
    },
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params
  const shareData = await getShareData(shareId)

  if (!shareData) {
    notFound()
  }

  // Convert messages to the format expected by ShareCard
  const messages = shareData.messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    id: '', // Not needed for display
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            Shared Conversation
          </h1>
          <p className="text-amber-700 dark:text-amber-300">
            A spiritual journey shared with you
          </p>
        </div>

        <div className="flex justify-center">
          <ShareCard messages={messages} username={shareData.username} />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Start your own spiritual journey
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-colors"
          >
            Begin Your Conversation
          </a>
        </div>
      </div>
    </div>
  )
}
