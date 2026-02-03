import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { shareId } = await params

    // share_id is already URL-safe from database migration
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 })
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 })
    }

    return NextResponse.json({
      username: data.username,
      messages: data.messages,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('[Get Share] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get share' },
      { status: 500 }
    )
  }
}
