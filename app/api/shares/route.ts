import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { username, messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages data' }, { status: 400 })
    }

    // Create a new share record
    const { data, error } = await supabase
      .from('shares')
      .insert({
        username,
        messages,
      })
      .select('share_id')
      .single()

    if (error) {
      console.error('[Create Share] Error:', error)
      throw error
    }

    console.log('[Create Share] Created share:', data.share_id)

    // share_id is already URL-safe from database migration
    return NextResponse.json({ shareId: data.share_id })
  } catch (error) {
    console.error('[Create Share] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share' },
      { status: 500 }
    )
  }
}
