"use client";

export default function ItinerarySkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--paper)]">
      {/* Hero skeleton */}
      <div className="relative h-44 md:h-56 flex-shrink-0 shimmer bg-[var(--sand)]">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:px-6">
          <div className="flex justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/15" />
            <div className="flex gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-white/15" />
              <div className="w-10 h-10 rounded-xl bg-white/15" />
            </div>
          </div>
          <div>
            <div className="h-8 w-64 bg-white/20 rounded-lg mb-2" />
            <div className="h-4 w-40 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Day strip skeleton */}
      <div className="bg-white border-b border-[var(--sand)] flex-shrink-0">
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-12 h-14 rounded-xl shimmer" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_420px]">
          <div className="px-4 md:px-8 lg:px-12 py-4 space-y-4">
            {/* Search bar skeleton */}
            <div className="h-11 w-full max-w-md rounded-xl shimmer" />

            {/* Card skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--sand)] bg-white p-5">
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 rounded-lg shimmer" />
                    <div className="h-3 w-32 rounded-lg shimmer" />
                  </div>
                </div>
                {i === 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-full rounded-lg shimmer" />
                    <div className="h-4 w-5/6 rounded-lg shimmer" />
                    <div className="h-4 w-4/6 rounded-lg shimmer" />
                    <div className="h-20 w-full rounded-xl shimmer mt-3" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Map skeleton */}
          <div className="hidden lg:block border-l border-[var(--sand)]">
            <div className="w-full h-full shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
