"use client";

interface SavedTrip {
  id: string;
  destination: string;
  duration: number;
  budget: string;
  createdAt: string;
}

interface SavedTripsProps {
  trips: SavedTrip[];
  onLoad: (trip: SavedTrip) => void;
  onDelete: (id: string) => void;
}

export default function SavedTrips({ trips, onLoad, onDelete }: SavedTripsProps) {
  if (trips.length === 0) return null;

  return (
    <section className="px-4 pb-16 flex justify-center">
      <div className="w-full max-w-xl">
        <h3 className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)] font-medium mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Recent Trips
        </h3>
        <div className="space-y-2.5">
          {trips.map((t) => (
            <div key={t.id} onClick={() => onLoad(t)}
              className="bg-white border border-[var(--sand)]/60 rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[var(--amber)] hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[var(--paper)] flex items-center justify-center text-lg font-[family-name:var(--font-playfair)] font-bold text-[var(--amber)] group-hover:bg-[var(--amber)] group-hover:text-white transition-colors">
                {t.duration}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[var(--ink)] truncate group-hover:text-[var(--amber)] transition">{t.destination}</h4>
                <p className="text-[0.7rem] text-[var(--muted)]">{t.duration} days · {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="text-[var(--muted)] hover:text-[var(--rust)] transition text-lg px-1" aria-label="Delete trip">&times;</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export type { SavedTrip };
