"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import DayCard from "@/components/DayCard";
import type { RegenerateModifier } from "@/components/DayCard";
import ChatDrawer from "@/components/ChatDrawer";
import PackingList from "@/components/PackingList";
import BudgetOptimizer from "@/components/BudgetOptimizer";
import TripSummaryCard from "@/components/TripSummaryCard";
import TripStats from "@/components/TripStats";
import WeatherInfo from "@/components/WeatherInfo";
import CopyItinerary from "@/components/CopyItinerary";
import FavoritesPanel, { useFavorites } from "@/components/Favorites";
import ItinerarySkeleton from "@/components/ItinerarySkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Trip, DayPlan } from "@/types/itinerary";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

/* ── Destination hero images (Unsplash) ────────────────── */
const DEST_IMAGES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&q=80",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=80",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1400&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1400&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=80",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1400&q=80",
  marrakech: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1400&q=80",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1400&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1400&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1400&q=80",
  "buenos aires": "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1400&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1400&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=80",
  "rio de janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=80",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1400&q=80",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1400&q=80",
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=80";

function getHeroImage(dest: string): string {
  const key = dest.toLowerCase();
  for (const [k, v] of Object.entries(DEST_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return FALLBACK_IMG;
}

/* ── Practical-info icons ──────────────────────────────── */
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const CoinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const TrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></svg>
);
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
);

function parseCost(s: string): number {
  const m = s.replace(/[~,]/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/* ── Edit Modal ──────────────────────────────────────── */
function EditModal({
  day,
  onSave,
  onCancel,
}: {
  day: DayPlan;
  onSave: (d: DayPlan) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DayPlan>({ ...day });
  const upd = (f: keyof DayPlan, v: string) =>
    setDraft((p) => ({ ...p, [f]: v }));
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[var(--sand)] w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-[var(--sand)] px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold">
            Day {day.day}: {day.theme}
          </h2>
          <button onClick={onCancel} className="text-[var(--muted)] hover:text-[var(--ink)] text-xl">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {(["theme", "morning", "afternoon", "evening", "tips"] as const).map(
            (f) => (
              <div key={f}>
                <label className="block text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-1.5 capitalize">
                  {f}
                </label>
                {f === "theme" ? (
                  <input
                    value={draft[f]}
                    onChange={(e) => upd(f, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-sm focus:outline-none focus:border-[var(--amber)] transition"
                  />
                ) : (
                  <textarea
                    value={draft[f]}
                    onChange={(e) => upd(f, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-sm focus:outline-none focus:border-[var(--amber)] transition resize-none"
                  />
                )}
              </div>
            )
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-[var(--sand)] px-6 py-4 flex gap-3 justify-end rounded-b-3xl">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-[var(--sand)] text-[var(--muted)] text-sm hover:border-[var(--ink)] transition">
            Cancel
          </button>
          <button onClick={() => onSave(draft)} className="px-5 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page (wrapped in Suspense for useSearchParams) ──── */
export default function ItineraryPage() {
  return (
    <Suspense fallback={<ItinerarySkeleton />}>
      <ItineraryContent />
    </Suspense>
  );
}

function ItineraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const favs = useFavorites(tripId || "default");
  const [activeDay, setActiveDay] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState("Link copied!");
  const [isPrinting, setIsPrinting] = useState(false);
  const dayStripRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Try sessionStorage (just generated)
    const session = sessionStorage.getItem("roamly_trip");
    if (session) {
      try {
        const data = JSON.parse(session);
        setTrip(data.trip);
        // Check if we have a trip ID from the URL or find it
        const urlId = searchParams.get("id");
        if (urlId) {
          setTripId(urlId);
        }
        return;
      } catch { /* fall through */ }
    }

    // 2. Try URL trip ID → localStorage
    const urlId = searchParams.get("id");
    if (urlId) {
      try {
        const stored = localStorage.getItem(`roamly_trip_${urlId}`);
        if (stored) {
          const data = JSON.parse(stored);
          setTrip(data.trip);
          setTripId(urlId);
          // Re-populate sessionStorage for consistency
          sessionStorage.setItem("roamly_trip", stored);
          return;
        }
      } catch { /* fall through */ }
    }

    // 3. Try most recent trip from history
    try {
      const history = localStorage.getItem("roamly_history");
      if (history) {
        const entries = JSON.parse(history);
        if (entries.length > 0) {
          const latest = entries[0];
          const stored = localStorage.getItem(`roamly_trip_${latest.id}`);
          if (stored) {
            const data = JSON.parse(stored);
            setTrip(data.trip);
            setTripId(latest.id);
            sessionStorage.setItem("roamly_trip", stored);
            // Update URL without full navigation
            window.history.replaceState(null, "", `/itinerary?id=${latest.id}`);
            return;
          }
        }
      }
    } catch { /* fall through */ }

    // 4. Nothing found — go home
    router.push("/");
  }, [router, searchParams]);

  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(v), 300);
  };

  const filteredDays = useMemo(() => {
    if (!trip) return [];
    if (!debouncedSearch.trim()) return trip.days;
    const q = debouncedSearch.toLowerCase();
    return trip.days.filter(
      (d) =>
        d.theme.toLowerCase().includes(q) ||
        d.morning.toLowerCase().includes(q) ||
        d.afternoon.toLowerCase().includes(q) ||
        d.evening.toLowerCase().includes(q) ||
        (d.region && d.region.toLowerCase().includes(q)) ||
        (d.food?.some((f) => f.name.toLowerCase().includes(q) || f.note.toLowerCase().includes(q))) ||
        d.locations.some((l) => l.name.toLowerCase().includes(q))
    );
  }, [trip, debouncedSearch]);

  const activeData = trip?.days.find((d) => d.day === activeDay);

  const cumulativeSpend = useMemo(() => {
    if (!trip) return 0;
    return trip.days.filter((d) => d.day <= activeDay).reduce((s, d) => {
      const t = d.costs?.find((c) => c.item.toLowerCase().includes("total"));
      return s + (t ? parseCost(t.cost) : 0);
    }, 0);
  }, [trip, activeDay]);

  const handleDayClick = useCallback((day: number) => {
    setActiveDay(day);
    setShowMap(false);
  }, []);

  const handleSaveDay = useCallback((updated: DayPlan) => {
    if (!trip) return;
    const days = trip.days.map((d) => (d.day === updated.day ? updated : d));
    const next = { ...trip, days };
    setTrip(next);
    const json = JSON.stringify({ trip: next });
    sessionStorage.setItem("roamly_trip", json);
    // Also persist to localStorage if we have a trip ID
    if (tripId) {
      localStorage.setItem(`roamly_trip_${tripId}`, json);
    }
    setEditingDay(null);
  }, [trip, tripId]);

  const handleShare = async () => {
    if (!trip) return;
    try {
      const pako = (await import("pako")).default;
      const json = JSON.stringify({ trip });
      const compressed = pako.deflate(new TextEncoder().encode(json));
      // Convert to base64 using btoa with binary string
      let binary = "";
      for (let i = 0; i < compressed.length; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      const encoded = btoa(binary);
      const url = `${window.location.origin}/share#${encoded}`;

      if (url.length < 8000) {
        // URL is short enough to share
        try {
          if (navigator.share) {
            await navigator.share({ title: `Roamly — ${trip.destination}`, url });
            return;
          }
        } catch { /* user cancelled share dialog */ }
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } else {
        // Trip too large even compressed — copy JSON as fallback
        await navigator.clipboard.writeText(json);
        setShareToastMessage("Trip data copied (too large for link)");
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch {
      // Compression failed — copy raw JSON
      try {
        await navigator.clipboard.writeText(JSON.stringify({ trip }));
        setShareToastMessage("Trip data copied");
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch { /* ignore */ }
    }
  };

  const handleTripUpdate = useCallback((updatedTrip: Trip) => {
    setTrip(updatedTrip);
    const json = JSON.stringify({ trip: updatedTrip });
    sessionStorage.setItem("roamly_trip", json);
    if (tripId) {
      localStorage.setItem(`roamly_trip_${tripId}`, json);
    }
  }, [tripId]);

  const handleRegenerate = useCallback(async (dayNumber: number, modifier: RegenerateModifier) => {
    if (!trip || regeneratingDay !== null) return;
    setRegeneratingDay(dayNumber);

    try {
      const res = await fetch("/api/regenerate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip, dayNumber, modifier: modifier || undefined }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to regenerate day");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "complete" && event.day) {
              const updatedDays = trip.days.map((d) =>
                d.day === dayNumber ? { ...event.day, day: dayNumber, date: d.date } : d
              );
              const updatedTrip = { ...trip, days: updatedDays };
              handleTripUpdate(updatedTrip);
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegeneratingDay(null);
    }
  }, [trip, tripId, regeneratingDay, handleTripUpdate]);

  // Scroll day strip to active
  useEffect(() => {
    const el = dayStripRef.current?.querySelector(`[data-day="${activeDay}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeDay]);

  // Scroll card to top on day change
  useEffect(() => {
    cardRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeDay]);

  // Print mode — expand all cards before printing
  useEffect(() => {
    const beforePrint = () => setIsPrinting(true);
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  // Keyboard nav
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (!trip || editingDay !== null) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveDay((d) => Math.max(1, d - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveDay((d) => Math.min(trip.duration_days, d + 1));
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [trip, editingDay]);

  // ── Render ──────────────────────────────────
  if (!trip) {
    return <ItinerarySkeleton />;
  }

  return (
    <ErrorBoundary>
    <>
      {showShareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-[slideDown_0.3s_ease]">
          <div className="bg-[var(--ink)] text-[var(--paper)] px-5 py-3 rounded-2xl shadow-2xl text-sm">{shareToastMessage}</div>
        </div>
      )}

      {editingDay !== null && trip && (
        <EditModal
          day={trip.days.find((d) => d.day === editingDay)!}
          onSave={handleSaveDay}
          onCancel={() => setEditingDay(null)}
        />
      )}

      <div className="flex flex-col h-screen overflow-hidden bg-[var(--paper)] print:h-auto print:overflow-visible">
        {/* ── Hero Banner ────────────────────────────── */}
        <div className="relative h-44 md:h-56 flex-shrink-0 print:hidden">
          <Image
            src={getHeroImage(trip.destination)}
            alt={trip.destination}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/50 to-transparent" />

          {/* Overlay controls */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 md:px-6">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <button onClick={() => router.push("/")} className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition" aria-label="Home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={() => window.print()} title="PDF" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button onClick={() => setShowSummary(true)} title="Share card" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button onClick={() => setShowPacking(true)} title="Packing list" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="12" y1="10" x2="15" y2="10" /><line x1="12" y1="14" x2="15" y2="14" />
                  </svg>
                </button>
                <button onClick={() => setShowBudget(true)} title="Budget optimizer" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </button>
                <button onClick={() => setShowStats(true)} title="Trip stats" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </button>
                <button onClick={() => setShowWeather(true)} title="Weather & climate" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                  </svg>
                </button>
                <button onClick={() => setShowCopy(true)} title="Copy itinerary" className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button onClick={() => setShowFavorites(true)} title="My favorites" className="relative p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={favs.favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {favs.favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--amber)] text-[0.5rem] font-bold text-white rounded-full flex items-center justify-center">
                      {favs.favorites.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom row — destination title */}
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                {trip.destination}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {trip.duration_days} days
                </span>
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {trip.practical_info.currency}
                </span>
                <span className="text-[0.65rem] text-[var(--amber)] bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                  {trip.practical_info.budget_estimate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Print-only header ──────────────────────── */}
        <div className="hidden print:block px-6 py-4 border-b border-[var(--sand)]">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{trip.destination}</h1>
          <p className="text-sm text-[var(--muted)]">{trip.duration_days} days · {trip.practical_info.currency} · {trip.practical_info.budget_estimate}</p>
        </div>

        {/* ── Horizontal Day Strip ─────────────────── */}
        <div className="bg-white border-b border-[var(--sand)] flex-shrink-0 z-10 print:hidden">
          <div ref={dayStripRef} className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar">
            {trip.days.map((d) => {
              const isActive = d.day === activeDay;
              return (
                <button
                  key={d.day}
                  data-day={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-[var(--ink)] text-[var(--paper)] shadow-md"
                      : "text-[var(--muted)] hover:bg-[var(--paper)]"
                  }`}
                >
                  <span className={`text-[0.6rem] uppercase tracking-wider font-medium ${isActive ? "text-[var(--amber)]" : ""}`}>
                    Day
                  </span>
                  <span className={`font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight ${isActive ? "text-white" : "text-[var(--ink)]"}`}>
                    {d.day}
                  </span>
                </button>
              );
            })}

            {/* Spend indicator */}
            {cumulativeSpend > 0 && (
              <div className="flex-shrink-0 ml-auto pl-3 border-l border-[var(--sand)] flex flex-col items-end">
                <span className="text-[0.55rem] uppercase tracking-wider text-[var(--muted)] font-medium">Spent</span>
                <span className="text-sm font-bold text-[var(--sage)]">${cumulativeSpend.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Content Area ─────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {/* Chat toggle button */}
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-4 lg:bottom-8 lg:right-8 z-[1001] bg-[var(--amber)] text-white p-3.5 rounded-2xl shadow-2xl hover:bg-[var(--rust)] transition-colors group"
            aria-label="Chat with trip assistant"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--sage)] rounded-full border-2 border-white animate-pulse" />
          </button>

          {/* Map toggle button (mobile) */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="lg:hidden fixed bottom-6 right-20 z-[1001] bg-[var(--ink)] text-[var(--paper)] p-3.5 rounded-2xl shadow-2xl border border-[rgba(212,135,58,0.3)] hover:bg-[var(--rust)] transition-colors"
            aria-label={showMap ? "Show itinerary" : "Show map"}
          >
            {showMap ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            )}
          </button>

          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_420px] print:grid-cols-1">
            {/* ── Card area ─────────────────────────── */}
            <div
              ref={cardRef}
              className={`overflow-y-auto ${showMap ? "hidden lg:block" : "block"}`}
            >
              {/* Search */}
              <div className="sticky top-0 z-[5] bg-[var(--paper)] px-4 md:px-8 lg:px-12 pt-4 pb-2 print:hidden">
                <input
                  type="text"
                  placeholder="Search places, food, activities..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  aria-label="Search itinerary"
                  className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[var(--sand)] bg-white text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition"
                />
              </div>

              {/* Day cards */}
              <div className="px-4 md:px-8 lg:px-12 py-4 space-y-4">
                {(isPrinting ? trip.days : filteredDays).map((day) => (
                  <DayCard
                    key={day.day}
                    day={day}
                    tripId={tripId || undefined}
                    isActive={day.day === activeDay}
                    onClick={() => setActiveDay(day.day)}
                    onEdit={() => setEditingDay(day.day)}
                    onRegenerate={handleRegenerate}
                    isRegenerating={regeneratingDay === day.day}
                    isPrintMode={isPrinting}
                    onToggleFavorite={favs.toggle}
                    isFavorite={favs.isFav}
                  />
                ))}
                {filteredDays.length === 0 && (
                  <div className="py-16 text-center text-sm text-[var(--muted)]">
                    No days match &ldquo;{search}&rdquo;
                  </div>
                )}

                {/* Practical info */}
                <div className="bg-white rounded-2xl border border-[var(--sand)] p-6 space-y-4 mt-6">
                  <h3 className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Practical Info
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--ink)]">
                    {[
                      { icon: <ClockIcon />, label: "Best time", val: trip.practical_info.best_time_to_visit, color: "text-[var(--amber)]" },
                      { icon: <CoinIcon />, label: "Currency", val: trip.practical_info.currency, color: "text-[var(--sage)]" },
                      { icon: <TrainIcon />, label: "Transport", val: trip.practical_info.transport_tips, color: "text-[var(--rust)]" },
                      { icon: <WalletIcon />, label: "Budget", val: trip.practical_info.budget_estimate, color: "text-[var(--ink)]" },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-3">
                        <div className={`mt-0.5 ${item.color} flex-shrink-0`}>{item.icon}</div>
                        <div>
                          <span className="text-[var(--muted)] font-medium text-xs">{item.label}</span>
                          <p className="mt-0.5 leading-relaxed">{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-[0.6rem] text-[var(--muted)] py-6">
                  AI-generated — prices, hours, and details are estimates. Always verify before booking.
                </p>
              </div>
            </div>

            {/* ── Map pane ──────────────────────────── */}
            <div className={`relative border-l border-[var(--sand)] print:hidden ${
              showMap ? "block" : "hidden lg:block"
            }`}>
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-[var(--sand)]/30">Loading map...</div>}>
                <TripMap days={trip.days} activeDay={activeDay} onDayClick={handleDayClick} />
              </Suspense>

              {/* Map overlay card */}
              {activeData && (
                <div className="absolute bottom-5 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 max-w-[200px] border border-[var(--sand)] shadow-lg text-sm">
                  <div className="text-[0.6rem] uppercase tracking-[0.1em] text-[var(--amber)] font-medium mb-0.5">
                    Day {activeDay}{activeData.region ? ` · ${activeData.region}` : ""}
                  </div>
                  <div className="font-[family-name:var(--font-playfair)] font-bold text-[var(--ink)] leading-tight">
                    {activeData.theme}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer
        trip={trip}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onTripUpdate={handleTripUpdate}
      />

      {/* Packing List Modal */}
      <PackingList
        trip={trip}
        isOpen={showPacking}
        onClose={() => setShowPacking(false)}
      />

      {/* Budget Optimizer Modal */}
      <BudgetOptimizer
        trip={trip}
        isOpen={showBudget}
        onClose={() => setShowBudget(false)}
      />

      {/* Trip Summary Card (Share) */}
      <TripSummaryCard
        trip={trip}
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
      />

      {/* Trip Stats */}
      <TripStats
        trip={trip}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />
      <WeatherInfo
        trip={trip}
        isOpen={showWeather}
        onClose={() => setShowWeather(false)}
      />
      <CopyItinerary
        trip={trip}
        isOpen={showCopy}
        onClose={() => setShowCopy(false)}
      />
      <FavoritesPanel
        trip={trip}
        favorites={favs.favorites}
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onScrollToDay={(day) => setActiveDay(day)}
      />
    </>
    </ErrorBoundary>
  );
}
