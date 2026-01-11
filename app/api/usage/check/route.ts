import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/usage-limits'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null as any } }

  const stats = await getUsageStats(user?.id)

  return NextResponse.json(stats)
}
