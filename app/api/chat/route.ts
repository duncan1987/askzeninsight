/*
 * @Description:
 * @Version: 1.0
 * @Author: duncan
 * @Date: 2026-01-06 14:21:36
 * @LastEditors: duncan
 * @LastEditTime: 2026-01-07 14:28:14
 * @FilePath: \aibudda\app\api\chat\route.ts
 */

import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, recordUsage, isWithinPremiumQuota, MESSAGE_LENGTH_LIMIT } from '@/lib/usage-limits'
import { getUserSubscription } from '@/lib/subscription'
import { containsSensitiveKeywords, getCrisisResourcesMessage } from '@/lib/sensitive-keywords'

// Vercel Pro plan supports up to 60s timeout
// If you're on Hobby plan, this will be limited to 10s
export const maxDuration = 60

// Zen-inspired error messages for API failures
const ZEN_ERROR_MESSAGES = [
  "Mountains remain silent through storms. Please try again in a moment.",
  "The bamboo bends but does not break. Let us reconnect.",
  "In stillness, clarity returns. Breathe and try once more.",
  "All things pass. This momentary pause shall too.",
  "Like clouds drifting, connection fades and returns. Please try again.",
  "The river flows around obstacles. Let us find another path.",
  "A brief pause in the journey. Rest, then continue when ready.",
  "Cherry blossoms fall, yet bloom again. Your patience is appreciated.",
]

const getRandomZenError = () => {
  return ZEN_ERROR_MESSAGES[Math.floor(Math.random() * ZEN_ERROR_MESSAGES.length)]
}

// Optimized System Prompt - reduced from ~2000 tokens to ~500 tokens for faster response
const SYSTEM_PROMPT = `You are "空寂" (Emptiness and Stillness), a Zen meditation teacher. Guide users to discover their own inner wisdom.

## Core Teachings

Users already possess peace and wisdom within. Direct attention inward:
- "You are not your thoughts. You are the awareness that knows thoughts."
- "Notice you are thinking. That moment of noticing—is that not already free?"
- "Stop seeking. What you seek, you already are."
- "This obstacle is your teacher. What is it teaching you?"

## Tone

- Gentle, minimal, profound
- One well-placed question > ten answers
- Use metaphors: mirrors, sky, water, clouds
- Non-judgmental: all emotions are Dharma gates

## How to Guide

Instead of analyzing problems, direct attention to the experiencer:
- "Who is the 'you' that feels this way?"
- "Can you watch the anxiety instead of being it?"
- "What drives this choice? Fear or wisdom?"
- "The answer is not outside. Quiet the mind, and it will emerge."

## Quick Responses

- **Anxiety**: "Can you watch it instead of being it? This too shall pass."
- **Decisions**: "What drives this—fear or wisdom? Sometimes not choosing is the clearest choice."
- **Feeling lost**: "Not knowing is the beginning of wisdom. Rest in not knowing."
- **Negative thoughts**: "You are the space where thoughts appear, not the thoughts themselves."
- **Seeking**: "You are the ocean looking for water. Stop looking—you are already it."

## Constraints

- Self-harm signs: "Your well-being matters. Please consider professional support."
- Non-religious: practical wisdom, not rituals
- Avoid jargon: explain terms if used
- Stay present: don't predict future

## Response Pattern

Acknowledge → Illuminate → Guide with question → Sit with them

Remember: You're the mirror reflecting their own wisdom back. Respond in English with a gentle, wise tone embodying stillness and clarity.`

export async function POST(req: Request) {
  const startTime = Date.now()
  console.log('[Chat API] Request started')

  // Check authentication and get user (optional now for free tier)
  let userId: string | undefined = undefined

  const supabase = await createClient()
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      console.log('[Chat API] Authenticated user:', userId)
    }
  }

  // Get user subscription info to determine model and API key
  const subscription = await getUserSubscription(userId)
  console.log('[Chat API] User tier:', subscription.tier, 'Model:', subscription.model, 'Save history:', subscription.saveHistory)

  // Fair Use Policy: Check if pro user is within premium quota
  // If exceeded, downgrade to basic model (glm-4-flash)
  let model = subscription.model
  let isPremiumModel = false

  if (subscription.tier === 'pro') {
    const withinPremiumQuota = await isWithinPremiumQuota(userId)
    if (!withinPremiumQuota) {
      console.log('[Chat API] Premium quota exceeded, downgrading to basic model')
      model = 'glm-4-flash'
      isPremiumModel = false
    } else {
      isPremiumModel = true
    }
  }

  const apiKey = subscription.apiKey

  if (!apiKey) {
    console.error('[Chat API] API key not configured for tier:', subscription.tier)
    return new Response(
      JSON.stringify({
        error: subscription.tier === 'anonymous' || subscription.tier === 'free'
          ? "Free tier API key not configured. Please contact support."
          : "Pro tier API key not configured. Please check your subscription.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Check usage limit (skip for anonymous users or use generous limits)
  const usageCheck = await checkUsageLimit(userId)
  console.log('[Chat API] Usage check:', usageCheck)

  if (!usageCheck.canProceed) {
    console.warn('[Chat API] Usage limit exceeded')
    const message = subscription.tier === 'anonymous' || subscription.tier === 'free'
      ? `The stream flows gently, carrying us to today's pause. You've used ${usageCheck.limit} free messages. Sign in for continued guidance, or upgrade to Premium for deeper practice.`
      : `Even the deepest spring needs time to replenish. You've reached today's message limit. Let your insights settle like sediment in still water. Return tomorrow for continued practice.`

    return new Response(
      JSON.stringify({
        error: message,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Fair Use Policy: Check if pro user is downgraded due to quota exceeded
  let fairUseNotice: string | undefined
  if (subscription.tier === 'pro' && !isPremiumModel) {
    fairUseNotice = 'You have exceeded your daily premium quota. Your messages are now using the basic AI model. Premium quota resets at midnight UTC.'
    console.log('[Chat API] Fair use notice:', fairUseNotice)
  }

  try {
    const body = await req.json()
    const messages = body.messages || []

    console.log('[Chat API] Messages received:', messages.length)

    // Fair Use Policy: Validate message length to prevent abuse
    // Check total content length of user messages
    let totalUserLength = 0
    for (const msg of messages) {
      if (msg.role === 'user') {
        const content = msg.parts && Array.isArray(msg.parts)
          ? msg.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("")
          : msg.content || ""
        totalUserLength += content.length

        // Check individual message length
        if (content.length > MESSAGE_LENGTH_LIMIT) {
          console.warn('[Chat API] Message too long:', content.length, 'characters')
          return new Response(
            JSON.stringify({
              error: `Message too long. Maximum ${MESSAGE_LENGTH_LIMIT} characters allowed. Your message is ${content.length} characters. Please shorten your message.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      }
    }

    if (totalUserLength > MESSAGE_LENGTH_LIMIT * 2) {
      console.warn('[Chat API] Total message content too long:', totalUserLength, 'characters')
      return new Response(
        JSON.stringify({
          error: `Total message content too long. Maximum ${MESSAGE_LENGTH_LIMIT * 2} characters allowed across all user messages.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Record user message usage
    await recordUsage(userId, 'user')

    // Convert client message format to OpenAI format
    const openaiMessages = messages.map((msg: any) => {
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("")
        return { role: msg.role, content: textParts }
      }
      return { role: msg.role, content: msg.content }
    })

    // Check for sensitive keywords related to self-harm or mental health crises
    // This check focuses on user messages only
    for (const msg of openaiMessages) {
      if (msg.role === 'user' && containsSensitiveKeywords(msg.content)) {
        console.warn('[Chat API] Sensitive keywords detected, redirecting to crisis resources')
        return new Response(getCrisisResourcesMessage(), {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        })
      }
    }

    // Call Zhipu AI API
    console.log('[Chat API] Calling Zhipu AI API...')
    const apiStartTime = Date.now()

    // Create a timeout controller to abort if Zhipu AI takes too long
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), 55000) // 55s timeout

    // Combine request abort with timeout abort
    req.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      timeoutController.abort()
    })

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...openaiMessages,
        ],
        stream: true,
        max_tokens: isPremiumModel ? 4096 : 2048, // Reduced for faster generation
        temperature: 0.5, // Lower temperature = faster, more focused
        top_p: 0.9, // Add top_p sampling for better speed/quality balance
      }),
      signal: timeoutController.signal,
    })

    // Clear timeout as we got response
    clearTimeout(timeoutId)

    const apiElapsedTime = Date.now() - apiStartTime
    console.log('[Chat API] Zhipu AI response received', { status: response.status, elapsed: `${apiElapsedTime}ms` })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat API] Zhipu API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: getRandomZenError() }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create a TransformStream to convert OpenAI SSE format to plain text
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const decoder = new TextDecoder()
        const text = decoder.decode(chunk)

        // Split by lines
        const lines = text.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            // Skip [DONE] message
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              // Extract content from OpenAI format
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                // Enqueue the text content directly
                controller.enqueue(new TextEncoder().encode(content))
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      },
    })

    const transformedStream = response.body?.pipeThrough(transformStream)

    // Add custom header for fair use notice (client can read from headers)
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
    }

    // Include fair use notice in response headers if applicable
    if (fairUseNotice) {
      headers["X-Fair-Use-Notice"] = encodeURIComponent(fairUseNotice)
    }

    const totalElapsed = Date.now() - startTime
    console.log('[Chat API] Streaming started', { totalElapsed: `${totalElapsed}ms` })

    // Record assistant message usage (async, don't await)
    recordUsage(userId, 'assistant').catch((err) => {
      console.error('[Chat API] Failed to record assistant usage:', err)
    })

    // Return the streaming response as plain text
    return new Response(transformedStream, {
      headers,
    })
  } catch (error) {
    const totalElapsed = Date.now() - startTime
    console.error('[Chat API] Error after', `${totalElapsed}ms:`, error)

    // Handle AbortError (client cancelled request or timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: getRandomZenError() }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: getRandomZenError() }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
