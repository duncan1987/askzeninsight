import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/usage-limits'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({
      used: 0,
      limit: 10,
      remaining: 10,
      percentage: 0,
    })
  }

  // Get user ID
  const { data: { user } } = await supabase.auth.getUser()

  const userId = user?.id

  // Get usage stats
  const stats = await getUsageStats(userId)

  return NextResponse.json(stats)
}
