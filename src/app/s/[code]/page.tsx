import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSharedTrip } from "@/lib/db/queries";
import SharedTripView from "./SharedTripView";
import type { Trip } from "@/types/itinerary";

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;

  let title = "Shared Trip — Roamly";
  let description = "Check out this AI-generated travel itinerary on Roamly.";

  try {
    const shared = await getSharedTrip(code);
    if (shared) {
      title = `${shared.destination} — ${shared.durationDays} Day Trip | Roamly`;
      description = `Explore a ${shared.durationDays}-day ${shared.budget} itinerary for ${shared.destination}, planned by AI.`;
    }
  } catch {
    // DB not connected yet — use defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Roamly",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
