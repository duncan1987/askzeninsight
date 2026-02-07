import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Create a new export task
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
    const { format = 'json' } = body

    if (!['json', 'markdown'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create export task record
    const { data: exportTask, error: createError } = await supabase
      .from('conversation_exports')
      .insert({
        user_id: user.id,
        status: 'pending',
        format,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Start async processing (fire and forget)
    // In production, you might want to use a job queue like Bull, Redis, etc.
    processExportAsync(supabase, exportTask.id, user.id, format, expiresAt).catch(err => {
      console.error('[Export Async] Error:', err)
    })

    return NextResponse.json({
      id: exportTask.id,
      status: 'pending',
      message: 'Export task created. Processing...'
    })

  } catch (error) {
    console.error('[Create Export] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create export task' },
      { status: 500 }
    )
  }
}

// GET - List export tasks for current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: exports, error } = await supabase
      .from('conversation_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json(exports || [])
  } catch (error) {
    console.error('[List Exports] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list exports' },
      { status: 500 }
    )
  }
}

// Async function to process export (simulated background job)
async function processExportAsync(
  supabase: any,
  exportId: string,
  userId: string,
  format: string,
  expiresAt: Date
) {
  try {
    // Update status to processing
    await supabase
      .from('conversation_exports')
      .update({ status: 'processing' })
      .eq('id', exportId)

    // Fetch all conversations with messages
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (id, role, content, created_at)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (fetchError) throw fetchError

    // Sort messages in each conversation
    const sortedConversations = (conversations || []).map((conv: any) => ({
      ...conv,
      messages: (conv.messages || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }))

    // Calculate totals
    const totalConversations = sortedConversations.length
    const totalMessages = sortedConversations.reduce((sum: number, conv: any) =>
      sum + (conv.messages?.length || 0), 0
    )

    // Generate export data
    const exportData = {
      exportDate: new Date().toISOString(),
      userEmail: (await supabase.auth.admin.getUserById(userId)).data.user?.email,
      totalConversations,
      totalMessages,
      conversations: sortedConversations
    }

    // For this implementation, we'll store the data as a base64-encoded JSON string
    // In production, you should upload to a storage service (S3, Supabase Storage, etc.)
    // and store the URL instead
    let content: string
    let fileName: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2)
      fileName = `zen-insight-conversations-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      // Markdown format
      content = generateMarkdown(exportData)
      fileName = `zen-insight-conversations-${new Date().toISOString().split('T')[0]}.md`
      mimeType = 'text/markdown'
    }

    // In production: Upload to storage and get URL
    // For now: Store as base64 data URL (not ideal for large exports, but works for demo)
    const base64Content = Buffer.from(content, 'utf-8').toString('base64')
    const fileUrl = `data:${mimeType};base64,${base64Content}`

    // Update export record with success
    await supabase
      .from('conversation_exports')
      .update({
        status: 'completed',
        file_url: fileUrl,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId)

    console.log(`[Export Async] Completed export ${exportId}: ${totalConversations} conversations, ${totalMessages} messages`)

  } catch (error) {
    console.error('[Export Async] Error:', error)
    await supabase
      .from('conversation_exports')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', exportId)
  }
}

// Helper function to generate markdown format
function generateMarkdown(data: any): string {
  let md = `# Zen Insight - Conversation Export\n\n`
  md += `**Export Date:** ${new Date(data.exportDate).toLocaleString()}\n`
  md += `**Email:** ${data.userEmail || 'N/A'}\n`
  md += `**Total Conversations:** ${data.totalConversations}\n`
  md += `**Total Messages:** ${data.totalMessages}\n\n`
  md += `---\n\n`

  data.conversations.forEach((conv: any, idx: number) => {
    md += `## ${idx + 1}. ${conv.title}\n\n`
    md += `**Created:** ${new Date(conv.created_at).toLocaleString()}\n`
    md += `**Last Updated:** ${new Date(conv.updated_at).toLocaleString()}\n\n`

    if (conv.messages && conv.messages.length > 0) {
      conv.messages.forEach((msg: any) => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Zen Insight'
        md += `### ${role}\n`
        md += `_${new Date(msg.created_at).toLocaleString()}_\n\n`
        md += `${msg.content}\n\n`
      })
    } else {
      md += `*No messages in this conversation*\n\n`
    }

    md += `---\n\n`
  })

  md += `\n*Generated by [Ask Zen Insight](https://ask.zeninsight.xyz)*\n`
  return md
}
