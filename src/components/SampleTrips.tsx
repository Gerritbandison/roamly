"use client";

import Image from "next/image";
import type { TripFormData } from "@/types/itinerary";

const SAMPLE_TRIPS = [
  {
    destination: "Lisbon, Portugal",
    days: 5,
    vibe: "Culture & Food",
    img: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop&q=80",
    tag: "Trams & Pastéis",
  },
  {
    destination: "Bali, Indonesia",
    days: 10,
    vibe: "Beaches & Adventure",
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop&q=80",
    tag: "Temples & Rice Fields",
  },
  {
    destination: "Tokyo, Japan",
    days: 7,
    vibe: "Culture & Food",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop&q=80",
    tag: "Ramen & Neon",
  },
  {
    destination: "Patagonia, Argentina",
    days: 12,
    vibe: "Adventure",
    img: "https://images.unsplash.com/photo-1531794330-2e0c5f4f2c4f?w=600&h=400&fit=crop&q=80",
    tag: "Glaciers & Trails",
  },
  {
    destination: "Morocco",
    days: 8,
    vibe: "Off the Beaten Path",
    img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&h=400&fit=crop&q=80",
    tag: "Souks & Sahara",
  },
  {
    destination: "Iceland",
    days: 6,
    vibe: "Adventure & Nature",
    img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&h=400&fit=crop&q=80",
    tag: "Waterfalls & Hot Springs",
  },
];

/* ── Small icon components ─────────────────── */
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface SampleTripsProps {
  onSelect: (form: Partial<TripFormData>) => void;
}

export default function SampleTrips({ onSelect }: SampleTripsProps) {
  const useSample = (s: (typeof SAMPLE_TRIPS)[0]) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + s.days - 1);
    onSelect({
      destination: s.destination,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      travelers: 2,
      budget: "mid-range",
      interests: s.vibe,
    });
    window.scrollTo({ top: document.getElementById("plan-form")?.offsetTop ?? 400, behavior: "smooth" });
  };

  return (
    <section className="px-4 md:px-8 pb-16 -mt-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <SparkleIcon />
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)] font-medium">Popular Destinations</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {SAMPLE_TRIPS.map((s, i) => (
            <button
              key={s.destination}
              onClick={() => useSample(s)}
              className={`group relative overflow-hidden rounded-2xl border border-[var(--sand)]/50 text-left transition-all hover:shadow-xl hover:border-[var(--amber)]/40 hover:-translate-y-0.5 animate-fade-up ${
                i < 2 ? "aspect-[4/3] md:aspect-[3/2]" : "aspect-[4/3]"
              }`}
            >
              <Image
                src={s.img}
                alt={s.destination}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,18,8,0.85)] via-[rgba(26,18,8,0.2)] to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--amber)] font-medium mb-1">{s.tag}</p>
                <h3 className="font-[family-name:var(--font-playfair)] text-white text-base md:text-lg font-bold leading-tight">{s.destination}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[0.65rem] text-white/60">
                    <CalendarIcon /> {s.days} days
                  </span>
                  <span className="flex items-center gap-1 text-[0.65rem] text-white/60">
                    <MapPinIcon /> {s.vibe}
                  </span>
                </div>
              </div>

              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
