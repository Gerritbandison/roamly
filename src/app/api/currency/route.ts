import { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

// Frankfurter.app — free, no API key needed
const FRANKFURTER = "https://api.frankfurter.app/latest?from=USD";

const SUPPORTED = [
  "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR",
  "MXN", "BRL", "THB", "SGD", "NOK", "SEK", "DKK", "PLN",
  "CZK", "HUF", "RON", "TRY", "ZAR", "AED", "HKD", "KRW",
] as const;

const QuerySchema = z.object({
  to: z.string().toUpperCase().refine(
    (v) => SUPPORTED.includes(v as (typeof SUPPORTED)[number]),
    { message: "Unsupported currency" }
  ).optional(),
});

// Cache rates for 6 hours
let ratesCache: { rates: Record<string, number>; expires: number } | null = null;

async function getRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() < ratesCache.expires) return ratesCache.rates;

  const res = await fetch(FRANKFURTER, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const data = await res.json();
  const rates = data.rates as Record<string, number>;
  ratesCache = { rates, expires: Date.now() + 6 * 60 * 60 * 1000 };
  return rates;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const rl = rateLimit(`currency:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = QuerySchema.safeParse({
    to: req.nextUrl.searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid params" },
      { status: 400 }
    );
  }

  try {
    const rates = await getRates();
    const { to } = parsed.data;
    const result = to
      ? { from: "USD", to, rate: rates[to] ?? null }
      : { from: "USD", rates, supported: SUPPORTED };

    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=21600" },
    });
  } catch (err) {
    log.error("currency_fetch_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json(
      { error: "Failed to fetch exchange rates" },
      { status: 502 }
    );
  }
}
