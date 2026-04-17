import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // User-specific or auth-gated surfaces should not show up in search
        // results (they're 401/404 for crawlers anyway, but be explicit).
        disallow: [
          "/api/",
          "/history",
          "/itinerary",
          "/sign-in",
          "/sign-up",
          "/share",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
