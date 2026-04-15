"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: "error" | "success" | "info";
  duration?: number;
}

export default function Toast({ message, onClose, type = "error", duration = 5000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 300);
  };

  const colors = {
    error: { icon: "!", bg: "bg-[var(--rust)]/10", iconColor: "text-[var(--rust)]", border: "border-[var(--rust)]/25" },
    success: { icon: "\u2713", bg: "bg-[var(--sage)]/10", iconColor: "text-[var(--sage)]", border: "border-[var(--sage)]/25" },
    info: { icon: "i", bg: "bg-[var(--amber)]/10", iconColor: "text-[var(--amber)]", border: "border-[var(--amber)]/25" },
  }[type];

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${exiting ? "opacity-0 -translate-y-2" : "animate-[slideDown_0.3s_ease]"}`}>
      <div className={`bg-[var(--card)] text-[var(--ink)] px-5 py-3 rounded-2xl shadow-2xl border ${colors.border} flex items-center gap-3 text-sm max-w-md`}>
        <span className={`${colors.iconColor} text-base font-bold w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center text-[0.7rem]`}>
          {colors.icon}
        </span>
        <span className="flex-1">{message}</span>
        <button onClick={handleClose} className="text-[var(--muted)] hover:text-[var(--ink)] transition text-lg leading-none ml-2">&times;</button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="mx-4 h-[2px] bg-[var(--sand)]/30 rounded-full overflow-hidden mt-0.5">
        <div
          className="h-full bg-[var(--amber)]/40 rounded-full"
          style={{
            width: "100%",
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}
