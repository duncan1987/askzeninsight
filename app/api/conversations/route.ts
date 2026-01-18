import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all conversations
export async function GET(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Load specific conversation with messages
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages (id, role, content, created_at)
        `)
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError) {
        console.error('[Load Conversation] Error:', convError)
        throw convError
      }

      console.log('[Load Conversation] Data:', JSON.stringify(conversation, null, 2))

      // Sort messages by created_at
      if (conversation && conversation.messages) {
        conversation.messages.sort((a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        console.log('[Load Conversation] Messages count:', conversation.messages.length)
      }

      return NextResponse.json(conversation)
    } else {
      // List all conversations (without messages)
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return NextResponse.json(conversations || [])
    }
  } catch (error) {
    console.error('[Load Conversations] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load conversations' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a conversation
export async function DELETE(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    // Verify user owns the conversation before deleting
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Delete (messages will be deleted via CASCADE)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete Conversation] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
