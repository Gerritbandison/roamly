"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Trip } from "@/types/itinerary";

/* ── Types ──────────────────────────────────────────── */
interface BudgetCategory {
  name: string;
  emoji: string;
  current_spend: number;
  optimized_spend: number;
  percentage: number;
  color: string;
  tips: string[];
}

interface BudgetData {
  total_estimated: string;
  categories: BudgetCategory[];
  savings_total: number;
  savings_tips: string[];
  splurge_worthy: string[];
}

interface Priorities {
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  shopping: number;
}

const DEFAULT_PRIORITIES: Priorities = {
  accommodation: 3,
  food: 3,
  activities: 3,
  transport: 3,
  shopping: 3,
};

const PRIORITY_KEYS: { key: keyof Priorities; label: string; emoji: string }[] = [
  { key: "accommodation", label: "Accommodation", emoji: "🏨" },
  { key: "food", label: "Food & Dining", emoji: "🍽️" },
  { key: "activities", label: "Activities", emoji: "🎯" },
  { key: "transport", label: "Transport", emoji: "🚌" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
];

/* ── SVG Donut Chart ─────────────────────────────────── */
function DonutChart({
  categories,
  totalLabel,
}: {
  categories: BudgetCategory[];
  totalLabel: string;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 75;
  const strokeWidth = 28;

  // Build segments
  const total = categories.reduce((s, c) => s + c.optimized_spend, 0);
  let cumulativeAngle = -90; // Start from top

  const segments = categories.map((cat) => {
    const pct = total > 0 ? cat.optimized_spend / total : 0;
    const angle = pct * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // Arc path using SVG
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...cat,
      pct,
      path:
        angle >= 359.99
          ? // Full circle — use two arcs
            `M ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 mx-auto">
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--sand)"
        strokeWidth={strokeWidth}
        opacity={0.3}
      />
      {/* Segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.path}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          className="transition-all duration-700"
          style={{
            filter: `drop-shadow(0 1px 2px ${seg.color}40)`,
          }}
        />
      ))}
      {/* Center text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        className="fill-[var(--muted)]"
        style={{ fontSize: "0.55rem", fontWeight: 500 }}
      >
        OPTIMIZED
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-[var(--ink)]"
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          fontFamily: "var(--font-playfair)",
        }}
      >
        {totalLabel}
      </text>
    </svg>
  );
}

/* ── Priority Slider ─────────────────────────────────── */
function PrioritySlider({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const dots = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{emoji}</span>
      <span className="text-xs text-[var(--ink)] font-medium w-28 truncate">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-1">
        {dots.map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`w-6 h-6 rounded-full border-2 transition-all text-[0.6rem] font-bold ${
              d <= value
                ? "bg-[var(--amber)] border-[var(--amber)] text-white scale-105"
                : "bg-transparent border-[var(--sand)] text-[var(--muted)] hover:border-[var(--amber)]/50"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <span className="text-[0.6rem] text-[var(--muted)] w-10 text-right">
        {value <= 1 ? "Save" : value <= 2 ? "Low" : value <= 3 ? "Mid" : value <= 4 ? "High" : "Splurge"}
      </span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export default function BudgetOptimizer({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priorities>(DEFAULT_PRIORITIES);
  const [showPriorities, setShowPriorities] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const hasGenerated = useRef(false);

  const generate = useCallback(
    async (p?: Priorities) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/budget-optimizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trip, priorities: p || priorities }),
        });
        if (!res.ok) throw new Error("Failed to optimize budget");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [trip, priorities]
  );

  // Generate on first open
  useEffect(() => {
    if (isOpen && !hasGenerated.current && !data && !loading) {
      hasGenerated.current = true;
      generate();
    }
  }, [isOpen, data, loading, generate]);

  const handlePriorityChange = (key: keyof Priorities, val: number) => {
    setPriorities((p) => ({ ...p, [key]: val }));
  };

  const handleReoptimize = () => {
    generate(priorities);
    setShowPriorities(false);
  };

  if (!isOpen) return null;

  const totalOptimized = data
    ? data.categories.reduce((s, c) => s + c.optimized_spend, 0)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--sand)] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[var(--sand)] px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💰</span>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--ink)]">
                Budget Optimizer
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                AI-powered spending insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && !loading && (
              <button
                onClick={() => setShowPriorities(!showPriorities)}
                className={`p-2 rounded-xl transition text-sm ${
                  showPriorities
                    ? "bg-[var(--amber)] text-white"
                    : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
                title="Adjust priorities"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] transition"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-[3px] border-[var(--sand)] border-t-[var(--amber)] animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xl">
                  💰
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] animate-pulse">
                Crunching your budget...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="py-12 text-center space-y-3">
              <p className="text-3xl">😅</p>
              <p className="text-sm text-[var(--muted)]">{error}</p>
              <button
                onClick={() => generate()}
                className="mt-2 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Priority sliders panel */}
          {showPriorities && data && !loading && (
            <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sand)] p-4 space-y-3 animate-fade-in">
              <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
                What matters most to you?
              </h3>
              {PRIORITY_KEYS.map((pk) => (
                <PrioritySlider
                  key={pk.key}
                  label={pk.label}
                  emoji={pk.emoji}
                  value={priorities[pk.key]}
                  onChange={(v) => handlePriorityChange(pk.key, v)}
                />
              ))}
              <button
                onClick={handleReoptimize}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-[var(--amber)] text-white text-sm font-medium hover:bg-[var(--rust)] transition"
              >
                Re-optimize Budget
              </button>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <>
              {/* Donut Chart */}
              <div className="relative">
                <DonutChart
                  categories={data.categories}
                  totalLabel={`$${totalOptimized.toLocaleString()}`}
                />
                {/* Savings badge */}
                {data.savings_total > 0 && (
                  <div className="absolute top-2 right-2 bg-[var(--sage)] text-white text-[0.65rem] font-bold px-2.5 py-1 rounded-full">
                    Save ${data.savings_total.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Category Legend + Bars */}
              <div className="space-y-2">
                {data.categories.map((cat, i) => {
                  const maxSpend = Math.max(
                    ...data.categories.map((c) => Math.max(c.current_spend, c.optimized_spend))
                  );
                  const currentPct =
                    maxSpend > 0 ? (cat.current_spend / maxSpend) * 100 : 0;
                  const optPct =
                    maxSpend > 0 ? (cat.optimized_spend / maxSpend) * 100 : 0;
                  const savings = cat.current_spend - cat.optimized_spend;
                  const isExpanded = activeCategory === i;

                  return (
                    <div key={cat.name}>
                      <button
                        onClick={() =>
                          setActiveCategory(isExpanded ? null : i)
                        }
                        className="w-full text-left bg-white rounded-xl border border-[var(--sand)] p-3 hover:border-[var(--amber)]/40 transition group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm font-medium text-[var(--ink)]">
                              {cat.emoji} {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--ink)]">
                              ${cat.optimized_spend.toLocaleString()}
                            </span>
                            {savings > 0 && (
                              <span className="text-[0.6rem] text-[var(--sage)] font-bold bg-[var(--sage)]/10 px-1.5 py-0.5 rounded-full">
                                -${savings.toLocaleString()}
                              </span>
                            )}
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--muted)"
                              strokeWidth="2"
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>

                        {/* Comparison bars */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.5rem] text-[var(--muted)] w-11 text-right">
                              Before
                            </span>
                            <div className="flex-1 h-1.5 bg-[var(--sand)]/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full opacity-40 transition-all duration-700"
                                style={{
                                  width: `${currentPct}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="text-[0.5rem] text-[var(--muted)] w-12 text-right">
                              ${cat.current_spend.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.5rem] text-[var(--ink)] font-medium w-11 text-right">
                              After
                            </span>
                            <div className="flex-1 h-1.5 bg-[var(--sand)]/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${optPct}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="text-[0.5rem] text-[var(--ink)] font-medium w-12 text-right">
                              ${cat.optimized_spend.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded tips */}
                      {isExpanded && (
                        <div className="mt-1 ml-5 pl-3 border-l-2 border-[var(--sand)] space-y-1.5 py-2 animate-fade-in">
                          {cat.tips.map((tip, ti) => (
                            <p
                              key={ti}
                              className="text-xs text-[var(--muted)] leading-relaxed flex gap-2"
                            >
                              <span className="text-[var(--amber)] flex-shrink-0">
                                •
                              </span>
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* General savings tips */}
              {data.savings_tips.length > 0 && (
                <div className="bg-[var(--sage)]/8 rounded-2xl p-4 space-y-2">
                  <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--sage)] font-bold flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    Top Savings Tips
                  </h3>
                  {data.savings_tips.map((tip, i) => (
                    <p key={i} className="text-xs text-[var(--ink)] leading-relaxed flex gap-2">
                      <span className="text-[var(--sage)] font-bold flex-shrink-0">
                        {i + 1}.
                      </span>
                      {tip}
                    </p>
                  ))}
                </div>
              )}

              {/* Splurge-worthy */}
              {data.splurge_worthy && data.splurge_worthy.length > 0 && (
                <div className="bg-[var(--amber)]/8 rounded-2xl p-4 space-y-2">
                  <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--amber)] font-bold flex items-center gap-1.5">
                    <span>✨</span>
                    Worth the Splurge
                  </h3>
                  {data.splurge_worthy.map((item, i) => (
                    <p key={i} className="text-xs text-[var(--ink)] leading-relaxed flex gap-2">
                      <span className="text-[var(--amber)] flex-shrink-0">
                        •
                      </span>
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
