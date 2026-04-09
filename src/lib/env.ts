/**
 * Typed env accessor with lazy validation.
 * Required vars throw at *access time* (first request), not at module load,
 * so Next.js static analysis / build passes even without .env.local.
 * On Vercel, vars must be configured in Project Settings → Environment Variables.
 */

function required(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
        `Add it to .env.local (dev) or Vercel Environment Variables (prod).`
    );
  }
  return v;
}

export const env = {
  get ANTHROPIC_API_KEY() { return required("ANTHROPIC_API_KEY"); },
  // Optional — features degrade gracefully when absent
  get OPENWEATHER_API_KEY() { return process.env.OPENWEATHER_API_KEY ?? null; },
  get EXCHANGE_RATE_API_KEY() { return process.env.EXCHANGE_RATE_API_KEY ?? null; },
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY ?? null; },
  get NEXT_PUBLIC_URL() { return process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app"; },
} as const;
