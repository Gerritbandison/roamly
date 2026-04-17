import * as Sentry from "@sentry/nextjs";

// Runs once per runtime (nodejs, edge) on boot. Kept conditional on SENTRY_DSN
// so local dev and environments that haven't configured Sentry stay silent.
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === "nodejs") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || "development",
      tracesSampleRate: 0.1,
    });
  } else if (runtime === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || "development",
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
