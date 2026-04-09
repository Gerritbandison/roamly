"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TripFormData } from "@/types/itinerary";
import Toast from "@/components/Toast";
import StreamingOverlay from "@/components/StreamingOverlay";
import SampleTrips from "@/components/SampleTrips";
import SavedTrips, { type SavedTrip } from "@/components/SavedTrips";

/* ── Constants ───────────────────────────────────────── */
const VIBES = [
  { label: "Adventure", icon: "mountain" },
  { label: "Culture", icon: "landmark" },
  { label: "Food & Drink", icon: "utensils" },
  { label: "Beaches", icon: "sun" },
  { label: "Nightlife", icon: "moon" },
  { label: "Off the Beaten Path", icon: "compass" },
  { label: "Family", icon: "heart" },
  { label: "Budget", icon: "backpack" },
];

const VIBE_ICONS: Record<string, React.ReactNode> = {
  mountain: <path d="M8 3l4 8 5-3 3 14H4L8 3z" />,
  landmark: <path d="M12 2L2 7l2 1v6l-2 1v5h20v-5l-2-1V8l2-1L12 2zm0 3l6 3v6H6V8l6-3z" />,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h2v11h2V11h2c1.1 0 2-.9 2-2V2" /><path d="M19 2v20h2V2h-2zm-2 8V2h-2v8a4 4 0 0 0 4 4" /></>,
  sun: <><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  compass: <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  backpack: <><path d="M4 10h16v12H4z" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /><path d="M12 14v4" /></>,
};

/* ── Icon components ─────────────────────────────────── */
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const WalletIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Page ─────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamMessage, setStreamMessage] = useState("");
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<TripFormData>({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "mid-range",
    interests: "",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("roamly_history");
      if (stored) setSavedTrips(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const toggleVibe = (label: string) =>
    setSelectedVibes((p) => p.includes(label) ? p.filter((v) => v !== label) : [...p, label]);

  const handleSampleSelect = useCallback((partial: Partial<TripFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setSelectedVibes([]);
  }, []);

  const validate = (): string | null => {
    if (!form.destination.trim()) return "Please enter a destination.";
    if (!form.startDate) return "Please select a start date.";
    if (!form.endDate) return "Please select an end date.";
    const s = new Date(form.startDate), e = new Date(form.endDate);
    if (e < s) return "End date must be after start date.";
    const d = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
    if (d > 21) return "Maximum trip length is 21 days.";
    return null;
  };

  const submitTrip = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setStreamProgress(0);
    setStreamMessage("Connecting...");
    setLastPayload(payload);

    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to generate itinerary"); }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
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
            if (event.type === "progress") { setStreamProgress(event.progress || 0); setStreamMessage(event.message || ""); }
            else if (event.type === "complete") {
              setStreamProgress(100);
              setStreamMessage("Ready!");
              sessionStorage.setItem("roamly_trip", JSON.stringify(event.data));
              const entry: SavedTrip = { id: Date.now().toString(36), destination: event.data.trip.destination, duration: event.data.trip.duration_days, budget: event.data.trip.practical_info.budget_estimate, createdAt: new Date().toISOString() };
              const hist = [entry, ...savedTrips].slice(0, 10);
              localStorage.setItem("roamly_history", JSON.stringify(hist));
              localStorage.setItem(`roamly_trip_${entry.id}`, JSON.stringify(event.data));
              setTimeout(() => router.push(`/itinerary?id=${entry.id}`), 350);
              return;
            } else if (event.type === "error") { throw new Error(event.message); }
          } catch (pe) { if (pe instanceof Error && pe.message.includes("Failed")) throw pe; }
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); setStreamProgress(0); }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }
    const payload = { ...form, interests: [form.interests, ...selectedVibes].filter(Boolean).join(", ") };
    await submitTrip(payload);
  };

  const handleRetry = () => {
    if (lastPayload) {
      setError(null);
      submitTrip(lastPayload);
    }
  };

  const loadSaved = (t: SavedTrip) => {
    const d = localStorage.getItem(`roamly_trip_${t.id}`);
    if (d) { sessionStorage.setItem("roamly_trip", d); router.push(`/itinerary?id=${t.id}`); }
  };

  const deleteSaved = (id: string) => {
    const u = savedTrips.filter((t) => t.id !== id);
    setSavedTrips(u);
    localStorage.setItem("roamly_history", JSON.stringify(u));
    localStorage.removeItem(`roamly_trip_${id}`);
  };

  const tripDays = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1
    : 0;

  return (
    <main className="flex-1 flex flex-col">
      {error && (
        <Toast
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {/* Retry banner when there was an error and we have a payload to retry */}
      {error && lastPayload && !loading && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 animate-[slideDown_0.3s_ease]">
          <button
            onClick={handleRetry}
            className="bg-[var(--amber)] text-[var(--ink)] px-5 py-2.5 rounded-2xl shadow-xl text-sm font-medium hover:bg-[var(--rust)] hover:text-white transition flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
        </div>
      )}
      {loading && <StreamingOverlay progress={streamProgress} message={streamMessage} />}

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#ede4d0] via-[var(--paper)] to-white" />
        <div className="absolute top-10 right-[8%] w-[320px] h-[320px] rounded-full bg-[var(--amber)] opacity-[0.07] blur-[80px] -z-10" />
        <div className="absolute bottom-24 left-[3%] w-[240px] h-[240px] rounded-full bg-[var(--rust)] opacity-[0.05] blur-[60px] -z-10" />

        <div className="animate-fade-up max-w-2xl text-center">
          {/* Logo plane */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
            <span className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--muted)] font-medium">AI-Powered Trip Planning</span>
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-6xl sm:text-7xl md:text-[5.5rem] font-bold text-[var(--ink)] mb-5 tracking-tight leading-[0.92]">
            Roam<span className="italic text-[var(--amber)]">ly</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed mb-10">
            Tell us where. We&apos;ll plan every detail — activities, restaurants,
            costs, local tips — in seconds.
          </p>

          <a href="#plan-form" className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[var(--ink)] text-[var(--paper)] font-semibold text-base hover:bg-[var(--rust)] transition-colors shadow-lg shadow-[rgba(26,18,8,0.15)]">
            Start Planning
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
          </a>
        </div>
      </section>

      {/* ── Destination Cards ─────────────────────────── */}
      <SampleTrips onSelect={handleSampleSelect} />

      {/* ── Form Section ─────────────────────────────── */}
      <section id="plan-form" className="flex justify-center px-4 py-16 md:py-20 scroll-mt-8 bg-gradient-to-b from-white to-[var(--paper)]">
        <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-[rgba(26,18,8,0.06)] border border-[var(--sand)]/60 p-7 md:p-10 space-y-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-[var(--paper)] rounded-full px-4 py-1.5 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              <span className="text-xs font-medium text-[var(--muted)]">AI-Powered</span>
            </div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--ink)]">Plan Your Trip</h2>
          </div>

          {/* Destination (supports multi-city with → separator) */}
          <div>
            <label htmlFor="dest" className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2">
              <MapPinIcon /> Destination{form.destination.includes("→") && <span className="text-[var(--amber)] normal-case tracking-normal ml-1">multi-city</span>}
            </label>

            {/* Show stop tags when multi-city */}
            {form.destination.includes("→") && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.destination.split("→").map((stop, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-[var(--ink)] text-[var(--paper)] px-2.5 py-1 rounded-lg font-medium">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {stop.trim()}
                    {i < form.destination.split("→").length - 1 && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    )}
                  </span>
                ))}
              </div>
            )}

            <input id="dest" type="text" required placeholder="e.g. Tokyo, or Rome → Florence → Amalfi Coast"
              value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition text-lg font-[family-name:var(--font-playfair)]"
            />
            <p className="text-[0.6rem] text-[var(--muted)]/60 mt-1.5">Use → between cities for multi-stop trips (e.g. Rome → Florence → Amalfi)</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sd" className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2"><CalendarIcon /> Start</label>
              <input id="sd" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition" />
            </div>
            <div>
              <label htmlFor="ed" className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2"><CalendarIcon /> End</label>
              <input id="ed" type="date" required value={form.endDate} min={form.startDate || undefined} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition" />
            </div>
          </div>
          {tripDays > 0 && (
            <p className="text-xs text-[var(--muted)] -mt-3">
              {tripDays} day{tripDays !== 1 ? "s" : ""}
              {tripDays > 21 && <span className="text-[var(--rust)] ml-1">— max 21</span>}
            </p>
          )}

          {/* Travelers + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tv" className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2"><UsersIcon /> Travelers</label>
              <select id="tv" value={form.travelers} onChange={(e) => setForm({ ...form, travelers: +e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="bg" className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2"><WalletIcon /> Budget</label>
              <select id="bg" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value as TripFormData["budget"] })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition">
                <option value="backpacker">Backpacker</option>
                <option value="mid-range">Mid-Range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          {/* Vibes */}
          <div>
            <label className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-3">
              <SparkleIcon /> Vibe
            </label>
            <div className="grid grid-cols-4 gap-2">
              {VIBES.map((v) => {
                const active = selectedVibes.includes(v.label);
                return (
                  <button key={v.label} type="button" onClick={() => toggleVibe(v.label)} aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[0.7rem] font-medium transition-all ${
                      active ? "bg-[var(--ink)] text-[var(--amber)] border-[var(--ink)] shadow-md" : "bg-white text-[var(--muted)] border-[var(--sand)] hover:border-[var(--amber)] hover:text-[var(--amber)]"
                    }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {VIBE_ICONS[v.icon]}
                    </svg>
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra */}
          <div>
            <label htmlFor="extra" className="block text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-2">
              Anything else? <span className="normal-case tracking-normal text-[var(--muted)]/50">(optional)</span>
            </label>
            <textarea id="extra" placeholder="e.g. We love street food, traveling with a toddler..."
              value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition resize-none text-sm" />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-base hover:bg-[var(--rust)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[rgba(26,18,8,0.12)] flex items-center justify-center gap-2.5">
            {loading ? (
              <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Planning...</>
            ) : (
              <>
                Plan My Trip
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Saved Trips ──────────────────────────────── */}
      <SavedTrips trips={savedTrips} onLoad={loadSaved} onDelete={deleteSaved} />

      {/* ── How it works ─────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--ink)] mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>,
                title: "1. Tell us your trip",
                desc: "Pick your destination, dates, budget, and vibe. Takes 30 seconds.",
              },
              {
                icon: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
                title: "2. AI plans everything",
                desc: "Our AI researches and builds a day-by-day itinerary with real places and prices.",
              },
              {
                icon: <><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
                title: "3. Explore & customize",
                desc: "Browse your itinerary with maps, edit any day, export PDF, or share with friends.",
              },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--paper)] border border-[var(--sand)] flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {step.icon}
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--ink)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-8 border-t border-[var(--sand)]">
        <p className="font-[family-name:var(--font-playfair)] font-bold text-[var(--ink)] mb-1">
          Roam<span className="italic text-[var(--amber)]">ly</span>
        </p>
        <p className="text-[0.65rem] text-[var(--muted)]">Built with AI · Prices and details are estimates</p>
      </footer>
    </main>
  );
}
