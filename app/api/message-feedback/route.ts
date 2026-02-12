import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

const PRESET_REASONS = [
  'This explanation is not clear enough.',
  'This answer lacks depth.',
  'This explanation is not very helpful.',
  'This answer is confusing.',
  'This explanation is not detailed enough.',
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const supabaseAdmin = await createServiceRoleClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    console.log('[Message Feedback] Received body:', body)
    const { messageId, feedbackType, feedbackReason, feedbackCustomReason } = body

    // Validate feedback type
    if (!feedbackType || !['like', 'dislike'].includes(feedbackType)) {
      console.log('[Message Feedback] Invalid feedback type:', feedbackType)
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 })
    }

    // Validate message ID
    if (!messageId) {
      console.log('[Message Feedback] Missing messageId, body keys:', Object.keys(body))
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Validate feedback reason for dislikes
    if (feedbackType === 'dislike' && !feedbackReason && !feedbackCustomReason) {
      return NextResponse.json(
        { error: 'Feedback reason is required for dislikes' },
        { status: 400 }
      )
    }

    // Get user ID if authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('[Message Feedback] User data:', user ? { id: user.id, email: user.email } : 'No user')
    if (userError) {
      console.error('[Message Feedback] Auth error:', userError)
    }

    // Check if user already provided feedback for this message
    if (user) {
      const { data: existingFeedback } = await supabaseAdmin
        .from('message_feedback')
        .select('id, feedback_type')
        .eq('user_id', user.id)
        .eq('message_id', messageId)
        .maybeSingle()

      if (existingFeedback) {
        // If the same feedback type, just return success
        if (existingFeedback.feedback_type === feedbackType) {
          return NextResponse.json({ success: true, message: 'Feedback already recorded' })
        }

        // If different feedback type, update the existing record
        const { data: updatedFeedback, error: updateError } = await supabaseAdmin
          .from('message_feedback')
          .update({
            feedback_type: feedbackType,
            feedback_reason: feedbackType === 'dislike' ? feedbackReason : null,
            feedback_custom_reason: feedbackType === 'dislike' ? feedbackCustomReason : null,
          })
          .eq('id', existingFeedback.id)
          .select()
          .single()

        if (updateError) {
          console.error('[Message Feedback] Error updating feedback:', updateError)
          throw updateError
        }

        console.log('[Message Feedback] Updated feedback:', updatedFeedback.id)
        return NextResponse.json({ success: true, feedback: updatedFeedback })
      }
    }

    // Insert new feedback
    const insertData = {
      message_id: messageId,
      user_id: user?.id,
      feedback_type: feedbackType,
      feedback_reason: feedbackType === 'dislike' ? feedbackReason : null,
      feedback_custom_reason: feedbackType === 'dislike' ? feedbackCustomReason : null,
    }
    console.log('[Message Feedback] Inserting data:', insertData)

    const { data: newFeedback, error: insertError } = await supabaseAdmin
      .from('message_feedback')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('[Message Feedback] Error inserting feedback:', JSON.stringify(insertError, null, 2))
      console.error('[Message Feedback] Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })
      throw insertError
    }

    console.log('[Message Feedback] Created feedback:', newFeedback.id)
    return NextResponse.json({ success: true, feedback: newFeedback })
  } catch (error) {
    console.error('[Message Feedback] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record feedback' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve user's feedback for a message
export async function GET(req: Request) {
  const supabase = await createClient()
  const supabaseAdmin = await createServiceRoleClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ feedback: null })
    }

    const { data: feedback } = await supabaseAdmin
      .from('message_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('message_id', messageId)
      .maybeSingle()

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('[Message Feedback] Error retrieving feedback:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve feedback' },
      { status: 500 }
    )
  }
}
