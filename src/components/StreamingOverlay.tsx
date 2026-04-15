"use client";

export default function StreamingOverlay({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--ink)] flex flex-col items-center justify-center px-6">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--amber)] opacity-[0.04] blur-[80px] animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[var(--rust)] opacity-[0.05] blur-[60px] animate-[float_8s_ease-in-out_1s_infinite]" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-[var(--sage)] opacity-[0.03] blur-[50px] animate-[float_7s_ease-in-out_2s_infinite]" />
      </div>

      <div className="max-w-sm w-full text-center relative z-10">
        {/* Animated plane with trail */}
        <div className="mb-10 relative">
          <div className="animate-[float_3s_ease-in-out_infinite]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto drop-shadow-[0_0_12px_rgba(212,135,58,0.4)]">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          {/* Trail dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[var(--amber)]"
                style={{
                  opacity: 0.15 + i * 0.08,
                  animation: `pulse-soft 2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[var(--paper)] font-bold mb-3">
          Planning Your Adventure
        </h2>
        <p className="text-[var(--amber)] text-sm mb-10 min-h-[20px] transition-all duration-500">{message}</p>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--amber)] to-[var(--rust)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>
        <p className="text-[0.7rem] text-[rgba(255,255,255,0.25)] tabular-nums">{progress}%</p>

        {/* Stage indicators */}
        <div className="mt-8 flex justify-center gap-1.5">
          {["Research", "Plan", "Detail", "Polish"].map((stage, i) => {
            const stageProgress = [0, 25, 55, 85];
            const active = progress >= stageProgress[i];
            return (
              <span
                key={stage}
                className={`text-[0.55rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full transition-all duration-500 ${
                  active
                    ? "bg-[var(--amber)]/15 text-[var(--amber)] font-medium"
                    : "text-[rgba(255,255,255,0.15)]"
                }`}
              >
                {stage}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
