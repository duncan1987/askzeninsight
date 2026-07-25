# AGENTS.md

## Commands

```bash
pnpm dev          # dev server (Windows: if Node not in PATH, use start-dev.bat or node_modules/next/dist/bin/next dev)
pnpm build        # production build (note: next.config.mjs has ignoreBuildErrors:true for TS)
pnpm lint         # eslint
pnpm test         # jest (tests live in tests/; integration tests require dev server running)
pnpm test:watch   # jest --watch
```

Run a single test file: `pnpm test subscription-usage-limits.test.ts`

**Windows gotcha**: Node.js may not be in PATH. Batch files (`start-dev.bat`, `run-tests.bat`, `start-dev-test.bat`) handle this. The test runner also loads `.env.local` manually.

## Architecture

**Ask Zen Insight** — Next.js 16 (App Router) + React 19 AI spiritual guidance app.

### Core flow

1. **Chat**: Client (`components/chat-interface.tsx`) → `POST /api/chat` → Zhipu AI GLM-5 (OpenAI-compatible SSE streaming, NOT Vercel AI SDK streaming)
2. **Auth**: Supabase Auth (SSR cookies). Three Supabase clients in `lib/supabase/`:
   - `server.ts` — server components (cookies-based, returns `null` if unconfigured)
   - `client.ts` — browser client
   - `admin.ts` — service role key, bypasses RLS (used in API routes)
3. **Payments**: Creem (not Stripe). Webhook at `/api/creem/webhook`. Config in `lib/creem.ts`.
4. **Usage limits**: `lib/usage-limits.ts` — daily message caps per tier, tracked in `usage_records` table. Counting is tier+subscription_id aware (counter resets on plan change).

### Tiers & models

| Tier | Daily limit | Model | API key env var | Save history |
|------|------------|-------|-----------------|-------------|
| Anonymous | 10 | glm-5 | `ZHIPU_API_FREE` | No |
| Free (authed) | 10 | glm-5 | `ZHIPU_API_FREE` | No |
| Pro | 30 | glm-5 | `ZHIPU_API_KEY` | Yes |

Pro users exceeding premium quota get downgraded to basic model mid-day (fair use policy).

### Key directories

- `app/api/` — API routes (chat, auth, creem, cron, conversations, usage, etc.)
- `components/ui/` — shadcn/ui primitives (Radix + Tailwind). Style: "new-york", icon lib: lucide. Add components via shadcn CLI.
- `components/auth/` — Supabase auth UI components
- `content/blog/` — MDX blog posts (processed by `next-mdx-remote`)
- `lib/` — business logic (subscription, usage-limits, creem, email, site config, sensitive-keywords)
- `supabase/` — SQL schema and migrations
- `tests/` — Jest integration tests (require running dev server + Supabase)

## Conventions

- **Path alias**: `@/*` → project root
- **Styling**: Tailwind v4 with OKLCH color space, CSS variables in `styles/globals.css`. Dark mode via `.dark` class. Use `cn()` from `lib/utils.ts` for class merging.
- **Fonts**: Inter (sans, `--font-sans`), Crimson Text (serif, `--font-serif`), Geist Mono
- **UI components**: shadcn/ui (new-york style). Use `data-[state=...]` variants for Radix states.
- **Client components**: must have `"use client"` directive. Server components are default.
- **`import 'server-only'`**: used in server-only libs (`lib/creem.ts`, `lib/site.ts`)
- **Middleware** (`middleware.ts`): currently passes through all requests (auth disabled)

## Testing

- Jest + ts-jest, test env: node, test match: `tests/**/*.test.[jt]s?(x)`
- Tests are **integration tests** hitting real API routes — dev server must be running
- `jest.setup.js` provides fallback env vars for tests
- Test helpers in `tests/helpers/auth.ts` (createUser, deleteUser, signIn)

## Env vars

Copy `.env.example` to `.env.local`. Key vars:

- `ZHIPU_API_KEY` / `ZHIPU_API_FREE` — Zhipu AI keys (free vs paid model)
- `AI_API_URL` — Zhipu API endpoint (defaults to `https://open.bigmodel.cn/api/paas/v4/chat/completions`)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (bypasses RLS)
- `CREEM_*` — Creem payment config (API key, webhook secret, product IDs, payment links)
- `RESEND_API_KEY` — email via Resend
- `CRON_SECRET` / `ADMIN_SECRET_KEY` — protect cron and admin endpoints

## Gotchas

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` — `pnpm build` won't catch TS errors. Run editor/IDE type checking separately.
- The chat route (`app/api/chat/route.ts`) does **not** use Vercel AI SDK's `streamText()` — it calls Zhipu's OpenAI-compatible endpoint directly with `fetch` and manually transforms SSE to plain text streaming.
- `middleware.ts` auth is disabled (passes through all requests).
- `components.json` is shadcn/ui config. Run `npx shadcn@latest add <component>` to add UI primitives.
- Subscription `refund_status` field enables staged downgrade: `requested` keeps Pro access during 3-day review; `approved`/`rejected` triggers downgrade.
