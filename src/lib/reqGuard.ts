import type { NextRequest } from "next/server";

/**
 * Defense-in-depth request helpers. Vercel already caps body size at ~4.5 MB,
 * but we don't want to spend that much parsing or token-accounting on a
 * malicious payload for routes that expect small JSON.
 */

export class PayloadTooLargeError extends Error {
  readonly declaredBytes: number | null;
  constructor(declaredBytes: number | null) {
    super("Payload too large");
    this.name = "PayloadTooLargeError";
    this.declaredBytes = declaredBytes;
  }
}

/**
 * Read the JSON body of a request, rejecting early if Content-Length exceeds
 * `maxBytes`. Still subject to Vercel's hard cap on top.
 *
 * - Returns the parsed JSON on success.
 * - Throws PayloadTooLargeError if Content-Length is present and > maxBytes.
 * - Throws SyntaxError if the body isn't valid JSON (caller should 400).
 */
export async function readJson<T = unknown>(
  req: NextRequest,
  maxBytes: number
): Promise<T> {
  const lenHeader = req.headers.get("content-length");
  const declared = lenHeader ? Number(lenHeader) : null;
  if (declared !== null && Number.isFinite(declared) && declared > maxBytes) {
    throw new PayloadTooLargeError(declared);
  }
  return (await req.json()) as T;
}

// Size presets (bytes). JSON is one byte per ASCII char, so these are roughly
// character counts — pick them to match the schema caps + generous overhead.
export const BODY_LIMITS = {
  small: 16 * 1024, // 16 KB — simple form posts
  medium: 64 * 1024, // 64 KB — chat messages with history
  large: 512 * 1024, // 512 KB — full trip JSON
} as const;
