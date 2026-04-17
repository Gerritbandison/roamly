import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/sign-in`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/sign-up`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];
}
