"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-screen text-center bg-[var(--paper)]">
          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-[var(--rust)]/10 flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rust)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--ink)] mb-3">
              Something went wrong
            </h1>
            <p className="text-[var(--muted)] mb-2 text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 rounded-xl border border-[var(--sand)] text-[var(--muted)] text-sm hover:border-[var(--ink)] transition"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-5 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--rust)] transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
