# Code review — improvement backlog

Prioritized list of issues found while reviewing the repo on branch `claude/review-code-dependencies-WA494`. Findings verified against source.

## High priority

### 1. `/api/budget-optimizer` and `/api/packing-list` bypass free-tier usage limits
- `src/app/api/budget-optimizer/route.ts:13-35` and `src/app/api/packing-list/route.ts:13-31` call `auth()` but never call `checkUsageLimit` / `trackUsage`, unlike `/generate`, `/chat`, `/regenerate-day`.
- Free users can call these AI endpoints without bound — both burn Claude tokens per request.
- **Fix:** mirror the `/generate` pattern: call `checkUsageLimit(userId, "<action>")` before the AI call (return `429 USAGE_LIMIT` if blocked) and `trackUsage(userId, "<action>")` after success. Register the two new actions in `src/lib/usage.ts` (`FREE_LIMITS`) and surface them in `/api/usage`.

### 2. No rate limiting on AI endpoints
- `rateLimit` is only wired up on `/api/weather`, `/api/currency`, and `/api/email` (`src/lib/rateLimit.ts` consumers).
- `/api/generate`, `/api/chat`, `/api/regenerate-day`, `/api/budget-optimizer`, `/api/packing-list` rely solely on Clerk auth + monthly usage — a compromised account or a logged-in abuser can burst all their monthly quota in seconds.
- **Fix:** add a per-userId burst limiter (e.g. `rateLimit(\`ai:${userId}\`, 10, 60_000)`) at the top of each AI route.

### 3. `tripData` is written to Postgres without validation
- `src/lib/db/queries.ts:77,123` casts `tripData as unknown as Record<string, unknown>` before insert/update.
- If the Claude response or client payload is malformed, garbage is persisted and the itinerary page will crash when it re-reads.
- **Fix:** define a Zod schema for `Trip` (the type already lives in `src/types/itinerary.ts`) and `.parse()` before the DB call; reject with 400 on failure.

## Medium priority

### 4. CORS allowlist treats a missing `Origin` header as trusted
- `src/proxy.ts:30` — `if (!origin) return true`. Same-origin browser requests don't send `Origin`, but neither do many server-side / scripted clients.
- **Fix:** return `false` for a missing origin on `/api/*`; only the preflight / browser requests should be matched here, and they always send `Origin`.

### 5. `destination` user input is interpolated directly into the Claude system prompt
- `src/app/api/generate/route.ts:65-71` splits on `→` / `->` and substitutes the raw strings into `multiCityRules`.
- Prompt injection risk is limited (Claude follows the framing), but a malicious user can still poison the itinerary or exfiltrate the system prompt.
- **Fix:** validate `destination` with a whitelist regex (`/^[\p{L}\p{M}\s,\-→]+$/u`) and cap the length (e.g. 120 chars).

### 6. `dayNumber` is not bounds-checked before regeneration
- `src/app/api/regenerate-day/route.ts` accepts `dayNumber` from the body and regenerates that day without checking it's within `trip.duration_days`.
- **Fix:** early return 400 when `dayNumber < 1 || dayNumber > trip.duration_days`.

### 7. Currency route double-caches
- `src/app/api/currency/route.ts:23-33` uses **both** an in-memory `ratesCache` (6h TTL) and Next's `fetch(..., { next: { revalidate: 21600 } })`.
- When the module is hot on a warm Vercel instance, the Map wins and the Next revalidate is effectively dead; when the instance is cold, Next caches again. The two can disagree.
- **Fix:** drop the Map and rely on Next's fetch cache — simpler and cross-instance consistent.

### 8. Fire-and-forget DB persists swallow errors
- `src/app/itinerary/page.tsx` — `persistToDb(...).catch(() => {})` hides DB failures; the user thinks the trip is saved when it isn't.
- **Fix:** surface via `log.error` and show a toast/banner so the user can retry.

### 9. `chat` history is not shape-validated
- `src/app/api/chat/route.ts:70-77` forwards client-supplied `history` items directly into the Claude `messages` array.
- **Fix:** validate with Zod (`z.array(z.object({ role: z.enum(['user','assistant']), content: z.string().max(10_000) }))`) and cap the history length.

### 10. Missing composite index for trip listings
- `src/lib/db/schema.ts:43-46` has separate `idx_trips_user_id` and `idx_trips_created_at`. `listTrips` filters on `userId` and orders by `createdAt DESC`, which wants a composite index.
- **Fix:** replace the two with `index("idx_trips_user_created").on(table.userId, table.createdAt.desc())` and drop the unused singletons.

### 11. Loose typing on AI-route payloads
- `src/app/api/budget-optimizer/route.ts:34-58` and `src/app/api/packing-list/route.ts:33-47` declare ad-hoc inline types for `trip.days`.
- **Fix:** import `Trip` from `src/types/itinerary.ts` and parse with Zod — eliminates duplicated field lists and catches schema drift.

## Low priority / cleanup

### 12. Unused state in history page
- `src/app/history/page.tsx:71` — `const [loading] = useState(false)` has no setter and is never read conditionally.
- **Fix:** delete the line.

### 13. `MigrationBanner` / `lib/migration.ts` may be dead
- Wired up (`src/app/page.tsx` → `MigrationBanner` → `lib/migration.ts`), but the migration it supports is a one-off localStorage → DB backfill. If the window has passed, both can go.
- **Fix:** verify deployment cutover, then delete both files and the banner render.

### 14. `pako` is only needed for legacy share URLs
- Only reference is `src/components/ShareContent.tsx:25-28`, inflating legacy share payloads.
- **Fix:** once legacy links have aged out, drop the dynamic import and remove `pako` + `@types/pako` from `package.json`.

### 15. Default `AI_MODEL` is stale
- `src/lib/env.ts:29` defaults to `claude-sonnet-4-20250514`. Current Claude model line is 4.7 / 4.6 / 4.5.
- **Fix:** bump the default (e.g. `claude-sonnet-4-6`) after a smoke-test pass; it's overridable via env.

### 16. `setInterval` in `rateLimit.ts` is never cleared
- `src/lib/rateLimit.ts:15-23` creates an unref'd 5-minute cleanup timer at module load. Harmless on Vercel but flags under Jest / local process reuse.
- **Fix:** guard with `if (process.env.NODE_ENV !== "test")` or use `setInterval(...).unref()`.

### 17. Stripe webhook leaks verification errors
- `src/app/api/stripe/webhook/route.ts` returns the raw Stripe error message on signature-verification failure.
- **Fix:** log the detail server-side, return a generic `{ error: "Invalid webhook" }` to the caller.

### 18. Decorative SVGs on the landing page lack `aria-hidden`
- `src/app/page.tsx` — the floating hero icons are read aloud by screen readers.
- **Fix:** add `aria-hidden="true"` on the purely decorative SVGs.

## Nice-to-haves (not bugs)

- **Progress estimation in `/api/generate`** is character-based (`days * 800`); switch to a time-based or token-based progress once Claude exposes streamed usage reliably.
- **Trip JSON** stored as a single `jsonb` blob (`src/lib/db/schema.ts:39`). Fine today; consider normalizing `days` into its own table if per-day queries become common.
- **`tsconfig.json`** targets `ES2017`; Next 16 / React 19 run on evergreen targets — bumping to `ES2022` simplifies downlevel transforms.

## Sanity-check results

- Every package declared in `package.json` is imported somewhere in `src/`. See `DEPENDENCIES.md` for the per-package mapping.
- No obvious SQL injection: all queries go through Drizzle's parameterized builder.
- Auth boundary on `/api/*` is enforced in `src/proxy.ts` (Clerk middleware) plus per-route `auth()` checks; recommend also adding `auth.protect()` in each protected route for defense in depth.
