"use client";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease]">
      <div className="bg-[var(--ink)] text-[var(--paper)] px-5 py-3 rounded-2xl shadow-2xl border border-[rgba(212,135,58,0.25)] flex items-center gap-3 text-sm">
        <span className="text-[var(--rust)] text-base">!</span>
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-white transition text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}
