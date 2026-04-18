# Dependencies

Saved reference for the Roamly codebase. Generated via code review of `/src` against `package.json`.

Stack: **Next.js 16.2.2 · React 19.2.4 · TypeScript 5 · Tailwind 4**.

## Runtime dependencies

| Package | Version | Purpose | Used in |
|---|---|---|---|
| `@anthropic-ai/sdk` | ^0.81.0 | Claude API client (itinerary / chat / packing list / budget / regenerate-day) | `src/app/api/generate`, `chat`, `regenerate-day`, `packing-list`, `budget-optimizer` |
| `@clerk/nextjs` | ^7.0.12 | Auth (middleware, server `auth()`, client components) | `src/proxy.ts`, all protected API routes, `AuthButtons`, `UsageBadge`, layout |
| `@neondatabase/serverless` | ^1.0.2 | HTTP driver for Neon Postgres | `src/lib/db/index.ts` |
| `@vercel/analytics` | ^2.0.1 | Page-view / event analytics | `src/app/layout.tsx` |
| `drizzle-orm` | ^0.45.2 | Typed ORM + schema definition | `src/lib/db/{schema,queries,index}.ts`, `src/app/api/stripe/webhook` |
| `html2canvas` | ^1.4.1 | Render trip summary card to PNG (dynamic import) | `src/components/TripSummaryCard.tsx` |
| `leaflet` | ^1.9.4 | Map rendering primitives + CSS | `src/components/TripMap.tsx` |
| `nanoid` | ^5.1.7 | Generate 8-char share codes | `src/app/api/trips/[id]/share/route.ts` |
| `next` | 16.2.2 | Framework (app router, `proxy.ts` middleware, route handlers) | global |
| `pako` | ^2.1.0 | Inflate legacy gzipped share payloads (dynamic import) | `src/components/ShareContent.tsx` |
| `react` | 19.2.4 | UI runtime | global |
| `react-dom` | 19.2.4 | DOM renderer | global |
| `react-leaflet` | ^5.0.0 | React bindings for Leaflet | `src/components/TripMap.tsx` |
| `stripe` | ^22.0.1 | Billing (checkout, portal, webhook) | `src/app/api/stripe/{checkout,portal,webhook}/route.ts` |

## Dev dependencies

| Package | Version | Purpose |
|---|---|---|
| `@tailwindcss/postcss` | ^4 | Tailwind v4 PostCSS integration |
| `tailwindcss` | ^4 | CSS framework (utility classes used in `globals.css` / components) |
| `@types/leaflet` | ^1.9.21 | Leaflet types |
| `@types/node` | ^20 | Node types |
| `@types/pako` | ^2.0.4 | pako types |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `drizzle-kit` | ^0.31.10 | Migrations / schema sync (via `drizzle.config.ts`) |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.2 | Next.js lint preset |
| `typescript` | ^5 | Compiler |

## Usage verification

Every declared runtime dependency has at least one import or dynamic import. No unused packages found. (`pako` and `html2canvas` are lazily imported — easy to miss with a plain grep; both confirmed in use.)

## Environment variables

| Var | Required | Consumer |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | all AI routes |
| `DATABASE_URL` | yes | `src/lib/db/index.ts` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | Clerk client |
| `CLERK_SECRET_KEY` | yes | Clerk server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | yes | Clerk redirects |
| `OPENWEATHER_API_KEY` | optional | `src/app/api/weather/route.ts` |
| `EXCHANGE_RATE_API_KEY` | optional | `src/app/api/currency/route.ts` |
| `RESEND_API_KEY` | optional | `src/app/api/email/route.ts` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` | optional | `src/app/api/stripe/*` |
| `AI_MODEL` | optional (default `claude-sonnet-4-20250514`) | AI routes via `env.ts` |
| `NEXT_PUBLIC_URL` | optional | `src/proxy.ts` (CORS allowlist), share links |

## Notes for future work

- `AI_MODEL` default is `claude-sonnet-4-20250514`. Latest generally-available Claude models are Opus 4.7 / Sonnet 4.6 / Haiku 4.5 — consider bumping.
- `drizzle-orm` 0.45 is behind the current 0.x line; schema uses the array-returning callback form (Drizzle ≥ 0.36).
- `@clerk/nextjs` v7 is the current major; middleware file is named `src/proxy.ts` per Next.js 16's new convention (not `middleware.ts`).
- `pako` is only needed for backwards-compat with legacy share URLs. If those URLs have expired / migrated, the dependency can be dropped.
