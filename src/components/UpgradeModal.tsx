"use client";

import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  current?: number;
  limit?: number;
  resetsAt?: string;
}

const FEATURES = [
  { icon: "plane", label: "Unlimited trip generation" },
  { icon: "refresh", label: "Unlimited day regeneration" },
  { icon: "chat", label: "Unlimited chat modifications" },
  { icon: "share", label: "Unlimited share links" },
  { icon: "save", label: "Unlimited trip storage" },
  { icon: "bolt", label: "Priority generation speed" },
];

export default function UpgradeModal({
  isOpen,
  onClose,
  current,
  limit,
  resetsAt,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetDate = resetsAt
    ? new Date(resetsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      // Stripe not configured yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--sand)] w-full max-w-md animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[var(--amber)] to-[var(--rust)] px-6 py-8 text-center text-white">
          <div className="w-14 h-14 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-2">
            Upgrade to Pro
          </h2>
          {current !== undefined && limit !== undefined && (
            <p className="text-white/80 text-sm">
              You&apos;ve used {current} of {limit} free trips this month
              {resetDate && <span> — resets {resetDate}</span>}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="px-6 py-6 space-y-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-sm text-[var(--ink)]">
              <div className="w-5 h-5 rounded-full bg-[var(--sage)]/10 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              {f.label}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-base hover:bg-[var(--rust)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                Upgrade to Pro
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition"
          >
            Maybe later
            {resetDate && (
              <span className="block text-[0.65rem] mt-0.5">
                Free limit resets {resetDate}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
