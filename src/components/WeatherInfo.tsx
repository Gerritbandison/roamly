"use client";

import { useState } from "react";
import type { Trip } from "@/types/itinerary";

function getSeasonEmoji(month: number): string {
  if (month >= 3 && month <= 5) return "🌸";
  if (month >= 6 && month <= 8) return "☀️";
  if (month >= 9 && month <= 11) return "🍂";
  return "❄️";
}

/* ── Parse trip dates to determine travel months ── */
function getTripMonths(trip: Trip): number[] {
  const months = new Set<number>();
  for (const day of trip.days) {
    if (day.date) {
      const d = new Date(day.date);
      if (!isNaN(d.getTime())) months.add(d.getMonth());
    }
  }
  if (months.size === 0) {
    // fallback to current month
    months.add(new Date().getMonth());
  }
  return [...months];
}

/* ── Packing weather tips ── */
function getWeatherTips(months: number[], destination: string): string[] {
  const tips: string[] = [];
  const dest = destination.toLowerCase();
  const isTropical = ["bali", "bangkok", "thailand", "vietnam", "indonesia", "philippines", "singapore", "malaysia", "hawaii", "caribbean", "mexico"].some(t => dest.includes(t));
  const isDesert = ["dubai", "morocco", "egypt", "sahara", "arizona", "desert"].some(t => dest.includes(t));

  for (const m of months) {
    if (m >= 5 && m <= 8) {
      if (isTropical) tips.push("Rainy season — pack a lightweight rain jacket");
      else tips.push("Summer heat — stay hydrated, wear sunscreen");
    }
    if (m >= 11 || m <= 2) {
      if (!isTropical && !isDesert) tips.push("Cold weather — layer up with warm clothing");
    }
    if (isTropical) tips.push("High humidity — quick-dry fabrics recommended");
    if (isDesert) tips.push("Hot days, cool nights — bring layers for temperature swings");
  }

  // Deduplicate
  return [...new Set(tips)].slice(0, 4);
}

/* ── Main Component ── */
export default function WeatherInfo({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "monthly">("overview");

  if (!isOpen) return null;

  const tripMonths = getTripMonths(trip);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weatherTips = getWeatherTips(tripMonths, trip.destination);

  // Parse best_time_to_visit for display
  const bestTime = trip.practical_info.best_time_to_visit;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--paper)] w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--sand)] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--sand)] px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌤️</span>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--ink)]">
                Weather & Climate
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                {trip.destination}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--sand)]/40 text-[var(--muted)] hover:text-[var(--ink)] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--sand)] px-5">
          {(["overview", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[var(--amber)] text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab === "overview" ? "Overview" : "Monthly Guide"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {activeTab === "overview" && (
            <>
              {/* Best time to visit */}
              <div className="bg-gradient-to-r from-[var(--amber)]/10 to-[var(--sage)]/10 rounded-2xl p-4 border border-[var(--amber)]/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.1em] text-[var(--amber)] font-medium mb-1">
                      Best Time to Visit
                    </h3>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {bestTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your travel period */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-4">
                <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-3">
                  Your Travel Period
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tripMonths.map((m) => (
                    <div
                      key={m}
                      className="flex items-center gap-2 bg-[var(--paper)] rounded-xl px-3 py-2 border border-[var(--sand)]"
                    >
                      <span className="text-lg">{getSeasonEmoji(m + 1)}</span>
                      <div>
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {fullMonthNames[m]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transport tips */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🚌</span>
                  <div>
                    <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-2">
                      Getting Around
                    </h3>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {trip.practical_info.transport_tips}
                    </p>
                  </div>
                </div>
              </div>

              {/* Weather-based packing tips */}
              {weatherTips.length > 0 && (
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-4">
                  <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-3">
                    Weather Packing Tips
                  </h3>
                  <div className="space-y-2">
                    {weatherTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-xs text-[var(--sage)] mt-0.5">✦</span>
                        <span className="text-sm text-[var(--ink)]">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Currency info */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💱</span>
                  <div>
                    <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-2">
                      Currency
                    </h3>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {trip.practical_info.currency}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "monthly" && (
            <>
              <p className="text-xs text-[var(--muted)] mb-2">
                General climate guide for planning — exact conditions will vary year to year.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {monthNames.map((name, i) => {
                  const isTravel = tripMonths.includes(i);
                  return (
                    <div
                      key={name}
                      className={`rounded-xl p-3 text-center border transition ${
                        isTravel
                          ? "bg-[var(--amber)]/10 border-[var(--amber)]/30"
                          : "bg-[var(--card)] border-[var(--sand)]"
                      }`}
                    >
                      <span className="text-lg">{getSeasonEmoji(i + 1)}</span>
                      <div className={`text-xs font-medium mt-1 ${isTravel ? "text-[var(--amber)]" : "text-[var(--ink)]"}`}>
                        {name}
                      </div>
                      {isTravel && (
                        <div className="text-[0.55rem] text-[var(--rust)] font-medium mt-0.5">
                          YOUR TRIP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Season breakdown */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-4 space-y-3">
                <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
                  Seasonal Overview
                </h3>
                {[
                  { season: "Spring", months: "Mar–May", emoji: "🌸", desc: "Mild temperatures, cherry blossoms in many destinations" },
                  { season: "Summer", months: "Jun–Aug", emoji: "☀️", desc: "Peak travel season, warmest weather, longer days" },
                  { season: "Autumn", months: "Sep–Nov", emoji: "🍂", desc: "Cooler temps, beautiful foliage, fewer crowds" },
                  { season: "Winter", months: "Dec–Feb", emoji: "❄️", desc: "Coldest period, holiday season, potential snow" },
                ].map((s) => (
                  <div key={s.season} className="flex items-start gap-3">
                    <span className="text-lg">{s.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--ink)]">{s.season}</span>
                        <span className="text-[0.6rem] text-[var(--muted)]">{s.months}</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
