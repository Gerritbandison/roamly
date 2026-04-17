import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/share(.*)",
  "/s/(.*)",
  "/api/weather",
  "/api/currency",
  "/api/stripe/webhook",
]);

// CORS config
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function isAllowedOrigin(origin: string) {
  // Require an explicit, matching Origin header. Same-origin requests from a
  // browser may omit Origin on simple GETs, but those don't need CORS
  // response headers anyway. Never treat missing/unknown origins as trusted.
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((o) => origin === o);
}

export const proxy = clerkMiddleware(async (auth, request) => {
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const origin = request.headers.get("origin") ?? "";
  const allowed = isAllowedOrigin(origin);
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  // Handle CORS preflight for API routes
  if (isApi && request.method === "OPTIONS") {
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

  // Add CORS headers for API routes
  if (isApi && allowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      response.headers.set(k, v);
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
