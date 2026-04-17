import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...data,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  // Forward errors/warnings to Sentry when configured. No-op when Sentry.init
  // was never called (no DSN set), so this is safe in all environments.
  if (level === "error") {
    Sentry.captureMessage(msg, { level: "error", extra: data });
  } else if (level === "warn") {
    Sentry.captureMessage(msg, { level: "warning", extra: data });
  }
}

export const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    emit("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) =>
    emit("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) =>
    emit("error", msg, data),
};

export function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  meta?: Record<string, unknown>
) {
  log.info("api_request", {
    method,
    path,
    status,
    duration_ms: durationMs,
    ...meta,
  });
}
