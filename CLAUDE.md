# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Ask Priest AI" - a Next.js 16 application providing AI-powered spiritual guidance based on Buddhist and Zen philosophy. The AI, named "空寂" (Emptiness and Stillness), acts as a meditation teacher offering thoughtful, non-judgmental conversations.

## Development Commands

**Note:** On Windows, Node.js may not be in PATH. Use the batch file or full path.

```bash
# Start development server
pnpm dev
# Or on Windows: node_modules/next/dist/bin/next dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

For Windows environments where Node.js is not in PATH, use `start-dev.bat` or:
```batch
"C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next dev
```

## Technology Stack

- **Framework:** Next.js 16.0.10 (App Router) with React 19.2.0
- **Language:** TypeScript 5.9.3 with strict mode
- **Styling:** Tailwind CSS v4 with OKLCH color space
- **AI SDK:** Vercel AI SDK 6.0.7 (`@ai-sdk/react`, `ai`)
- **Model:** Zhipu AI's GLM-4-Flash
- **UI Components:** Radix UI primitives with custom styling
- **Forms:** React Hook Form with Zod validation
- **Package Manager:** pnpm

## Architecture

### App Router Structure

```
app/
├── api/chat/route.ts    # POST endpoint for AI chat streaming
├── chat/page.tsx         # Main chat interface
├── blog/page.tsx         # Blog listing (placeholder)
├── page.tsx              # Landing page
└── layout.tsx            # Root layout with fonts and analytics
```

### Key Files

**`app/api/chat/route.ts`**: Route handler that streams responses from Zhipu AI's GLM-4-Flash model. Uses the Vercel AI SDK's `streamText()` with a custom system prompt defining the AI's persona as a Zen meditation teacher.

**`components/chat-interface.tsx`**: Client component using `useChat` hook from `@ai-sdk/react`. Manages conversation state, message rendering, and streaming indicators. Initial welcome message sets the spiritual tone.

**`components/ui/`**: Radix UI components (50+ components) that are unstyled primitives wrapped with Tailwind classes. These are building blocks, not feature-complete components.

**`lib/utils.ts`**: Contains the `cn()` utility for merging Tailwind classes using `clsx`, `tailwind-merge`, and `class-variance-authority`.

### AI Integration

The chat system uses a streaming architecture:

1. **Client** (`chat-interface.tsx`): Uses `useChat` hook with `DefaultChatTransport` pointing to `/api/chat`
2. **Server** (`api/chat/route.ts`): Converts UI messages to model messages, adds system prompt, calls `streamText()` with Zhipu AI
3. **Streaming**: Real-time response streaming with typing indicators and error handling

**System Prompt**: The AI is configured as "空寂" - gentle, firm, minimal, using Buddhist/Zen metaphors (water, clouds, mirrors, moon). Non-judgmental, heuristic dialogue approach. Responses in English.

### Styling System

**CSS Variables**: Theme tokens defined in `styles/globals.css` using OKLCH color space for better perceptual uniformity. Supports light/dark modes via `.dark` class.

**Tailwind CSS v4**: Uses new `@import 'tailwindcss'` syntax with inline `@theme` configuration. Custom variant for dark mode: `@custom-variant dark (&:is(.dark *))`.

**Typography**:
- Sans: Inter (Google Font) - variable: `--font-sans`
- Serif: Crimson Text (Google Font) - variable: `--font-serif`
- Mono: Geist Mono (system)

**Path Alias**: `@/*` maps to project root (configured in `tsconfig.json`)

### Component Patterns

1. **UI Components** (`components/ui/`): Radix UI primitives with:
   - `data-[state]` variants for Radix states
   - `class-variance-authority` for variant-based styling
   - Forward refs for composition
   - Consistent border radius from `--radius` CSS variable

2. **Page Components**: Feature-specific components in `components/` root
   - Client components marked with `"use client"`
   - Server components by default (Next.js App Router)

3. **Styling Pattern**: Use `cn()` utility to merge classes:
   ```tsx
   className={cn("base-classes", condition && "conditional-classes", className)}
   ```

## Configuration Notes

**TypeScript**: Strict mode enabled, target ES6, module resolution "bundler". Next.js plugin integrated for optimized type checking.

**Next.js Config** (`next.config.mjs`): Minimal configuration, App Router enabled by default in Next.js 16.

**Environment Variables**:
- `ZHIPU_API_KEY`: Currently hardcoded in `app/api/chat/route.ts` (line 38) - should be moved to environment variables for security.

## State Management

- **Chat State**: `useChat` hook manages messages, input, status (ready/streaming/error)
- **Theme**: `next-themes` for dark/light mode (not yet implemented in UI)
- **Form State**: React Hook Form for complex forms (if needed)
- **Local State**: React `useState` for component-specific state

## Build & Deployment

- **Analytics**: Vercel Analytics integrated in root layout
- **Max Duration**: API routes have 30-second timeout (`export const maxDuration = 30`)
- **Streaming**: Responses use SSE (Server-Sent Events) for real-time streaming

## Important Constraints

1. **API Key Security**: The Zhipu AI API key is currently hardcoded. Move to `process.env.ZHIPU_API_KEY` before deploying.
2. **No Persistence**: Conversations are not saved - refresh loses all messages.
3. **No Authentication**: Currently open access, no user accounts.
4. **Medical Disclaimer**: System prompt includes constraint to redirect mental health crises to professional help.
