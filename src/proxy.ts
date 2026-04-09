import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: middleware.ts renamed to proxy.ts, export renamed to `proxy`

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function isAllowedOrigin(origin: string) {
  if (!origin) return true; // same-origin requests have no Origin header
  return ALLOWED_ORIGINS.some((o) => origin === o);
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = isAllowedOrigin(origin);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        headers: {
          ...(allowed && origin
            ? { "Access-Control-Allow-Origin": origin }
            : {}),
          ...CORS_HEADERS,
        },
      }
    );
  }

  const response = NextResponse.next();

  if (allowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    response.headers.set(k, v);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
