"use client";

import { useMemo } from "react";
import type { Trip } from "@/types/itinerary";

/* ── Helpers ──────────────────────────────────────────── */
function parseCost(s: string): number {
  const m = s.replace(/[~,]/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

interface StatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ emoji, value, label, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--sand)] p-4 flex flex-col items-center text-center hover:shadow-md hover:border-[var(--amber)]/30 transition">
      <span className="text-2xl mb-1">{emoji}</span>
      <span className={`text-xl font-bold font-[family-name:var(--font-playfair)] ${color}`}>
        {value}
      </span>
      <span className="text-[0.6rem] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mt-0.5">
        {label}
      </span>
    </div>
  );
}

/* ── Mini bar chart ──────────────────────────────────── */
function SpendChart({ days }: { days: { day: number; total: number }[] }) {
  const max = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {days.map((d) => {
        const h = Math.max((d.total / max) * 100, 4);
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-[var(--amber)] transition-all duration-500 min-w-[8px]"
              style={{ height: `${h}%` }}
              title={`Day ${d.day}: $${d.total}`}
            />
            <span className="text-[0.5rem] text-[var(--muted)]">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export default function TripStats({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    const totalDays = trip.duration_days;
    const regions = [...new Set(trip.days.map((d) => d.region).filter(Boolean))];
    const allFoods = trip.days.flatMap((d) => d.food || []);
    const mustTryFoods = allFoods.filter((f) => f.must_try);
    const locations = trip.days.flatMap((d) => d.locations);

    // Calculate daily spend
    const dailySpend = trip.days.map((d) => {
      const t = d.costs?.find((c) => c.item.toLowerCase().includes("total"));
      return { day: d.day, total: t ? parseCost(t.cost) : 0 };
    });
    const totalSpend = dailySpend.reduce((s, d) => s + d.total, 0);
    const avgDaily = totalDays > 0 ? totalSpend / totalDays : 0;

    // Most expensive day
    const maxDay = dailySpend.reduce(
      (m, d) => (d.total > m.total ? d : m),
      { day: 0, total: 0 }
    );

    // Cheapest day
    const minDay = dailySpend
      .filter((d) => d.total > 0)
      .reduce((m, d) => (d.total < m.total ? d : m), { day: 0, total: Infinity });

    // Unique activities count (rough — count sentences)
    const activities = trip.days.reduce((count, d) => {
      const morningActs = d.morning.split(/\.\s+/).filter((s) => s.trim().length > 10).length;
      const afternoonActs = d.afternoon.split(/\.\s+/).filter((s) => s.trim().length > 10).length;
      const eveningActs = d.evening.split(/\.\s+/).filter((s) => s.trim().length > 10).length;
      return count + morningActs + afternoonActs + eveningActs;
    }, 0);

    return {
      totalDays,
      regions,
      totalFoods: allFoods.length,
      mustTryFoods: mustTryFoods.length,
      locations: locations.length,
      totalSpend,
      avgDaily,
      maxDay,
      minDay: minDay.total === Infinity ? { day: 0, total: 0 } : minDay,
      dailySpend,
      activities,
      currency: trip.practical_info.currency.split(".")[0].split(",")[0].slice(0, 20),
    };
  }, [trip]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--paper)] w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--sand)] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--sand)] px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📊</span>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--ink)]">
                Trip Stats
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                {trip.destination} · {stats.totalDays} days
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Key stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard emoji="📍" value={stats.locations} label="Places" color="text-[var(--rust)]" />
            <StatCard emoji="🍽️" value={stats.totalFoods} label="Eateries" color="text-[var(--amber)]" />
            <StatCard emoji="🌏" value={stats.regions.length} label="Regions" color="text-[var(--sage)]" />
            <StatCard emoji="⭐" value={stats.mustTryFoods} label="Must-Tries" color="text-[var(--rust)]" />
            <StatCard emoji="🎯" value={stats.activities} label="Activities" color="text-[var(--ink)]" />
            <StatCard emoji="📅" value={stats.totalDays} label="Days" color="text-[var(--amber)]" />
          </div>

          {/* Spend overview */}
          {stats.totalSpend > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--sand)] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
                  Budget Breakdown
                </h3>
                <span className="text-xs text-[var(--muted)]">{stats.currency}</span>
              </div>

              {/* Summary row */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-[var(--ink)] font-[family-name:var(--font-playfair)]">
                    ${stats.totalSpend.toFixed(0)}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1.5">total est.</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[var(--sage)]">
                    ${stats.avgDaily.toFixed(0)}
                  </span>
                  <span className="text-[0.6rem] text-[var(--muted)] ml-1">/day avg</span>
                </div>
              </div>

              {/* Bar chart */}
              <div>
                <SpendChart days={stats.dailySpend} />
                <div className="flex justify-between mt-2 text-[0.55rem] text-[var(--muted)]">
                  <span>Day 1</span>
                  <span>Day {stats.totalDays}</span>
                </div>
              </div>

              {/* Min/Max */}
              <div className="grid grid-cols-2 gap-3">
                {stats.maxDay.total > 0 && (
                  <div className="bg-[var(--rust)]/5 rounded-xl p-3">
                    <span className="text-[0.55rem] uppercase tracking-wider text-[var(--rust)] font-medium">
                      Biggest Day
                    </span>
                    <div className="mt-1">
                      <span className="text-sm font-bold text-[var(--ink)]">
                        Day {stats.maxDay.day}
                      </span>
                      <span className="text-xs text-[var(--muted)] ml-1.5">
                        ${stats.maxDay.total.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
                {stats.minDay.total > 0 && (
                  <div className="bg-[var(--sage)]/8 rounded-xl p-3">
                    <span className="text-[0.55rem] uppercase tracking-wider text-[var(--sage)] font-medium">
                      Cheapest Day
                    </span>
                    <div className="mt-1">
                      <span className="text-sm font-bold text-[var(--ink)]">
                        Day {stats.minDay.day}
                      </span>
                      <span className="text-xs text-[var(--muted)] ml-1.5">
                        ${stats.minDay.total.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regions visited */}
          {stats.regions.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--sand)] p-4">
              <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-3">
                Regions Explored
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.regions.map((r, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[var(--paper)] text-[var(--ink)] px-3 py-1.5 rounded-lg border border-[var(--sand)]"
                  >
                    📍 {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
