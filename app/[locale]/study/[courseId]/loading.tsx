export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Indeterminate progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-primary/10 overflow-hidden">
        <style>{`
          @keyframes course-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
        <div
          className="h-full w-1/4 bg-primary rounded-full"
          style={{ animation: "course-loading-bar 1.2s ease-in-out infinite" }}
        />
      </div>

      {/* Header skeleton */}
      <div className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Loading hint */}
          <div className="flex items-center justify-center gap-3 mb-10 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">课程内容加载中，请稍候...</span>
          </div>

          {/* Title skeleton */}
          <div className="mb-2">
            <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-4 w-32 bg-muted animate-pulse rounded mb-10" />

          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-muted animate-pulse rounded"
                style={{ width: `${95 - (i % 4) * 12}%` }}
              />
            ))}
            <div className="h-40 bg-muted animate-pulse rounded-lg mt-8" />
          </div>
        </div>
      </main>
    </div>
  )
}
