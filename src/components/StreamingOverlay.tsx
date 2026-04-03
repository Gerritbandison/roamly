"use client";

export default function StreamingOverlay({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--ink)] flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-10 animate-[float_3s_ease-in-out_infinite]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[var(--paper)] font-bold mb-3">Planning Your Adventure</h2>
        <p className="text-[var(--amber)] text-sm mb-10 min-h-[20px]">{message}</p>
        <div className="w-full h-[3px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-[var(--amber)] to-[var(--rust)] rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[0.7rem] text-[rgba(255,255,255,0.25)] tabular-nums">{progress}%</p>
      </div>
    </div>
  );
}
