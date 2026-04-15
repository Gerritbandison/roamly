"use client";

import { useState } from "react";
import Link from "next/link";
import DayCard from "@/components/DayCard";
import type { Trip } from "@/types/itinerary";

interface SharedTripViewProps {
  trip: Trip;
  code: string;
  views: number;
}

export default function SharedTripView({ trip, code, views }: SharedTripViewProps) {
  const [activeDay, setActiveDay] = useState(1);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--sand)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-playfair)] font-bold text-[var(--ink)]"
            >
              Roam<span className="italic text-[var(--amber)]">ly</span>
            </Link>
            <span className="text-[var(--sand)]">|</span>
            <span className="text-xs text-[var(--muted)]">Shared trip</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.6rem] text-[var(--muted)]">
              {views} view{views !== 1 ? "s" : ""}
            </span>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              Plan Your Own
            </Link>
          </div>
        </div>
      </div>

      {/* Trip info */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--ink)] mb-2">
          {trip.destination}
        </h1>
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {trip.duration_days} days
          </span>
          <span>{trip.practical_info.currency}</span>
          <span className="text-[var(--amber)] font-medium">
            {trip.practical_info.budget_estimate}
          </span>
        </div>
      </div>

      {/* Day strip */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {trip.days.map((d) => (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl transition-all ${
                d.day === activeDay
                  ? "bg-[var(--ink)] text-[var(--paper)] shadow-md"
                  : "text-[var(--muted)] hover:bg-[var(--paper)]"
              }`}
            >
              <span className={`text-[0.6rem] uppercase tracking-wider font-medium ${d.day === activeDay ? "text-[var(--amber)]" : ""}`}>
                Day
              </span>
              <span className={`font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight ${d.day === activeDay ? "text-white" : "text-[var(--ink)]"}`}>
                {d.day}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Day cards */}
      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-4">
        {trip.days.map((day) => (
          <DayCard
            key={day.day}
            day={day}
            isActive={day.day === activeDay}
            onClick={() => setActiveDay(day.day)}
          />
        ))}

        {/* Practical info */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--sand)] p-6 space-y-3 mt-6">
          <h3 className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium">
            Practical Info
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-[var(--ink)]">
            <div><span className="text-[var(--muted)] text-xs">Best time: </span>{trip.practical_info.best_time_to_visit}</div>
            <div><span className="text-[var(--muted)] text-xs">Currency: </span>{trip.practical_info.currency}</div>
            <div><span className="text-[var(--muted)] text-xs">Transport: </span>{trip.practical_info.transport_tips}</div>
            <div><span className="text-[var(--muted)] text-xs">Budget: </span>{trip.practical_info.budget_estimate}</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-sm text-[var(--muted)] mb-4">
            Like this itinerary? Plan your own trip in seconds.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--ink)] text-[var(--paper)] font-semibold hover:bg-[var(--rust)] transition shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
            Plan My Trip — Free
          </Link>
        </div>

        <p className="text-center text-[0.6rem] text-[var(--muted)]">
          AI-generated — prices, hours, and details are estimates. Always verify before booking.
          <br />
          Shared via Roamly · <code className="text-[var(--amber)]">/s/{code}</code>
        </p>
      </div>
    </div>
  );
}
