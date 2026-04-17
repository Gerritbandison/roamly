import * as Sentry from "@sentry/nextjs";

// Client-side Sentry initialization. Loaded by Next.js on every page when
// NEXT_PUBLIC_SENTRY_DSN is present.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    tracesSampleRate: 0.1,
    // Session replay is expensive; leave off by default.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
