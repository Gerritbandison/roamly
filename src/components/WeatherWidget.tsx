"use client";

import { useEffect, useState } from "react";

interface WeatherDay {
  date: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface WeatherData {
  city: string;
  days: WeatherDay[];
  unavailable?: boolean;
}

interface Props {
  lat: number;
  lng: number;
  city?: string;
}

// Map OWM icon codes to simple emoji
function iconEmoji(code: string): string {
  if (code.startsWith("01")) return "☀️";
  if (code.startsWith("02")) return "🌤️";
  if (code.startsWith("03") || code.startsWith("04")) return "☁️";
  if (code.startsWith("09") || code.startsWith("10")) return "🌧️";
  if (code.startsWith("11")) return "⛈️";
  if (code.startsWith("13")) return "❄️";
  if (code.startsWith("50")) return "🌫️";
  return "🌡️";
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function WeatherWidget({ lat, lng, city }: Props) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (city) params.set("city", city);

    fetch(`/api/weather?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: WeatherData | null) => {
        if (d && !d.unavailable) setData(d);
      })
      .catch(() => {/* silent — widget just stays hidden */})
      .finally(() => setLoading(false));
  }, [lat, lng, city]);

  if (loading) {
    return (
      <div className="h-16 bg-[var(--paper)] rounded-xl animate-pulse" />
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[var(--paper)] rounded-xl p-3 border border-[var(--sand)]">
      <div className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)] font-medium mb-2">
        Weather · {data.city}
      </div>
      <div className="flex gap-3">
        {data.days.map((day) => (
          <div key={day.date} className="flex-1 text-center">
            <div className="text-[0.6rem] text-[var(--muted)]">{shortDate(day.date)}</div>
            <div className="text-xl my-0.5">{iconEmoji(day.icon)}</div>
            <div className="text-xs font-semibold text-[var(--ink)]">{day.high}°</div>
            <div className="text-[0.65rem] text-[var(--muted)]">{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
