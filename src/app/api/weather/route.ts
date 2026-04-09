import { NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  city: z.string().max(100).optional(),
});

// Simple in-process cache (30-min TTL) to stay within free-tier call limits
const cache = new Map<string, { data: unknown; expires: number }>();

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const rl = rateLimit(`weather:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    city: searchParams.get("city") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid params" },
      { status: 400 }
    );
  }

  const { lat, lng, city } = parsed.data;
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return Response.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  }

  if (!env.OPENWEATHER_API_KEY) {
    // Return a graceful fallback when the API key isn't configured
    return Response.json(
      {
        unavailable: true,
        message: "Weather data requires OPENWEATHER_API_KEY",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("units", "metric");
    url.searchParams.set("cnt", "24"); // 3 days × 8 slots
    url.searchParams.set("appid", env.OPENWEATHER_API_KEY);

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // 30-min Next.js cache
    });

    if (!res.ok) {
      throw new Error(`OpenWeatherMap ${res.status}`);
    }

    const raw = await res.json();

    // Summarise into daily high/low/condition for the next 3 days
    const byDay: Record<
      string,
      { temps: number[]; icons: string[]; descs: string[] }
    > = {};

    for (const item of raw.list ?? []) {
      const date = item.dt_txt?.split(" ")[0];
      if (!date) continue;
      if (!byDay[date]) byDay[date] = { temps: [], icons: [], descs: [] };
      byDay[date].temps.push(item.main.temp);
      byDay[date].icons.push(item.weather[0]?.icon ?? "01d");
      byDay[date].descs.push(item.weather[0]?.description ?? "");
    }

    const days = Object.entries(byDay)
      .slice(0, 3)
      .map(([date, d]) => ({
        date,
        high: Math.round(Math.max(...d.temps)),
        low: Math.round(Math.min(...d.temps)),
        icon: d.icons[Math.floor(d.icons.length / 2)] ?? "01d",
        description: d.descs[Math.floor(d.descs.length / 2)] ?? "",
      }));

    const result = { city: city ?? raw.city?.name ?? "Unknown", days };
    cache.set(cacheKey, { data: result, expires: Date.now() + 30 * 60 * 1000 });

    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    log.error("weather_fetch_error", {
      error: err instanceof Error ? err.message : String(err),
      lat,
      lng,
    });
    return Response.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }
}
