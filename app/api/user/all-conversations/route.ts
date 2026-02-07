import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE - Delete all conversations for current user
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // First, count conversations to be deleted
    const { data: conversations, error: countError } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    if (countError) throw countError

    const deleteCount = conversations?.length || 0

    if (deleteCount === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No conversations to delete'
      })
    }

    // Delete all conversations (messages will be deleted via CASCADE)
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    console.log(`[Delete All Conversations] Deleted ${deleteCount} conversations for user ${user.id}`)

    return NextResponse.json({
      success: true,
      deletedCount: deleteCount,
      message: `Successfully deleted ${deleteCount} conversation${deleteCount > 1 ? 's' : ''}`
    })

  } catch (error) {
    console.error('[Delete All Conversations] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete conversations' },
      { status: 500 }
    )
  }
}
