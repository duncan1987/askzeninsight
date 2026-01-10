import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/usage-limits'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stats = await getUsageStats(user?.id)

  return NextResponse.json(stats)
}
