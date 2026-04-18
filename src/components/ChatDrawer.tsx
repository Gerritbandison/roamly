"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Trip, DayPlan } from "@/types/itinerary";

/* ── Types ───────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  update?: TripUpdate | null;
  applied?: boolean;
}

interface TripUpdate {
  type: "day" | "trip";
  day?: number;
  data: DayPlan | Trip;
}

interface ChatDrawerProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdate: (updatedTrip: Trip) => void;
}

/* ── Suggested prompts ───────────────────────────────── */
const SUGGESTIONS = [
  "What if it rains on day 2?",
  "Swap the afternoon for a cooking class",
  "Add a free day for exploring",
  "Find cheaper restaurants for day 1",
  "What should I pack?",
  "Any hidden gems near the hotel?",
];

/* ── Icons ───────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Component ───────────────────────────────────────── */
export default function ChatDrawer({ trip, isOpen, onClose, onTripUpdate }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(36),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    try {
      // Build history from previous messages. Drop empty content — if Claude
      // returned only a <trip_update> block, displayText can be "", which the
      // server-side chatHistorySchema (min(1)) would reject.
      const history = messages
        .map((m) => ({ role: m.role, content: m.content }))
        .filter((m) => m.content.trim().length > 0);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          trip,
          history,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let update: TripUpdate | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "delta") {
              fullText += event.text;
              // Strip trip_update tags from display during streaming
              const displayText = fullText.replace(/<trip_update>[\s\S]*?(<\/trip_update>)?/g, "").trim();
              setStreamingText(displayText);
            } else if (event.type === "complete") {
              fullText = event.text || fullText.replace(/<trip_update>[\s\S]*?<\/trip_update>/g, "").trim();
              update = event.update || null;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (pe) {
            if (pe instanceof Error && pe.message !== "Unexpected end of JSON input") throw pe;
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(36),
        role: "assistant",
        content: fullText,
        update,
        applied: false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingText("");
    } catch (err) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(36),
        role: "assistant",
        content: `Sorry, something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Try again?`,
      };
      setMessages((prev) => [...prev, errMsg]);
      setStreamingText("");
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, messages, trip]);

  const applyUpdate = useCallback((msg: ChatMessage) => {
    if (!msg.update) return;

    let updatedTrip: Trip;
    if (msg.update.type === "day" && msg.update.day) {
      const dayData = msg.update.data as DayPlan;
      const updatedDays = trip.days.map((d) =>
        d.day === msg.update!.day ? { ...d, ...dayData } : d
      );
      updatedTrip = { ...trip, days: updatedDays };
    } else {
      updatedTrip = { ...trip, ...(msg.update.data as Trip) };
    }

    onTripUpdate(updatedTrip);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m))
    );
  }, [trip, onTripUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed z-[2001] bg-[var(--card)] border-l border-[var(--sand)] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } right-0 top-0 h-full w-full sm:w-[400px] lg:w-[380px]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sand)] flex-shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--amber)]/10 flex items-center justify-center">
              <SparkleIcon />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] font-bold text-sm text-[var(--ink)]">
                Trip Assistant
              </h2>
              <p className="text-[0.6rem] text-[var(--muted)]">
                Ask questions or modify your itinerary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition"
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] border border-[var(--sand)] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--muted)] mb-5">
                Ask me to change your itinerary or answer travel questions.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[0.7rem] px-3 py-1.5 rounded-lg border border-[var(--sand)] text-[var(--muted)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--ink)] text-[var(--paper)] rounded-br-md"
                    : "bg-[var(--paper)] text-[var(--ink)] border border-[var(--sand)] rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Apply update button */}
                {msg.update && !msg.applied && (
                  <button
                    onClick={() => applyUpdate(msg)}
                    className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-semibold text-[var(--amber)] hover:text-[var(--rust)] transition bg-[var(--card)]/80 px-3 py-1.5 rounded-lg border border-[var(--amber)]/30"
                  >
                    <SparkleIcon /> Apply changes
                  </button>
                )}
                {msg.applied && (
                  <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-medium text-[var(--sage)]">
                    <CheckIcon /> Changes applied
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-[var(--paper)] border border-[var(--sand)] text-sm leading-relaxed text-[var(--ink)]">
                {streamingText ? (
                  <p className="whitespace-pre-wrap">{streamingText}</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-[pulse-soft_1.4s_ease-in-out_infinite]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-[pulse-soft_1.4s_ease-in-out_0.2s_infinite]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-[pulse-soft_1.4s_ease-in-out_0.4s_infinite]" />
                    </div>
                    Thinking...
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[var(--sand)] px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Swap day 3 afternoon for a food tour..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-[var(--sand)] bg-[var(--paper)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15 transition disabled:opacity-50 max-h-24"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--rust)] transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-[0.55rem] text-[var(--muted)]/50 mt-1.5 text-center">
            AI suggestions — always verify details before booking
          </p>
        </div>
      </div>
    </>
  );
}
