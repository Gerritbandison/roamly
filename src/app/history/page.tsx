"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ── Types ──────────────────────────────────────────── */
interface HistoryEntry {
  id: string;
  destination: string;
  days?: number;
  duration?: number;
  budget: string;
  createdAt: string;
}

/* ── Destination images ──────────────────────────────── */
const DEST_IMAGES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=75",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=75",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=75",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=75",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=75",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=75",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=75",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=75",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=75",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=75",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=75",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=75",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=75",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=75",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=75",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=75",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=75",
};
const FALLBACK = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=75";

function getImage(dest: string): string {
  const key = dest.toLowerCase();
  for (const [k, v] of Object.entries(DEST_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return FALLBACK;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Page ────────────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("roamly_history");
      if (raw) {
        setEntries(JSON.parse(raw));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const handleOpen = (id: string) => {
    router.push(`/itinerary?id=${id}`);
  };

  const handleDelete = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem("roamly_history", JSON.stringify(next));
    localStorage.removeItem(`roamly_trip_${id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--sand)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl bg-[var(--sand)]/40 text-[var(--muted)] hover:text-[var(--ink)] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--ink)]">
                Your Trips
              </h1>
              <p className="text-[0.65rem] text-[var(--muted)]">
                {entries.length} {entries.length === 1 ? "itinerary" : "itineraries"} saved
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Trip
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-[var(--sand)]/30 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🗺️</div>
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--ink)]">
              No trips yet
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-xs mx-auto">
              Plan your first trip and it&apos;ll show up here for easy access later.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 px-6 py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition"
            >
              Plan a Trip
            </button>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group bg-white rounded-2xl border border-[var(--sand)] overflow-hidden hover:border-[var(--amber)]/40 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpen(entry.id)}
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="relative w-28 h-24 flex-shrink-0">
                    <Image
                      src={getImage(entry.destination)}
                      alt={entry.destination}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--ink)] truncate">
                        {entry.destination}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--muted)]">
                          {entry.days || entry.duration || "?"} days
                        </span>
                        <span className="text-xs text-[var(--muted)]">·</span>
                        <span className="text-xs text-[var(--amber)] font-medium">
                          {entry.budget}
                        </span>
                      </div>
                    </div>
                    <span className="text-[0.6rem] text-[var(--muted)]">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center justify-center pr-3 gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen(entry.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] transition"
                      title="Open trip"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition"
                      title="Delete trip"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
