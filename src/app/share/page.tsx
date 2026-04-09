import type { Metadata } from "next";
import ShareContent from "@/components/ShareContent";

// ── Dynamic OG meta tags from URL search params ──────────
// Share URL format: /share?dest=Paris&days=7&budget=mid-range#[compressed_data]
// The server reads the query params; the client reads the hash for full trip data.

type Props = {
  searchParams: Promise<{ dest?: string; days?: string; budget?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const dest = p.dest?.slice(0, 80) ?? "A Trip";
  const days = p.days ? `${p.days}-day ` : "";
  const budget = p.budget ? ` · ${p.budget}` : "";

  const title = `${dest} — ${days}Itinerary on Roamly`;
  const description = `Check out this AI-planned ${days}trip to ${dest}${budget}. Day-by-day itinerary with local tips, dining, and budget breakdowns — built with Roamly.`;
  const ogImage =
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=630&fit=crop&q=80";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Roamly",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function SharePage() {
  return <ShareContent />;
}
