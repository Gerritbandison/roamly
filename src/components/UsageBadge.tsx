"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface UsageData {
  plan: "free" | "pro";
  usage: {
    generate: { current: number; limit: number };
  };
}

export default function UsageBadge() {
  const { isSignedIn } = useAuth();
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [isSignedIn]);

  if (!isSignedIn || !data) return null;

  if (data.plan === "pro") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--amber)] bg-[var(--amber)]/10 px-3 py-1.5 rounded-xl">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--amber)" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="font-medium">Pro</span>
        <span className="text-[var(--muted)]">— Unlimited</span>
      </div>
    );
  }

  const { current, limit } = data.usage.generate;
  const remaining = Math.max(0, limit - current);
  const pct = limit > 0 ? (current / limit) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--paper)] px-3 py-2 rounded-xl border border-[var(--sand)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-[var(--ink)]">
            {remaining} trip{remaining !== 1 ? "s" : ""} left
          </span>
          <span>{current}/{limit} this month</span>
        </div>
        <div className="w-full h-1 bg-[var(--sand)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 100
                ? "bg-[var(--rust)]"
                : pct >= 66
                  ? "bg-[var(--amber)]"
                  : "bg-[var(--sage)]"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
