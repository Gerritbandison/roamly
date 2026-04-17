/**
 * Rate limiter with pluggable backend.
 *
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses
 *   Upstash REST (works across Vercel instances and serverless cold starts).
 * - Otherwise falls back to an in-process Map — useful for local dev but NOT
 *   safe in multi-instance production because each instance has its own
 *   counter. The fallback logs a one-time warning so this isn't silent.
 *
 * Algorithm: fixed-window counter. `INCR` the key; on first hit, set a TTL
 * equal to the window; reject once the counter exceeds `limit`.
 */

import { log } from "@/lib/logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

// ── Upstash REST backend ─────────────────────────────────────────────
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash<T>(command: (string | number)[]): Promise<T> {
  const res = await fetch(UPSTASH_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { result: T };
  return data.result;
}

async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  // INCR the counter. On the first hit the key didn't exist, so INCR returns
  // 1 — that's when we set the TTL. Subsequent hits just increment.
  const count = await upstash<number>(["INCR", key]);
  if (count === 1) {
    await upstash<string>(["EXPIRE", key, ttlSeconds]);
  }

  // Read the remaining TTL so callers can expose an accurate resetAt.
  const pttl = await upstash<number>(["PTTL", key]);
  const resetAt = Date.now() + (pttl > 0 ? pttl : windowMs);

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: Math.max(0, limit - count), resetAt };
}

// ── In-memory fallback ───────────────────────────────────────────────
interface Entry {
  count: number;
  reset: number;
}
const store = new Map<string, Entry>();

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.reset) store.delete(key);
    }
  },
  5 * 60 * 1000
).unref?.();

function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.reset };
  }
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.reset,
  };
}

// ── Public API ───────────────────────────────────────────────────────
let warnedFallback = false;
function warnFallbackOnce() {
  if (warnedFallback) return;
  warnedFallback = true;
  log.warn("rate_limit_inmemory_fallback", {
    message:
      "UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory rate limiter. " +
      "This is not safe across multiple serverless instances.",
  });
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await rateLimitUpstash(key, limit, windowMs);
    } catch (err) {
      // If Upstash is down, fail open rather than locking everyone out, but
      // log so we can react.
      log.error("rate_limit_upstash_error", {
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      return { allowed: true, remaining: limit - 1, resetAt: Date.now() + windowMs };
    }
  }
  warnFallbackOnce();
  return rateLimitInMemory(key, limit, windowMs);
}
