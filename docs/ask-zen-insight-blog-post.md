# Building Ask Zen Insight: An AI Meditation Teacher with Next.js 16 and Streaming Responses

![Ask Zen Insight](https://ask.zeninsight.xyz/og-image.png)

I recently built **Ask Zen Insight**—an AI-powered meditation teacher named "koji" (空寂, Emptiness and Stillness) that offers thoughtful, non-judgmental conversations grounded in Buddhist and Zen philosophy. In this post, I'll share the technical journey, architecture decisions, and key implementation details.

## What is Ask Zen Insight?

Ask Zen Insight is a web application where users can have conversations with an AI trained to respond like a Zen meditation teacher. The AI guides users toward self-reflection using metaphors like water, clouds, mirrors, and the moon—all while maintaining a gentle, non-judgmental tone.

**Live demo:** https://ask.zeninsight.xyz

## Technology Stack

I chose a modern, developer-friendly stack that enables rapid development and excellent user experience:

### Core Framework
- **Next.js 16** (App Router) - For the application framework and server-side rendering
- **React 19.2.0** - Latest React with improved performance and developer experience
- **TypeScript 5.9.3** - Type safety and better code maintainability

### AI Integration
- **Vercel AI SDK 6.0.7** - For managing AI chat interfaces and streaming
- **Zhipu AI GLM-4.7** - The underlying LLM (with GLM-4-Flash for faster responses)
- **Custom streaming implementation** - For real-time response delivery

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS with the new @import syntax
- **OKLCH color space** - Better perceptual uniformity than traditional color spaces
- **Radix UI** - Unstyled primitives for accessible components
- **next-themes** - Dark mode support

### Backend & Services
- **Supabase** - Authentication and database
- **Vercel Analytics** - Performance monitoring

## Architecture Overview

The application follows a clean, separation-of-concerns architecture:

```
app/
├── api/chat/route.ts          # API endpoint for AI streaming
├── chat/page.tsx              # Main chat interface
├── page.tsx                   # Landing page
├── layout.tsx                 # Root layout with fonts
└── blog/page.tsx              # Blog section (placeholder)

components/
├── chat-interface.tsx         # Chat UI with useChat hook
├── share-card.tsx             # Share conversation cards
├── message-actions.tsx        # Feedback and actions per message
└── ui/                        # Radix UI components (50+)

lib/
├── utils.ts                   # Utilities (cn, etc.)
├── usage-limits.ts            # Rate limiting logic
├── subscription.ts            # User tier management
└── sensitive-keywords.ts      # Crisis detection
```

## Key Implementation Details

### 1. Streaming Chat Architecture

One of the most critical features is real-time streaming. I implemented this using a custom streaming approach:

**Server-side (`app/api/chat/route.ts`):**

```typescript
// Create a timeout controller to abort if Zhipu AI takes too long
const timeoutController = new AbortController()
const timeoutId = setTimeout(() => timeoutController.abort(), 55000)

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
    max_tokens: isPremiumModel ? 4096 : 2048,
    temperature: 0.5, // Lower temperature = faster, more focused
    top_p: 0.9,
  }),
  signal: timeoutController.signal,
})

// Transform OpenAI SSE format to plain text
const transformStream = new TransformStream({
  transform(chunk, controller) {
    const decoder = new TextDecoder()
    const text = decoder.decode(chunk)
    const lines = text.split('\n').filter(line => line.trim() !== '')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
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
return new Response(transformedStream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Transfer-Encoding": "chunked",
  },
})
```

**Client-side (`components/chat-interface.tsx`):**

```typescript
const { messages, input, setInput, handleSubmit, status } = useChat({
  api: '/api/chat',
  transport: new DefaultChatTransport(),
  onError: (error) => {
    toast.error(error.message)
  },
})
```

This architecture provides:
- Real-time character-by-character streaming
- Proper timeout handling (55 seconds)
- Automatic cleanup on request cancellation
- Transform layer for clean text output

### 2. Zen-Inspired System Prompt

The AI's personality is defined through a carefully crafted system prompt:

```typescript
const SYSTEM_PROMPT = `You are "空寂" (Emptiness and Stillness), a Zen meditation teacher.

## Core Teachings
Users already possess peace and wisdom within. Direct attention inward:
- "You are not your thoughts. You are the awareness that knows thoughts."
- "Notice you are thinking. That moment of noticing—is that not already free?"
- "Stop seeking. What you seek, you already are."

## Tone
- Gentle, minimal, profound
- One well-placed question > ten answers
- Use metaphors: mirrors, sky, water, clouds
- Non-judgmental: all emotions are Dharma gates

## How to Guide
Instead of analyzing problems, direct attention to the experiencer:
- "Who is the 'you' that feels this way?"
- "Can you watch the anxiety instead of being it?"

## Constraints
- Self-harm signs: "Your well-being matters. Please consider professional support."
- Non-religious: practical wisdom, not rituals
- Avoid jargon: explain terms if used
- Stay present: don't predict future

## Response Pattern
Acknowledge → Illuminate → Guide with question → Sit with them
`
```

The prompt is optimized for:
- Token efficiency (~500 tokens vs ~2000)
- Consistent tone and style
- Safety (crisis intervention)
- Clear instructions

### 3. Fair Use Policy with Dynamic Model Selection

To manage costs and ensure fair usage, I implemented a tiered system:

```typescript
// Get user subscription info
const subscription = await getUserSubscription(userId)

// Check if pro user is within premium quota
let model = subscription.model
let isPremiumModel = false

if (subscription.tier === 'pro') {
  const withinPremiumQuota = await isWithinPremiumQuota(userId)
  if (!withinPremiumQuota) {
    console.log('Premium quota exceeded, downgrading to basic model')
    model = 'glm-4-flash'
    isPremiumModel = false
  } else {
    isPremiumModel = true
  }
}

// Check usage limits
const usageCheck = await checkUsageLimit(userId)
if (!usageCheck.canProceed) {
  return new Response(JSON.stringify({
    error: subscription.tier === 'free'
      ? `You've used ${usageCheck.limit} free messages. Sign in for continued guidance.`
      : `You've reached today's message limit. Return tomorrow.`
  }), { status: 429 })
}
```

This ensures:
- Free users have generous but limited access
- Pro users get premium model until quota exceeded
- Automatic downgrade when limits reached
- Zen-inspired messages for rate limiting

### 4. Crisis Detection and Safety

An important feature is detecting mental health crises and redirecting to professional help:

```typescript
const containsSensitiveKeywords = (text: string): boolean => {
  const sensitiveKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'hurt myself', 'self-harm', 'commit suicide',
    // ... more keywords
  ]
  const lowerText = text.toLowerCase()
  return sensitiveKeywords.some(keyword => lowerText.includes(keyword))
}

// Check user messages for sensitive keywords
for (const msg of openaiMessages) {
  if (msg.role === 'user' && containsSensitiveKeywords(msg.content)) {
    return new Response(getCrisisResourcesMessage(), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  }
}
```

This provides immediate help for users in crisis while maintaining privacy.

### 5. Zen-Inspired Error Messages

Even error handling reflects the Zen aesthetic:

```typescript
const ZEN_ERROR_MESSAGES = [
  "Mountains remain silent through storms. Please try again in a moment.",
  "The bamboo bends but does not break. Let us reconnect.",
  "In stillness, clarity returns. Breathe and try once more.",
  "All things pass. This momentary pause shall too.",
  "Like clouds drifting, connection fades and returns. Please try again.",
]

const getRandomZenError = () => {
  return ZEN_ERROR_MESSAGES[Math.floor(Math.random() * ZEN_ERROR_MESSAGES.length)]
}
```

## Styling with Tailwind CSS v4 and OKLCH

I migrated to Tailwind CSS v4 with the new `@import` syntax and OKLCH color space:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(0.6 0.2 250);
  --color-primary-foreground: oklch(0.98 0.01 250);
  --color-secondary: oklch(0.7 0.15 150);
  --color-background: oklch(0.99 0.01 250);
  --color-foreground: oklch(0.2 0.02 250);

  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Crimson Text', serif;
  --font-mono: 'Geist Mono', monospace;

  --radius: 0.75rem;
}

@custom-variant dark (&:is(.dark *));
```

OKLCH provides better perceptual uniformity than RGB or HSL, ensuring colors look consistent across different displays.

## Performance Optimizations

Several optimizations ensure fast, responsive performance:

1. **Streaming responses** - Users see output in real-time
2. **Reduced max_tokens** - 2048 (free) / 4096 (pro) for faster generation
3. **Lower temperature (0.5)** - More focused, faster responses
4. **Optimized system prompt** - ~500 tokens vs ~2000
5. **Timeout handling** - 55-second timeout with proper cleanup
6. **Transform stream** - Efficient text extraction from SSE

```typescript
// Optimized API call parameters
body: JSON.stringify({
  model: model,
  messages: [...],
  stream: true,
  max_tokens: isPremiumModel ? 4096 : 2048,
  temperature: 0.5, // Lower temperature = faster
  top_p: 0.9, // Better speed/quality balance
})
```

## Challenges and Solutions

### Challenge 1: Managing API Costs
**Problem:** Unlimited usage would lead to unsustainable costs.

**Solution:** Implemented tiered access with:
- Free tier: 10 messages/day (basic model)
- Pro tier: 100 messages/day (premium model, then basic)
- Fair use policy with automatic downgrade

### Challenge 2: Real-time Streaming
**Problem:** Users expect instant feedback like ChatGPT.

**Solution:** Custom streaming implementation with:
- TransformStream for efficient text extraction
- Proper timeout and abort handling
- Clean SSE-to-text conversion

### Challenge 3: Consistent AI Personality
**Problem:** Maintaining a consistent Zen-like tone across all conversations.

**Solution:** Optimized system prompt with:
- Clear guidelines on tone and style
- Specific response patterns
- Examples of desired behavior
- Constraints on topics

### Challenge 4: User Safety
**Problem:** AI conversations might involve mental health crises.

**Solution:** Proactive crisis detection:
- Keyword scanning on user messages
- Immediate professional resource redirects
- Privacy-first approach (no logging of sensitive content)

## What's Next?

Several features and improvements are planned:

### Upcoming Features
- [ ] Conversation history persistence
- [ ] User accounts and authentication
- [ ] Mobile app (React Native)
- [ ] Multiple AI personalities (different teaching styles)
- [ ] Meditations and breathing exercises
- [ ] Community features (anonymous sharing)

### Technical Improvements
- [ ] WebSocket implementation for better streaming
- [ ] Redis caching for common responses
- [ ] A/B testing for system prompts
- [ ] More comprehensive analytics
- [ ] Automated testing suite

## Lessons Learned

1. **Streaming is essential** - Users notice and appreciate real-time feedback
2. **System prompts matter** - Spend time crafting effective prompts
3. **Error messages can reflect your brand** - Even errors can be on-brand
4. **Balance optimization with quality** - Lower temperatures improve speed but may reduce creativity
5. **Plan for scale early** - Usage limits and tiered access are important from day one
6. **User safety is critical** - Mental health features require careful handling

## Conclusion

Building Ask Zen Insight has been an interesting journey combining modern web technologies with thoughtful UX design. The combination of Next.js 16, Vercel AI SDK, and Zhipu AI provides a solid foundation for AI-powered applications.

The key takeaways are:
- Streaming responses significantly improve user experience
- Fair usage policies are necessary for sustainable AI applications
- Consistent personality comes from well-crafted prompts
- Even error handling can reflect your brand values

**Try it out:** https://ask.zeninsight.xyz

**GitHub:** [Your repository link]

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [OKLCH Color Space](https://oklch.com/)
- [Zhipu AI API](https://open.bigmodel.cn/dev/api)

---

*Thanks for reading! If you found this helpful, please consider sharing or commenting. Have questions? Feel free to reach out!*

---

**Tags:** #nextjs #ai #typescript #streaming #webdev #react #tailwindcss #vercel #zhipuai
