"use client";

import { useState } from "react";
import type { Trip } from "@/types/itinerary";

interface FavoriteItem {
  type: "place" | "food";
  name: string;
  day: number;
  note?: string;
}

export function useFavorites(tripId: string) {
  const key = `roamly_favorites_${tripId}`;
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const toggle = (item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => f.type === item.type && f.name === item.name && f.day === item.day
      );
      const next = exists
        ? prev.filter(
            (f) => !(f.type === item.type && f.name === item.name && f.day === item.day)
          )
        : [...prev, item];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const isFav = (type: "place" | "food", name: string, day: number) =>
    favorites.some((f) => f.type === type && f.name === name && f.day === day);

  return { favorites, toggle, isFav };
}

/* ── Favorites Panel (modal) ── */
export default function FavoritesPanel({
  favorites,
  isOpen,
  onClose,
  onScrollToDay,
}: {
  trip: Trip;
  favorites: FavoriteItem[];
  isOpen: boolean;
  onClose: () => void;
  onScrollToDay: (day: number) => void;
}) {
  if (!isOpen) return null;

  const places = favorites.filter((f) => f.type === "place");
  const foods = favorites.filter((f) => f.type === "food");

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--paper)] w-full max-w-md max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--sand)] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--sand)] px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⭐</span>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--ink)]">
                My Favorites
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                {favorites.length} saved {favorites.length === 1 ? "item" : "items"}
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
          {favorites.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">⭐</div>
              <p className="text-sm text-[var(--muted)]">
                No favorites yet. Tap the star icon on places and food to save them here.
              </p>
            </div>
          )}

          {/* Places */}
          {places.length > 0 && (
            <div>
              <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-3">
                📍 Places ({places.length})
              </h3>
              <div className="space-y-2">
                {places.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { onScrollToDay(p.day); onClose(); }}
                    className="w-full text-left bg-[var(--card)] rounded-xl border border-[var(--sand)] p-3 hover:border-[var(--amber)]/40 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--ink)]">{p.name}</span>
                      <span className="text-[0.6rem] text-[var(--muted)] bg-[var(--paper)] px-2 py-0.5 rounded-md">
                        Day {p.day}
                      </span>
                    </div>
                    {p.note && (
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{p.note}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Foods */}
          {foods.length > 0 && (
            <div>
              <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-3">
                🍽️ Food & Dining ({foods.length})
              </h3>
              <div className="space-y-2">
                {foods.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => { onScrollToDay(f.day); onClose(); }}
                    className="w-full text-left bg-[var(--card)] rounded-xl border border-[var(--sand)] p-3 hover:border-[var(--amber)]/40 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--ink)]">{f.name}</span>
                      <span className="text-[0.6rem] text-[var(--muted)] bg-[var(--paper)] px-2 py-0.5 rounded-md">
                        Day {f.day}
                      </span>
                    </div>
                    {f.note && (
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{f.note}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
