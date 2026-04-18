/**
 * Minimal PII scrubber for Sentry events. Wired into `beforeSend` so local
 * log.warn/log.error → Sentry.captureMessage forwards don't leak user emails,
 * tokens, Stripe keys, Clerk session IDs, etc.
 *
 * Kept deliberately simple: a list of regexes and a list of key names. If
 * something slips through, add a rule here rather than editing call sites.
 */

import type { ErrorEvent } from "@sentry/nextjs";

// Regexes run against ANY string value in the event (message, breadcrumbs,
// extra.*). Matches are replaced with a redaction tag.
const REDACTORS: Array<[RegExp, string]> = [
  // Bearer tokens, API keys
  [/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [REDACTED]"],
  [/sk-[A-Za-z0-9\-_]{20,}/g, "[REDACTED_API_KEY]"],
  [/sk_(?:live|test)_[A-Za-z0-9]{20,}/g, "[REDACTED_STRIPE_KEY]"],
  [/rk_(?:live|test)_[A-Za-z0-9]{20,}/g, "[REDACTED_STRIPE_KEY]"],
  [/whsec_[A-Za-z0-9]{20,}/g, "[REDACTED_WEBHOOK_SECRET]"],
  [/pk_(?:live|test)_[A-Za-z0-9]{20,}/g, "[REDACTED_CLERK_PK]"],
  // Clerk session / user IDs (keep prefix, redact body for correlation)
  [/(user_|sess_)[A-Za-z0-9]{8,}/g, "$1[REDACTED]"],
  // Email addresses
  [/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]"],
  // Postgres connection strings
  [/postgres(?:ql)?:\/\/[^\s'"]+/g, "[REDACTED_DB_URL]"],
  // IPv4 (coarse — trims last octet)
  [/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}\b/g, "$10"],
];

// Keys whose value we always drop entirely (case-insensitive).
const DROPPED_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "api-key",
  "apikey",
  "x-api-key",
  "anthropic-api-key",
  "stripe-signature",
]);

function redactString(s: string): string {
  let out = s;
  for (const [re, rep] of REDACTORS) out = out.replace(re, rep);
  return out;
}

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[TRUNCATED_DEPTH]";
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (DROPPED_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
      continue;
    }
    out[k] = scrub(v, depth + 1);
  }
  return out;
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) event.message = redactString(event.message);
  if (event.extra) event.extra = scrub(event.extra) as typeof event.extra;
  if (event.tags) event.tags = scrub(event.tags) as typeof event.tags;
  if (event.contexts) {
    event.contexts = scrub(event.contexts) as typeof event.contexts;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (b.message) b.message = redactString(b.message);
      if (b.data) b.data = scrub(b.data) as typeof b.data;
      return b;
    });
  }
  if (event.request?.headers) {
    event.request.headers = scrub(
      event.request.headers
    ) as typeof event.request.headers;
  }
  // We never want the user's IP in Sentry even if Sentry auto-captured it.
  if (event.user) {
    delete event.user.ip_address;
    delete event.user.email;
  }
  return event;
}
