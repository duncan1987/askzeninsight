import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { conversationId, role, content } = body

    console.log('[Save Message] Request:', { conversationId, role, contentLength: content?.length })

    if (!role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let currentConversationId = conversationId

    // If no conversationId provided, create a new conversation
    if (!currentConversationId) {
      console.log('[Save Message] Creating new conversation')
      // Generate title from first user message (first 50 chars)
      const title = role === 'user'
        ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
        : 'New Conversation'

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: title,
        })
        .select('id')
        .single()

      if (convError) {
        console.error('[Save Message] Error creating conversation:', convError)
        throw convError
      }
      currentConversationId = convData.id
      console.log('[Save Message] Created conversation:', currentConversationId)
    }

    // Save the message
    console.log('[Save Message] Saving message to conversation:', currentConversationId)
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role,
        content,
      })

    if (msgError) {
      console.error('[Save Message] Error saving message:', msgError)
      throw msgError
    }

    console.log('[Save Message] Message saved successfully')

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId)

    return NextResponse.json({ success: true, conversationId: currentConversationId })
  } catch (error) {
    console.error('[Save Conversation] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save message' },
      { status: 500 }
    )
  }
}
