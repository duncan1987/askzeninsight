# i18n & Auth (Logto/WeChat) Implementation Progress

Last updated: 2026-08-10 (Session 3: All i18n phases complete)

---

## Part 1: Internationalization (i18n)

### Infrastructure - COMPLETE

| Item | Status | Details |
|------|--------|---------|
| next-intl setup | DONE | `createNextIntlPlugin` in `next.config.mjs` |
| Routing config | DONE | `i18n/routing.ts` — locales: `en`, `zh`; default: `en`; prefix: `never` |
| Request config | DONE | `i18n/request.ts` — reads `NEXT_LOCALE` cookie, loads messages |
| Navigation utils | DONE | `i18n/navigation.ts` — `Link`, `redirect`, `usePathname`, `useRouter` |
| Middleware | DONE | `middleware.ts` — locale detection, skips `/api/`, `/_next/`, `/auth/callback` |
| Layout integration | DONE | `app/layout.tsx` — `<NextIntlClientProvider>`, `<html lang={locale}>` |
| Language switcher | DONE | `components/language-switcher.tsx` — dropdown in header, labels use `t('english')`/`t('chinese')` |
| Translation files | DONE | `messages/en.json` + `messages/zh.json` — 34 namespaces each |
| Blog types | DONE | `lib/blog-types.ts` — pure types/constants (no `fs`), safe for client components |

### Namespace Coverage - 34/34 (keys in sync)

| # | Namespace | en | zh | Notes |
|---|-----------|:--:|:--:|-------|
| 1 | header | OK | OK | |
| 2 | hero | OK | OK | |
| 3 | zenWisdom | OK | OK | |
| 4 | features | OK | OK | |
| 5 | cta | OK | OK | |
| 6 | footer | OK | OK | |
| 7 | meditationCta | OK | OK | |
| 8 | blogPreview | OK | OK | |
| 9 | showcase | OK | OK | |
| 10 | testimonials | OK | OK | |
| 11 | faqSection | OK | OK | |
| 12 | chat | OK | OK | +16 MessageActions keys |
| 13 | auth | OK | OK | |
| 14 | pricing | OK | OK | |
| 15 | feedback | OK | OK | |
| 16 | subscription | OK | OK | |
| 17 | usage | OK | OK | |
| 18 | dataManagement | OK | OK | |
| 19 | cancelSubscription | OK | OK | |
| 20 | notification | OK | OK | |
| 21 | billing | OK | OK | |
| 22 | common | OK | OK | +2 keys: `english`, `chinese` |
| 23 | chatPage | OK | OK | |
| 24 | dashboard | OK | OK | |
| 25 | refundPage | OK | OK | |
| 26 | privacyPage | OK | OK | Headings only (by design) |
| 27 | termsPage | OK | OK | Headings only (by design) |
| 28 | contact | OK | OK | Fixed: en.json now has `refundPolicy`, `termsOfService` |
| 29 | faqPage | OK | OK | |
| 30 | meditation | OK | OK | `level1` expanded with week1/2/3 sub-namespaces |
| 31 | about | OK | OK | |
| 32 | blog | OK | OK | New namespace (22 keys) |
| 33 | share | OK | OK | New namespace (9 keys) |
| 34 | imageUpload | OK | OK | New namespace (8 keys) |

### Pages & Components i18n Status

#### Fully i18n'd

| Page/Component | Type | Namespaces |
|---------------|------|------------|
| Header | Server | `header` |
| HeroSection | Server | `hero` |
| ZenWisdomSection | Server | `zenWisdom` |
| FeaturesSection | Server | `features` |
| CtaSection | Server | `cta` |
| Footer | Server | `footer` |
| MeditationCtaSection | Server | `meditationCta` |
| BlogPreviewSection | Server | `blogPreview` |
| ShowcaseSection | Server | `showcase` |
| TestimonialsSection | Server | `testimonials` |
| FaqSection | Server | `faqSection` |
| About page | Server | `about` |
| Dashboard page | Server | `dashboard` |
| Terms page | Server | `termsPage` (headings only) |
| Privacy page | Server | `privacyPage` (headings only) |
| Contact page | Server | `contact` |
| Refund page | Server | `refundPage` |
| FAQ page | Server | `faqPage` |
| Pricing page | Server | `pricing`, `common` |
| Meditation landing page | Server | `meditation` |
| Meditation Level-1 page | Server | `meditation.level1` |
| Chat page | Server | `chatPage`, `common` |
| Blog listing page | Server | `blog` |
| Blog post page | Server | `blog` |
| Share page | Server | `share` |
| ChatInterface | Client | `chat` |
| FeedbackDialog | Client | `feedback` |
| UsageMeter | Client | `usage` |
| BillingPortalButton | Client | `billing` |
| CancelSubscriptionButton | Client | `cancelSubscription` |
| PricingCard | Client | `pricing` |
| DataManagementCard | Client | `dataManagement` |
| NotificationIcon | Client | `notification` |
| SubscriptionStatusCard | Client | `subscription` |
| UserMenu | Client | `common` |
| SubscriptionButton | Client | `auth` |
| SignOutButton | Client | `auth` |
| SignInButton | Client | `auth` |
| AuthErrorToast | Client | `auth` |
| LanguageSwitcher | Client | `common` |
| MessageActions | Client | `chat` |
| BlogCard | Client | `blog` |
| AuthorBio | Client | `blog` |
| RelatedPosts | Client | `blog` |
| TableOfContents | Client | `blog` |
| CategoryBadge | — | `blog-types` (pure data, no `fs`) |
| ShareCard | Client | `share` |
| ImageUpload | Client | `imageUpload` |
| API `/api/chat` | Route | Reads `NEXT_LOCALE` cookie for system prompts & crisis messages |

#### Remaining i18n Gaps (Low Priority)

| Page/Component | Severity | Notes |
|---------------|----------|-------|
| Page `<title>` / OG metadata | Low | Still hardcoded in page exports; requires locale-aware `generateMetadata` |
| Layout OG locale | Low | `app/layout.tsx` has `locale: "en_US"` hardcoded |
| `blogPreview` section | Low | Uses `blogPreview` namespace but Blog listing uses new `blog` namespace — may want to consolidate |

### Date Formatting

| Component | Status | Approach |
|-----------|--------|----------|
| Blog post page | DONE | `toLocaleDateString(undefined, ...)` — auto-follows browser locale |
| BlogCard | DONE | `toLocaleDateString(undefined, ...)` — auto-follows browser locale |
| ShareCard | DONE | `toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", ...)` — explicit locale |
| Dashboard | OK | `toLocaleDateString()` — browser default |
| ChatInterface | OK | `toLocaleDateString()` — browser default |
| Other components | OK | `toLocaleDateString()` — browser default |

---

## Part 2: Auth / Login Methods

### Supabase Google OAuth (en locale) - COMPLETE & WORKING

| Item | Status | File |
|------|--------|------|
| SignInButton (Google) | DONE | `components/auth/sign-in-button.tsx` |
| OAuth redirect | DONE | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Callback handler | DONE | `app/auth/callback/route.ts` |
| Profile creation | DONE | Upsert via service role in callback |
| Webhook backup | DONE | `app/api/auth/webhook/route.ts` (user.created events) |
| Session management | DONE | Supabase SSR cookies, checked everywhere |

### Logto / WeChat (zh locale) - COMPLETE

| Item | Status | File | Notes |
|------|--------|------|-------|
| SDK installed | DONE | `@logto/next` v4.2.10 | |
| Config | DONE | `lib/logto.ts` | Uses env vars + `LOGTO_WECHAT_CONNECTOR_ID` |
| SignIn route | DONE | `app/api/auth/logto/sign-in/route.ts` | |
| Callback route | DONE | `app/api/auth/logto/callback/route.ts` | Creates Supabase user + session via magiclink |
| SignOut route | DONE | `app/api/auth/logto/sign-out/route.ts` | Returns JSON (callable from client) |
| SignInButton (WeChat) | DONE | `components/auth/sign-in-button.tsx` | Uses `LOGTO_WECHAT_CONNECTOR_ID` for direct WeChat |
| SignOutButton | DONE | `components/auth/sign-out-button.tsx` | Clears both Supabase + Logto sessions on zh locale |
| Profile `logto_id` column | DONE | `supabase/schema.sql` | `logto_id TEXT UNIQUE` |
| Supabase user creation for Logto | DONE | callback route | `admin.createUser()` → valid `auth.users` UUID → FK satisfied |

### Auth Remaining Notes

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | LOW | Email linking edge case | Same email on both Google+Logto: linked via `logto_id` update, session uses magiclink for existing users |
| 2 | LOW | `signInWithGoogle` translation key unused in zh | Still unused by design |
| 3 | LOW | `ensureProfileExists` in `lib/supabase/profile.ts` | Only handles Supabase auth users — Logto users managed in callback |

### Implemented Solution: Logto→Supabase Session Bridge

**Architecture**: Logto callback (`/api/auth/logto/callback`) now performs:

1. **Handle Logto sign-in** — `handleSignIn(logtoConfig, searchParams)` extracts claims (`sub`, `email`, `name`, `picture`)
2. **User resolution** (3 paths):
   - **Existing by `logto_id`**: Update profile name/avatar, use existing Supabase UUID
   - **Existing by email**: Link `logto_id` to existing profile (Google→Logto merge)
   - **New user**: `supabase.auth.admin.createUser()` creates `auth.users` row → `profiles` upsert with valid UUID FK
3. **Session establishment**:
   - `supabase.auth.admin.generateLink({ type: 'magiclink', email })` generates OTP token
   - Extract `token_hash` from generated link
   - `ssrClient.auth.verifyOtp({ token_hash, type: 'magiclink' })` creates real session
   - SSR client sets auth cookies on the redirect response
4. **Redirect** to homepage with active Supabase session — entire app sees the user as authenticated

**Key design decisions**:
- No password set on Supabase users — they authenticate via Logto, not direct login
- Magic link flow works for both new and existing users (no password dependency)
- `@supabase/ssr` `createServerClient` handles cookie setting via response object
- SignOutButton conditionally calls Logto sign-out only for zh locale

---

## Overall Progress Summary

| Area | Status | Completion |
|------|--------|-----------|
| i18n Infrastructure | DONE | 100% |
| i18n Core Pages (home, pricing, chat, dashboard, etc.) | DONE | 100% |
| i18n Translation Files (34 namespaces) | DONE | 100% |
| i18n Blog Section | DONE | 100% |
| i18n Meditation Level-1 | DONE | 100% |
| i18n MessageActions | DONE | 100% |
| i18n Share Feature | DONE | 100% |
| i18n ImageUpload | DONE | 100% |
| i18n Date Formatting | DONE | 100% |
| i18n LanguageSwitcher Labels | DONE | 100% |
| i18n Contact Namespace Sync | DONE | 100% |
| Auth - Supabase Google OAuth | DONE | 100% |
| Auth - Logto/WeChat scaffolding | DONE | 100% |
| Auth - Logto→Supabase session bridge | DONE | 100% |
| Auth - SignOut clears both sessions | DONE | 100% |
| Auth - WeChat connectorId | DONE | 100% |

### Remaining Low-Priority Items

1. **[Low] Page metadata i18n** — `<title>`, OG metadata hardcoded in page exports; needs locale-aware `generateMetadata`
2. **[Low] Layout OG locale** — `app/layout.tsx` has `locale: "en_US"` hardcoded
3. **[Low] End-to-end testing of Logto/WeChat flow** — needs real WeChat + Logto instance to verify

### Architecture Changes (Session 3)

- **`lib/blog-types.ts`** — New file: pure types (`BlogPost`, `BlogPostMeta`), constants (`BLOG_CATEGORIES`), and `getCategoryName()` function. No `fs` dependency, safe for client component imports.
- **`lib/blog.ts`** — Re-exports types/constants from `blog-types`; only contains `fs`-dependent functions (server-only).
- **Blog sub-components** (`BlogCard`, `AuthorBio`, `RelatedPosts`) — Converted to client components with `useTranslations('blog')`.
- **ShareCard** — Converted to client component with `useTranslations('share')` + `useLocale()` for locale-aware date formatting.
