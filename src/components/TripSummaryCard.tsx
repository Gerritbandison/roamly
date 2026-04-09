"use client";

import { useRef, useState } from "react";
import type { Trip } from "@/types/itinerary";

/* ── Helper: format a highlights list from trip data ──── */
function getHighlights(trip: Trip): string[] {
  const highlights: string[] = [];
  // Collect unique regions
  const regions = [...new Set(trip.days.map((d) => d.region).filter(Boolean))];
  if (regions.length > 0) highlights.push(`${regions.length} regions explored`);
  // Count unique dining spots
  const foods = trip.days.flatMap((d) => d.food || []);
  if (foods.length > 0) highlights.push(`${foods.length}+ local eateries`);
  // Count locations
  const locs = trip.days.flatMap((d) => d.locations);
  if (locs.length > 0) highlights.push(`${locs.length} places to visit`);
  // Must-try count
  const mustTry = foods.filter((f) => f.must_try);
  if (mustTry.length > 0) highlights.push(`${mustTry.length} must-try dishes`);
  return highlights.slice(0, 4);
}

/* ── Day theme pills ─────────────────────────────────── */
function getDayThemes(trip: Trip): string[] {
  return trip.days.map((d) => d.theme).slice(0, 6);
}

/* ── Main Component ──────────────────────────────────── */
export default function TripSummaryCard({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [style, setStyle] = useState<"dark" | "light" | "gradient">("dark");

  if (!isOpen) return null;

  const highlights = getHighlights(trip);
  const themes = getDayThemes(trip);

  const bgStyles = {
    dark: "bg-[#1a1814] text-white",
    light: "bg-[#faf8f5] text-[#1a1814]",
    gradient: "bg-gradient-to-br from-[#1a1814] via-[#2d2620] to-[#4a3728] text-white",
  };

  const accentStyles = {
    dark: "text-[#c8843a]",
    light: "text-[#c8843a]",
    gradient: "text-[#e8a84c]",
  };

  const subtleStyles = {
    dark: "text-white/60",
    light: "text-[#1a1814]/50",
    gradient: "text-white/60",
  };

  const pillStyles = {
    dark: "bg-white/10 text-white/80",
    light: "bg-[#1a1814]/8 text-[#1a1814]/70",
    gradient: "bg-white/10 text-white/80",
  };

  const dividerStyles = {
    dark: "border-white/10",
    light: "border-[#1a1814]/10",
    gradient: "border-white/10",
  };

  const handleCopyAsImage = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      // Use html2canvas-like approach via canvas
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
        } catch {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `roamly-${trip.destination.toLowerCase().replace(/\s+/g, "-")}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (err) {
      console.error("Failed to capture card:", err);
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `roamly-${trip.destination.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to download card:", err);
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md flex flex-col gap-4 animate-scale-in">
        {/* Style switcher + actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(["dark", "light", "gradient"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  style === s
                    ? "bg-white text-[var(--ink)] shadow-md"
                    : "bg-white/20 text-white/80 hover:bg-white/30"
                }`}
              >
                {s === "dark" ? "Dark" : s === "light" ? "Light" : "Gradient"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleCopyAsImage}
              disabled={copying}
              className="px-3 py-1.5 rounded-lg bg-white text-[var(--ink)] text-xs font-medium hover:bg-white/90 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {copying ? (
                "Copied!"
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={copying}
              className="px-3 py-1.5 rounded-lg bg-[var(--amber)] text-white text-xs font-medium hover:bg-[var(--rust)] transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── The Card ──────────────────────────────── */}
        <div
          ref={cardRef}
          className={`rounded-3xl overflow-hidden p-6 ${bgStyles[style]}`}
          style={{ aspectRatio: "4/5" }}
        >
          <div className="h-full flex flex-col">
            {/* Roamly branding */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={accentStyles[style]}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className={`text-sm font-bold tracking-wide ${accentStyles[style]}`}>
                  ROAMLY
                </span>
              </div>
              <span className={`text-[0.6rem] ${subtleStyles[style]}`}>
                AI Trip Planner
              </span>
            </div>

            {/* Destination */}
            <div className="flex-1 flex flex-col justify-center">
              <h1
                className="text-3xl font-bold leading-tight mb-2"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {trip.destination}
              </h1>
              <div className={`flex items-center gap-3 text-xs ${subtleStyles[style]} mb-6`}>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                  {trip.duration_days} days
                </span>
                <span>·</span>
                <span>{trip.practical_info.currency.split(".")[0].split(",")[0].slice(0, 25)}</span>
                <span>·</span>
                <span>{trip.practical_info.budget_estimate.split(".")[0].split(",")[0].slice(0, 30)}</span>
              </div>

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="space-y-2 mb-6">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className={`text-xs ${accentStyles[style]}`}>✦</span>
                      <span className="text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className={`border-t ${dividerStyles[style]} my-4`} />

              {/* Day themes as pills */}
              <div className="flex flex-wrap gap-1.5">
                {themes.map((t, i) => (
                  <span
                    key={i}
                    className={`text-[0.6rem] px-2.5 py-1 rounded-full ${pillStyles[style]}`}
                  >
                    Day {i + 1}: {t}
                  </span>
                ))}
                {trip.days.length > 6 && (
                  <span className={`text-[0.6rem] px-2.5 py-1 rounded-full ${pillStyles[style]}`}>
                    +{trip.days.length - 6} more days
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`mt-6 pt-4 border-t ${dividerStyles[style]} flex items-center justify-between`}>
              <span className={`text-[0.55rem] ${subtleStyles[style]}`}>
                Generated with Roamly AI
              </span>
              <span className={`text-[0.55rem] ${subtleStyles[style]}`}>
                roamly.app
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
