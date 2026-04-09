"use client";

import { useState } from "react";
import type { Trip } from "@/types/itinerary";

function tripToText(trip: Trip): string {
  const lines: string[] = [];
  lines.push(`✈️ ${trip.destination} — ${trip.duration_days}-Day Itinerary`);
  lines.push(`💰 ${trip.practical_info.budget_estimate.split(".")[0]}`);
  lines.push(`💱 ${trip.practical_info.currency.split(".")[0]}`);
  lines.push("");

  for (const day of trip.days) {
    lines.push(`━━━ Day ${day.day}: ${day.theme} ━━━`);
    if (day.date) lines.push(`📅 ${day.date}${day.region ? ` · ${day.region}` : ""}`);
    lines.push("");
    lines.push(`🌅 Morning: ${day.morning}`);
    lines.push(`☀️ Afternoon: ${day.afternoon}`);
    lines.push(`🌙 Evening: ${day.evening}`);

    if (day.food && day.food.length > 0) {
      lines.push("");
      lines.push("🍽️ Where to eat:");
      for (const f of day.food) {
        lines.push(`  • ${f.name}${f.must_try ? " ⭐" : ""} — ${f.note}`);
      }
    }

    if (day.tips) {
      lines.push(`💡 Tip: ${day.tips}`);
    }
    lines.push("");
  }

  lines.push("─────────────────────");
  lines.push(`🚌 Getting around: ${trip.practical_info.transport_tips.split(".").slice(0, 2).join(".")}.`);
  lines.push(`📅 Best time to visit: ${trip.practical_info.best_time_to_visit.split(".")[0]}.`);
  lines.push("");
  lines.push("Generated with Roamly AI ✨");

  return lines.join("\n");
}

function tripToMarkdown(trip: Trip): string {
  const lines: string[] = [];
  lines.push(`# ${trip.destination} — ${trip.duration_days}-Day Itinerary`);
  lines.push("");
  lines.push(`> **Budget:** ${trip.practical_info.budget_estimate.split(".")[0]}`);
  lines.push(`> **Currency:** ${trip.practical_info.currency.split(".")[0]}`);
  lines.push("");

  for (const day of trip.days) {
    lines.push(`## Day ${day.day}: ${day.theme}`);
    if (day.date) lines.push(`*${day.date}${day.region ? ` · ${day.region}` : ""}*`);
    lines.push("");
    lines.push(`**Morning:** ${day.morning}`);
    lines.push("");
    lines.push(`**Afternoon:** ${day.afternoon}`);
    lines.push("");
    lines.push(`**Evening:** ${day.evening}`);
    lines.push("");

    if (day.food && day.food.length > 0) {
      lines.push("### Where to Eat");
      for (const f of day.food) {
        lines.push(`- **${f.name}**${f.must_try ? " ⭐" : ""} — ${f.note}`);
      }
      lines.push("");
    }

    if (day.tips) {
      lines.push(`> 💡 ${day.tips}`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push("*Generated with [Roamly AI](https://roamly.app)*");
  return lines.join("\n");
}

export default function CopyItinerary({
  trip,
  isOpen,
  onClose,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<"text" | "markdown">("text");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = format === "text" ? tripToText(trip) : tripToMarkdown(trip);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--overlay)] backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--paper)] w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--sand)] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--sand)] px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📋</span>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--ink)]">
                Copy Itinerary
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                Share via text, email, or notes
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

        {/* Format switcher */}
        <div className="px-5 pt-4 flex gap-2">
          {(["text", "markdown"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                format === f
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--sand)]/40 text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {f === "text" ? "📝 Plain Text" : "📄 Markdown"}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-xs text-[var(--ink)] bg-white rounded-xl border border-[var(--sand)] p-4 whitespace-pre-wrap font-[family-name:var(--font-dm-sans)] leading-relaxed max-h-[50vh] overflow-y-auto">
            {content}
          </pre>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--sand)] px-5 py-4 flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              copied
                ? "bg-[var(--sage)] text-white"
                : "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--rust)]"
            }`}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
