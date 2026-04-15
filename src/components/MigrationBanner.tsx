"use client";

import { useState } from "react";
import {
  hasPendingMigration,
  getPendingTripCount,
  migrateLocalTrips,
  dismissMigration,
} from "@/lib/migration";

export default function MigrationBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return hasPendingMigration();
  });
  const [count] = useState(() => {
    if (typeof window === "undefined") return 0;
    return visible ? getPendingTripCount() : 0;
  });
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{
    migrated: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    setMigrating(true);
    const res = await migrateLocalTrips((current, total) => {
      setProgress({ current, total });
    });
    setResult({ migrated: res.migrated, errors: res.errors });
    setMigrating(false);
  };

  const handleDismiss = () => {
    dismissMigration();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 md:mx-8 mb-4 animate-slide-up">
      <div className="max-w-xl mx-auto bg-[var(--card)] border border-[var(--amber)]/30 rounded-2xl p-4 shadow-lg">
        {result ? (
          // Result state
          <div className="text-center space-y-2">
            <p className="text-sm text-[var(--ink)] font-medium">
              {result.migrated > 0
                ? `Imported ${result.migrated} trip${result.migrated !== 1 ? "s" : ""} to your account!`
                : "No trips were imported."}
            </p>
            {result.errors.length > 0 && (
              <p className="text-xs text-[var(--rust)]">
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} occurred
              </p>
            )}
            <button
              onClick={() => {
                setVisible(false);
                window.location.reload();
              }}
              className="text-sm text-[var(--amber)] font-medium hover:text-[var(--rust)] transition"
            >
              Done
            </button>
          </div>
        ) : migrating ? (
          // Migrating state
          <div className="space-y-2">
            <p className="text-sm text-[var(--ink)] text-center">
              Importing trip {progress.current} of {progress.total}...
            </p>
            <div className="w-full h-1.5 bg-[var(--sand)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--amber)] rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ) : (
          // Prompt state
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--amber)]/10 flex items-center justify-center flex-shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--amber)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)]">
                Found {count} trip{count !== 1 ? "s" : ""} in your browser
              </p>
              <p className="text-xs text-[var(--muted)]">
                Import them to your account so they&apos;re saved permanently
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition px-2 py-1"
              >
                Skip
              </button>
              <button
                onClick={handleImport}
                className="text-xs font-medium bg-[var(--amber)] text-white px-3.5 py-1.5 rounded-lg hover:bg-[var(--rust)] transition"
              >
                Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
