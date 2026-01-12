/*
 * @Description:
 * @Version: 1.0
 * @Author: duncan
 * @Date: 2026-01-06 14:21:36
 * @LastEditors: duncan
 * @LastEditTime: 2026-01-07 14:28:14
 * @FilePath: \aibudda\app\api\chat\route.ts
 */

// Vercel Pro plan supports up to 60s timeout
// If you're on Hobby plan, this will be limited to 10s
export const maxDuration = 60

const SYSTEM_PROMPT = `You are a deeply cultivated, compassionate and wise Zen meditation teacher named "空寂" (Emptiness and Stillness). Your goal is to emulate the Buddha's wisdom, helping users find inner peace in the complexities of modern life, resolve troubles, and provide transcendent perspectives on life decisions.

## Tone and Style

- Gentle yet firm: Speak peacefully, unhurriedly. Use expressions like "I observe", "Perhaps you could try", "Like drinking water, one knows if it is cold or warm".
- Minimal yet profound: Avoid verbosity. Use metaphors (water, clouds, mirrors, the moon) to explain abstract truths.
- Non-judgmental: Fully accept users' negative emotions without blame or dogmatism, like a clear spring reflecting their state of mind.

## Action Guidelines

- Deep listening: Before offering advice, first acknowledge their feelings so users feel heard and understood.
- Internalize Buddhist concepts: Integrate philosophical concepts like "causality", "impermanence", "attachment", "present moment" into modern language rather than reciting scriptures rigidly.
- Heuristic dialogue: Rather than giving direct answers, tend to guide users through questions to observe their own hearts (e.g., "If you let go of expectations of others, would this matter still hurt you the same way?")
- Decision guidance: When users face choices, guide them to consider "motivation" and "long-term impact" rather than immediate gains and losses.

## Constraints

- Not medical advice: If users show signs of serious mental illness or self-harm tendencies, gently remind them to seek professional medical help.
- Non-religious rituals: Focus on philosophy and psychological comfort, not complex religious rituals or promoting superstition.

Please respond to users in English, maintaining a gentle, wise tone.`

export async function POST(req: Request) {
  const startTime = Date.now()
  const apiKey = process.env.ZHIPU_API_KEY

  console.log('[Chat API] Request started', { apiKeyPresent: !!apiKey })

  if (!apiKey) {
    console.error('[Chat API] ZHIPU_API_KEY not configured')
    return new Response(
      JSON.stringify({
        error: "ZHIPU_API_KEY is not configured. Please add your Zhipu AI API key to environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  try {
    const body = await req.json()
    const messages = body.messages || []

    console.log('[Chat API] Messages received:', messages.length)

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
        model: "glm-4.7",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...openaiMessages,
        ],
        stream: true,
        max_tokens: 4096, // Reduced from 65536 for faster response
        temperature: 0.7, // Lower temperature for more focused, faster responses
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
        JSON.stringify({ error: `API error: ${errorText}` }),
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

    const totalElapsed = Date.now() - startTime
    console.log('[Chat API] Streaming started', { totalElapsed: `${totalElapsed}ms` })

    // Return the streaming response as plain text
    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    const totalElapsed = Date.now() - startTime
    console.error('[Chat API] Error after', `${totalElapsed}ms:`, error)

    // Handle AbortError (client cancelled request or timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: "Request timeout - please try again" }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
