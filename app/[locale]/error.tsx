'use client'

// Global client error boundary for all locale pages.
// - Chunk/module load failures (stale build after a Vercel redeploy) are
//   recovered by reloading once per session to pick up fresh chunk hashes.
// - All other client exceptions show a friendly bilingual message instead
//   of the default white "Application error" screen.
// Deliberately does not depend on next-intl: translations may be unavailable
// when the client bundle fails to load.

import { useEffect } from 'react'

const RELOAD_FLAG = 'zen-error-reloaded'

function isChunkLoadError(message: string): boolean {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /Loading CSS chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  )
}

function getLocale(): 'zh' | 'en' {
  if (typeof document === 'undefined') return 'zh'
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(zh|en)(?:;|$)/)
  return match ? (match[1] as 'zh' | 'en') : 'zh'
}

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isZh = getLocale() === 'zh'

  useEffect(() => {
    if (isChunkLoadError(error?.message || '')) {
      try {
        // Reload once per session to fetch the new build's chunks.
        // The flag prevents an infinite reload loop if the new build is broken.
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1')
          window.location.reload()
        }
      } catch {
        // sessionStorage unavailable (private mode) — fall through to UI
      }
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-semibold">
        {isZh ? '页面加载出现了问题' : 'Something went wrong'}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {isZh
          ? '可能是系统刚发布了新版本。请刷新页面重试，如问题持续请稍后再来。'
          : 'The app may have just been updated. Please refresh the page, and try again shortly if the issue persists.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_FLAG)
            } catch {}
            reset()
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isZh ? '重试' : 'Try again'}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {isZh ? '刷新页面' : 'Reload page'}
        </button>
      </div>
    </div>
  )
}
