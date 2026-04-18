import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSharedTrip } from "@/lib/db/queries";
import SharedTripView from "./SharedTripView";
import type { Trip } from "@/types/itinerary";
import { heroImageFor } from "@/lib/destinationImages";

type PageProps = { params: Promise<{ code: string }> };

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;

  let title = "Shared Trip — Roamly";
  let description = "Check out this AI-generated travel itinerary on Roamly.";
  let image = heroImageFor("", { width: 1200, height: 630 });

  try {
    const shared = await getSharedTrip(code);
    if (shared) {
      title = `${shared.destination} · ${shared.durationDays}-day ${shared.budget} itinerary — Roamly`;
      description = `A day-by-day ${shared.durationDays}-day ${shared.budget} trip to ${shared.destination}, planned by AI. Real places, real prices, local tips.`;
      image = heroImageFor(shared.destination, { width: 1200, height: 630 });
    }
  } catch {
    // DB not connected yet — fall through to defaults.
  }

  const canonical = `${BASE_URL}/s/${code}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Roamly",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedTripPage({ params }: PageProps) {
  const { code } = await params;

  let shared;
  try {
    shared = await getSharedTrip(code);
  } catch {
    // DB not connected — show a helpful message
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--ink)] mb-3">
            Roam<span className="italic text-[var(--amber)]">ly</span>
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Shared trips require a database connection. This feature will be available soon.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition"
          >
            Plan Your Own Trip
          </Link>
        </div>
      </div>
    );
  }

  if (!shared) notFound();

  const tripData = shared.tripData as unknown as Trip;

  return <SharedTripView trip={tripData} code={code} views={shared.views ?? 0} />;
}
