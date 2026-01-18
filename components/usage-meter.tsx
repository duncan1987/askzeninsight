'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'

interface UsageStats {
  used: number
  limit: number
  remaining: number
  percentage: number
  tier: 'anonymous' | 'free' | 'pro'
}

interface UsageMeterProps {
  refreshKey?: number
}

export function UsageMeter({ refreshKey }: UsageMeterProps = {}) {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const fetchUsage = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoading(false)
          return
        }

        const res = await fetch('/api/usage/check')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch usage:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [supabase, refreshKey])

  if (loading || !stats) return null

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today&apos;s usage</span>
          <span className="font-medium">
            {stats.used} / {stats.limit} messages
          </span>
        </div>
        <Progress value={stats.percentage} className="h-2" />
        {stats.remaining === 0 && (
          <p className="text-xs text-destructive">
            {stats.tier === 'pro' ? (
              <>The day&apos;s conversations find their rest. Return tomorrow with renewed presence.</>
            ) : (
              <>
                The day&apos;s vessel is full. To continue your journey,{' '}
                <a href="/pricing" className="underline font-medium">
                  upgrade to Pro or Annual
                </a>
              </>
            )}
          </p>
        )}
      </div>

    </div>
  )
}
