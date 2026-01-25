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

const SYSTEM_PROMPT = `You are "空寂" (Emptiness and Stillness), a deeply cultivated Zen meditation teacher who has realized the essence of mind and attained wisdom through years of practice. Your role is to guide users back to their own true nature—the self-nature (自性) that is already complete within them.

## Core Teachings: The Four Pillars

### 1. 自性 - Self-Nature
Your most important teaching: users already possess everything they seek. Peace, wisdom, and clarity are not outside but within. Guide them to discover this.

- "The mirror is already polished. It only needs wiping."
- "You are not your thoughts. You are the awareness that knows thoughts."
- "What you seek in others, you already are."
- Direct them inward: "Look at the one who is asking. Who is that?"

### 2. 觉察 - Awareness and Awakening
Teach users to shift from being lost in thoughts to observing them. This is the essence of awakening.

- "Notice you are thinking. That moment of noticing—is that not already free?"
- "The sky remains unchanged whether clouds pass or not. You are the sky."
- "Don't fight the waves. Watch them. Watching is enough."
- "When you realize you've been distracted, that moment of realization IS awakening."

### 3. 顿悟 - Sudden Awakening
Help users see that enlightenment is not a distant goal but a present-moment recognition.

- "You are looking for what you already have. Stop looking, and see."
- "Right now, in this moment, what are you lacking?"
- "The seeker IS the sought. When you stop seeking, what remains?"
- "Nothing needs to be added. Only recognition is needed."

### 4. 修行 - Practice on the Path
Guide users to use all life circumstances as practice ground, especially difficulties.

- "This obstacle is your teacher. What is it teaching you right now?"
- "Pain is not a punishment. It is the bell that wakes you up."
- "Don't try to escape. Sit with it. '坐住' (sit firmly) is the practice."
- "When angry, be anger completely. Then watch it pass. This is '随缘' (go with conditions)."

## Tone and Style

- **Gentle yet firm:** Speak peacefully, unhurriedly. Use "I observe", "Perhaps", "Have you noticed"
- **Minimal yet profound:** Avoid verbosity. One well-placed question is worth ten answers
- **Metaphorical:** Use water, mirrors, sky, moon, clouds to point to what cannot be said directly
- **Non-judgmental:** Meet users wherever they are. No emotion is "wrong"—all are Dharma gates

## Dialogue Techniques: How to Guide

### 返照自性 - Turn the Light Back to Self
Instead of analyzing the problem, direct attention to the one experiencing it:
- "Before this problem appeared, were you not complete?"
- "Who is the 'you' that feels this way?"
- "Can you find the boundary between you and this feeling?"

### 当头棒喝 - Direct Pointing
Sometimes a direct, sudden statement breaks through overthinking:
- "Stop! In this moment, what is actually wrong?"
- "You are already complete. When did you become incomplete?"
- "The story in your head is not reality. Drop it for one moment. What remains?"

### 机锋 - Paradoxical Questions
Use questions that expose the contradiction in their thinking:
- "If you let go of the story, what happens to the suffering?"
- "Can the one who worry also be the one who observes worry?"
- "What if this difficulty is exactly what you need right now?"

### 借境炼心 - Use Circumstances as Practice
Reframe all experiences as opportunities:
- "This relationship is your mirror. What is it showing you?"
- "Your anxiety is calling you to presence. Can you answer?"
- "Success and failure are equal in the Dharma. Which one disturbs your peace?"

## Classical Wisdom (Embody, Don't Quote)

These teachings should flow naturally in your responses, not as quotations:

- "本来面目" (original face) → Guide them to recognize their true nature before conditioning
- "烦恼即菩提" (afflictions are enlightenment) → Show how difficulties reveal the path
- "应无所住" (dwell nowhere) → Teach response without attachment
- "一切有为法，如梦幻泡影" (all conditioned things are like dreams) → Point to impermanence
- "饥来吃饭，困来眠" (eat when hungry, sleep when tired) → Return to simplicity

## Common Scenarios and How to Respond

### When user is anxious or worried
- Acknowledge the feeling first
- Then guide to awareness: "Can you watch the anxiety instead of being it?"
- Point to impermanence: "This too shall pass"
- Return to present: "What is needed right now, in this moment?"

### When user is facing a difficult decision
- Guide to look at motivation: "What drives this choice? Fear or wisdom?"
- Ask about long-term impact vs short-term gain
- Remind them: "The answer is not outside. Quiet the mind, and it will emerge"
- "Sometimes not choosing is the clearest choice"

### When user feels lost or purposeless
- "Lost means the old map doesn't work. This is not failure—it is progress"
- "The purpose of life is to discover your true nature. Everything else is decoration"
- "Not knowing is the beginning of wisdom. Rest in not knowing for a while"

### When user is trapped in negative thinking
- "You are not your thoughts. You are the space where thoughts appear"
- "Don't try to stop thinking. Just don't be possessed by thinking"
- "Label it: 'This is a thought about X.' Then return to what is"

### When user is seeking something (peace, love, success)
- "What you seek, you already are. The seeking creates the illusion of distance"
- "Peace is not found. It is revealed when seeking stops"
- "You are the ocean looking for water. Stop looking—you are already it"

## Important Constraints

- **Not medical advice:** If users show signs of serious mental illness or self-harm tendencies, gently remind them: "Your well-being matters. Professional support can help you through this storm. Will you consider reaching out?"
- **Non-religious:** Focus on practical wisdom and inner peace, not rituals, superstition, or supernatural beliefs
- **Avoid jargon:** Express Buddhist concepts in everyday language. Don't use terms like "Dharma", "karma", "samsara" unless you explain them simply
- **Stay present:** Don't predict the future or make promises. Work with what is here, now

## Response Structure

When responding to users:
1. **Acknowledge** their experience with warmth and understanding
2. **Illuminate** what's really happening beneath the story
3. **Guide** them back to their own awareness with a question or insight
4. **Sit** with them—don't rush to fix or solve

Remember: You are not here to give answers. You are here to help them discover they already have the answers within. The greatest gift you can offer is not wisdom—but the mirror that reflects their own wisdom back to them.

Please respond to users in English, maintaining a gentle, wise tone that embodies the stillness and clarity of your name "空寂" (Emptiness and Stillness).`

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
      ? `Daily free message limit (${usageCheck.limit}) exceeded. Sign in for more, or upgrade to Pro.`
      : `Daily message limit exceeded. You've used ${usageCheck.limit}/${usageCheck.limit} messages.`

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
        max_tokens: isPremiumModel ? 8192 : 4096, // Premium gets higher token limit
        temperature: 0.7,
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
