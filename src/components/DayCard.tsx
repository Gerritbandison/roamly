"use client";

import { useState } from "react";
import type { DayPlan } from "@/types/itinerary";

export type RegenerateModifier = "more adventurous" | "more relaxed" | "more cultural" | "more foodie" | "budget-friendly" | "";

interface FavoriteItem {
  type: "place" | "food";
  name: string;
  day: number;
  note?: string;
}

interface DayCardProps {
  day: DayPlan;
  tripId?: string;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onRegenerate?: (dayNumber: number, modifier: RegenerateModifier) => void;
  isRegenerating?: boolean;
  isPrintMode?: boolean;
  onToggleFavorite?: (item: FavoriteItem) => void;
  isFavorite?: (type: "place" | "food", name: string, day: number) => boolean;
}

/* ── Time-block icons ─────────────────────────────────── */
const SunriseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="9" x2="12" y2="2" /><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" /><line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" /><line x1="23" y1="22" x2="1" y2="22" /><polyline points="8 6 12 2 16 6" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UtensilsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const BedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8" />
  </svg>
);

const CostIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

const MODIFIERS: { label: string; value: RegenerateModifier; emoji: string }[] = [
  { label: "Adventurous", value: "more adventurous", emoji: "🧗" },
  { label: "Relaxed", value: "more relaxed", emoji: "🧘" },
  { label: "Cultural", value: "more cultural", emoji: "🏛️" },
  { label: "Foodie", value: "more foodie", emoji: "🍜" },
  { label: "Budget", value: "budget-friendly", emoji: "💰" },
];

const NoteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function DayCard({ day, tripId, isActive, onClick, onEdit, onRegenerate, isRegenerating, isPrintMode, onToggleFavorite, isFavorite }: DayCardProps) {
  const [showModifiers, setShowModifiers] = useState(false);
  const noteKey = `roamly_note_${tripId || "default"}_${day.day}`;
  const [note, setNote] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(noteKey) || "";
    } catch { return ""; }
  });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const dayTotal = day.costs?.find((c) => c.item.toLowerCase().includes("total"));
  const expanded = isActive || isPrintMode;

  const saveNote = (val: string) => {
    setNote(val);
    try {
      if (val.trim()) {
        localStorage.setItem(noteKey, val);
      } else {
        localStorage.removeItem(noteKey);
      }
    } catch { /* ignore */ }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all cursor-pointer break-inside-avoid ${
        isPrintMode
          ? "border-[var(--sand)] bg-[var(--card)] mb-4 cursor-default"
          : isActive
            ? "border-[var(--amber)]/40 bg-[var(--card)] shadow-lg shadow-[rgba(212,135,58,0.08)] ring-1 ring-[var(--amber)]/10"
            : "border-[var(--sand)] bg-[var(--card)] hover:border-[var(--amber)]/30 hover:shadow-md"
      }`}
    >
      {/* ── Header ────────────────────────────────── */}
      <div className="px-5 py-4 flex gap-4 items-start">
        {/* Day number circle */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-[family-name:var(--font-playfair)] text-lg font-bold transition-colors ${
            isActive || isPrintMode
              ? "bg-[var(--amber)] text-white"
              : "bg-[var(--paper)] text-[var(--amber)]"
          }`}
        >
          {day.day}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-[family-name:var(--font-playfair)] text-[1rem] font-bold text-[var(--ink)] leading-snug">
            {day.theme}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--muted)]">{day.date}</span>
            {day.region && (
              <>
                <span className="text-[var(--sand)]">·</span>
                <span className="text-[0.65rem] text-[var(--rust)] font-medium">{day.region}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {dayTotal && (
            <span className="text-xs font-semibold text-[var(--sage)] bg-[rgba(74,122,86,0.08)] px-2.5 py-1 rounded-lg">
              {dayTotal.cost}
            </span>
          )}
          {isActive && !isPrintMode && (
            <div className="flex items-center gap-1">
              {onRegenerate && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowModifiers(!showModifiers); }}
                  disabled={isRegenerating}
                  className={`p-1.5 rounded-lg transition print:hidden ${
                    isRegenerating
                      ? "text-[var(--amber)] animate-spin"
                      : showModifiers
                        ? "bg-[var(--amber)]/10 text-[var(--amber)]"
                        : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--amber)]"
                  }`}
                  title="Regenerate this day"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--amber)] transition print:hidden"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded Content ──────────────────────── */}
      {/* Regenerate modifier selector */}
      {showModifiers && isActive && !isPrintMode && onRegenerate && (
        <div className="px-5 pb-2 print:hidden" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[var(--paper)] rounded-xl p-3 border border-[var(--amber)]/20">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-2">
              Regenerate with a vibe
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MODIFIERS.map((m) => (
                <button
                  key={m.value}
                  disabled={isRegenerating}
                  onClick={() => { onRegenerate(day.day, m.value); setShowModifiers(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--sand)] bg-[var(--card)] text-[var(--ink)] hover:border-[var(--amber)] hover:bg-[var(--amber)]/5 transition disabled:opacity-50"
                >
                  {m.emoji} {m.label}
                </button>
              ))}
              <button
                disabled={isRegenerating}
                onClick={() => { onRegenerate(day.day, ""); setShowModifiers(false); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--amber)] bg-[var(--amber)]/10 text-[var(--amber)] font-medium hover:bg-[var(--amber)] hover:text-white transition disabled:opacity-50"
              >
                🎲 Surprise me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerating overlay */}
      {isRegenerating && isActive && (
        <div className="px-5 pb-3 print:hidden">
          <div className="bg-[var(--amber)]/5 border border-[var(--amber)]/20 rounded-xl p-4 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin flex-shrink-0">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span className="text-sm text-[var(--ink)]">Reimagining this day...</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Time blocks */}
          <div className="space-y-3">
            {[
              { icon: <SunriseIcon />, label: "Morning", text: day.morning, color: "text-[#d4873a]" },
              { icon: <SunIcon />, label: "Afternoon", text: day.afternoon, color: "text-[#c0502a]" },
              { icon: <MoonIcon />, label: "Evening", text: day.evening, color: "text-[#5a4a3a]" },
            ].map((block) => (
              <div key={block.label} className="flex gap-3">
                <div className={`mt-0.5 ${block.color}`}>{block.icon}</div>
                <div className="flex-1 min-w-0">
                  <SectionLabel>{block.label}</SectionLabel>
                  <p className="text-sm text-[var(--ink)] leading-relaxed mt-0.5">{block.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Food */}
          {day.food && day.food.length > 0 && (
            <div className="bg-[var(--paper)] rounded-xl p-4">
              <SectionLabel icon={<UtensilsIcon />}>Where to Eat</SectionLabel>
              <div className="mt-2 space-y-2">
                {day.food.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm group/food">
                    <span className={`font-medium flex-shrink-0 ${f.must_try ? "text-[var(--rust)]" : "text-[var(--ink)]"}`}>
                      {f.name}
                      {f.must_try && (
                        <span className="ml-1.5 text-[0.55rem] uppercase tracking-wide bg-[var(--rust)]/10 text-[var(--rust)] px-1.5 py-0.5 rounded-md font-semibold align-middle">
                          must try
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--muted)] text-[0.8rem] leading-relaxed flex-1">{f.note}</span>
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite({ type: "food", name: f.name, day: day.day, note: f.note }); }}
                        className="opacity-0 group-hover/food:opacity-100 transition p-0.5 flex-shrink-0"
                        title={isFavorite?.("food", f.name, day.day) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={isFavorite?.("food", f.name, day.day) ? "var(--amber)" : "none"} stroke="var(--amber)" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy dining */}
          {(!day.food || day.food.length === 0) && day.dining && day.dining.length > 0 && (
            <div className="bg-[var(--paper)] rounded-xl p-4">
              <SectionLabel icon={<UtensilsIcon />}>Dining</SectionLabel>
              <div className="mt-2 space-y-1.5 text-sm text-[var(--ink)]">
                {day.dining.map((d, i) => <p key={i}>{d}</p>)}
              </div>
            </div>
          )}

          {/* Stay */}
          {day.stay && (
            <div className="bg-[var(--ink)] rounded-xl p-4 text-[var(--paper)] print:bg-[var(--sand)] print:text-[var(--ink)]">
              <SectionLabel icon={<BedIcon />}><span className="text-[var(--amber)]">Stay</span></SectionLabel>
              <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-[family-name:var(--font-playfair)] font-bold text-base">{day.stay.name}</span>
                <span className="text-[0.7rem] bg-[var(--amber)] text-[var(--ink)] px-2 py-0.5 rounded-lg font-semibold">{day.stay.price}</span>
              </div>
              {day.stay.note && (
                <p className="text-[0.75rem] text-[var(--paper)]/60 print:text-[var(--muted)] mt-1 leading-relaxed">{day.stay.note}</p>
              )}
            </div>
          )}

          {/* Costs */}
          {day.costs && day.costs.length > 0 && (
            <div>
              <SectionLabel icon={<CostIcon />}>Daily Costs</SectionLabel>
              <div className="mt-2 bg-[var(--paper)] rounded-xl overflow-hidden">
                {day.costs.map((c, i) => {
                  const isTotal = c.item.toLowerCase().includes("total");
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-2 text-sm ${
                        isTotal
                          ? "bg-[var(--card)] font-semibold border-t border-[var(--sand)]"
                          : "border-b border-[var(--card)]/60"
                      }`}
                    >
                      <span className="text-[var(--ink)]">{c.item}</span>
                      <span className={isTotal ? "text-[var(--rust)]" : "text-[var(--sage)] font-medium"}>
                        {c.cost}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips */}
          {day.tips && (
            <div className="flex gap-3 bg-[var(--amber)]/8 rounded-xl p-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-sm text-[var(--ink)] leading-relaxed">{day.tips}</p>
            </div>
          )}

          {/* Location pills */}
          {day.locations.length > 0 && (
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              }>Places</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {day.locations.map((loc, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-[var(--paper)] text-[var(--muted)] rounded-lg group/loc">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:text-[var(--amber)] transition"
                    title={`${loc.name} on Google Maps`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {loc.name}
                  </a>
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite({ type: "place", name: loc.name, day: day.day, note: loc.notes }); }}
                      className="pr-2 opacity-0 group-hover/loc:opacity-100 transition"
                      title={isFavorite?.("place", loc.name, day.day) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={isFavorite?.("place", loc.name, day.day) ? "var(--amber)" : "none"} stroke="var(--amber)" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  )}
                </span>
              ))}
            </div>
            </div>
          )}

          {/* Personal Note */}
          <div className="print:hidden" onClick={(e) => e.stopPropagation()}>
            {(note || showNoteInput) ? (
              <div className="bg-[var(--paper)] rounded-xl border border-dashed border-[var(--sand)] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <SectionLabel icon={<NoteIcon />}>
                    <span className="text-[var(--sage)]">My Note</span>
                  </SectionLabel>
                  {note && !showNoteInput && (
                    <button
                      onClick={() => setShowNoteInput(true)}
                      className="text-[0.55rem] text-[var(--muted)] hover:text-[var(--amber)] transition"
                    >
                      edit
                    </button>
                  )}
                </div>
                {showNoteInput ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Remind myself to..."
                      rows={2}
                      autoFocus
                      className="w-full text-sm text-[var(--ink)] bg-white rounded-lg border border-[var(--sand)] px-3 py-2 resize-none focus:outline-none focus:border-[var(--amber)] transition placeholder:text-[var(--muted)]/40"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { saveNote(""); setShowNoteInput(false); }}
                        className="text-[0.65rem] text-[var(--muted)] hover:text-red-500 transition px-2 py-1"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => { saveNote(note); setShowNoteInput(false); }}
                        className="text-[0.65rem] bg-[var(--sage)] text-white px-3 py-1 rounded-lg hover:bg-[var(--sage)]/80 transition font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ink)]/70 leading-relaxed whitespace-pre-wrap">{note}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowNoteInput(true)}
                className="w-full text-left text-xs text-[var(--muted)]/50 hover:text-[var(--sage)] py-2 flex items-center gap-1.5 transition"
              >
                <NoteIcon />
                Add a personal note...
              </button>
            )}
          </div>

          {/* Verification note */}
          <p className="text-[0.58rem] text-[var(--muted)]/50 italic text-center print:hidden">
            AI estimate — verify prices and hours before booking
          </p>
        </div>
      )}
    </div>
  );
}
