import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Only list publicly indexable URLs. /sign-in, /sign-up, /history, and
  // /itinerary are disallowed in robots.ts — including them here would be
  // a mixed signal to crawlers.
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];
}
