"use client";

import { useState, useEffect, useCallback } from "react";
import type { Trip } from "@/types/itinerary";

interface PackingItem {
  name: string;
  checked: boolean;
}

interface PackingCategory {
  category: string;
  emoji: string;
  items: PackingItem[];
}

interface PackingListProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackingList({ trip, isOpen, onClose }: PackingListProps) {
  const [categories, setCategories] = useState<PackingCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `roamly_packing_${trip.destination.replace(/\s+/g, "_").toLowerCase()}`;

  // Load from localStorage or generate
  useEffect(() => {
    if (!isOpen) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCategories(JSON.parse(stored));
        return;
      }
    } catch { /* fall through to generate */ }

    // Auto-generate if no saved list
    if (categories.length === 0 && !loading) {
      generateList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Persist to localStorage on check changes
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(categories));
    }
  }, [categories, storageKey]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const generateList = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/packing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip }),
      });

      if (!res.ok) throw new Error("Failed to generate packing list");

      const data = await res.json();
      const list: PackingCategory[] = data.categories.map(
        (cat: { category: string; emoji: string; items: string[] }) => ({
          category: cat.category,
          emoji: cat.emoji,
          items: cat.items.map((name: string) => ({ name, checked: false })),
        })
      );
      setCategories(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = useCallback((catIndex: number, itemIndex: number) => {
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci === catIndex
          ? {
              ...cat,
              items: cat.items.map((item, ii) =>
                ii === itemIndex ? { ...item, checked: !item.checked } : item
              ),
            }
          : cat
      )
    );
  }, []);

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const checkedItems = categories.reduce(
    (s, c) => s + c.items.filter((i) => i.checked).length,
    0
  );
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[var(--sand)] w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[var(--sand)] px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              🎒 Packing List
            </h2>
            <p className="text-[0.65rem] text-[var(--muted)] mt-0.5">
              {trip.destination} · {trip.duration_days} days
            </p>
          </div>
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <button
                onClick={generateList}
                disabled={loading}
                className="text-[0.65rem] text-[var(--muted)] hover:text-[var(--amber)] transition px-2 py-1 rounded-lg hover:bg-[var(--paper)]"
                title="Regenerate list"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={loading ? "animate-spin" : ""}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--ink)] text-xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {categories.length > 0 && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between text-[0.65rem] text-[var(--muted)] mb-1.5">
              <span>
                {checkedItems} of {totalItems} packed
              </span>
              <span className="font-semibold text-[var(--sage)]">{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--sand)]/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--sage)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading && categories.length === 0 && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--amber)"
                  strokeWidth="2"
                  className="animate-spin"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Generating your packing list...
              </div>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--rust)] mb-3">{error}</p>
              <button
                onClick={generateList}
                className="text-sm px-4 py-2 rounded-xl bg-[var(--amber)] text-white hover:bg-[var(--rust)] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {categories.map((cat, catIndex) => (
            <div key={cat.category} className="mt-4">
              <h3 className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium flex items-center gap-1.5 mb-2">
                <span>{cat.emoji}</span>
                {cat.category}
                <span className="ml-auto text-[var(--sage)] normal-case tracking-normal">
                  {cat.items.filter((i) => i.checked).length}/{cat.items.length}
                </span>
              </h3>
              <div className="space-y-1">
                {cat.items.map((item, itemIndex) => (
                  <label
                    key={itemIndex}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                      item.checked
                        ? "bg-[var(--sage)]/8 text-[var(--muted)]"
                        : "hover:bg-[var(--paper)] text-[var(--ink)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(catIndex, itemIndex)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.checked
                          ? "bg-[var(--sage)] border-[var(--sage)]"
                          : "border-[var(--sand)] bg-white"
                      }`}
                    >
                      {item.checked && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        item.checked ? "line-through" : ""
                      }`}
                    >
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
