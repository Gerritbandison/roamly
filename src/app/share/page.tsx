"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SharePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        setError(true);
        return;
      }

      // Decode base64 to binary
      const binary = atob(hash);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      let json: string;
      try {
        // Try pako decompression first (new format)
        import("pako").then((pako) => {
          try {
            const decompressed = pako.default.inflate(bytes);
            json = new TextDecoder().decode(decompressed);
            loadTrip(json);
          } catch {
            // Fall back to legacy format (base64 → URI-encoded JSON)
            try {
              json = decodeURIComponent(atob(hash));
              loadTrip(json);
            } catch {
              setError(true);
            }
          }
        });
        return;
      } catch {
        // pako import failed — try legacy format
        json = decodeURIComponent(atob(hash));
        loadTrip(json);
        return;
      }
    } catch {
      setError(true);
    }
  }, [router]);

  function loadTrip(json: string) {
    try {
      const data = JSON.parse(json);
      if (!data.trip || !data.trip.destination || !data.trip.days) {
        throw new Error("Invalid trip data");
      }
      sessionStorage.setItem("roamly_trip", JSON.stringify(data));

      // Also save to localStorage for persistence
      const id = Date.now().toString(36);
      localStorage.setItem(`roamly_trip_${id}`, JSON.stringify(data));

      router.replace(`/itinerary?id=${id}`);
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 min-h-screen text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--ink)] mb-4">
          Invalid Share Link
        </h1>
        <p className="text-[var(--muted)] mb-6 max-w-md">
          This trip link appears to be expired or invalid. Ask the person who
          shared it to send a new one.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-medium hover:bg-[var(--rust)] transition"
        >
          Plan a New Trip
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-[var(--muted)]">
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Loading shared trip...
      </div>
    </main>
  );
}
