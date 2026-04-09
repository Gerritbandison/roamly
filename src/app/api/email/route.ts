import { NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

const BodySchema = z.object({
  to: z.string().email("Invalid email address"),
  destination: z.string().min(1).max(100),
  duration: z.number().int().min(1).max(21),
  budgetEstimate: z.string().max(100),
  summary: z.string().max(8000), // plain-text summary of the itinerary
});

function buildHtml(data: z.infer<typeof BodySchema>): string {
  const lines = data.summary
    .split("\n")
    .map((l) => `<p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#3d2e1e;">${l.replace(/</g, "&lt;")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${data.destination} Itinerary — Roamly</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#1a1208;padding:32px 40px;">
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#d4873a;">AI-Powered Trip Planner</p>
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#fff;font-family:Georgia,serif;">Roam<em style="color:#d4873a;">ly</em></h1>
        </td></tr>
        <!-- Trip title -->
        <tr><td style="background:#d4873a;padding:24px 40px;">
          <h2 style="margin:0;font-size:22px;color:#fff;font-family:Georgia,serif;">${data.destination}</h2>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${data.duration} days · ${data.budgetEstimate}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">${lines}</td></tr>
        <!-- Footer -->
        <tr><td style="background:#f5f0e8;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9e8c78;">AI-generated · Prices and details are estimates. Always verify before booking.</p>
          <p style="margin:8px 0 0;font-size:11px;color:#9e8c78;">Sent via <a href="https://roamly.vercel.app" style="color:#d4873a;text-decoration:none;">Roamly</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const rl = rateLimit(`email:${ip}`, 3, 60_000); // 3 emails/min
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Send via Resend if configured ────────────────────
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Roamly <itinerary@roamly.vercel.app>",
          to: [data.to],
          subject: `Your ${data.destination} itinerary from Roamly`,
          html: buildHtml(data),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend ${res.status}: ${err}`);
      }

      log.info("email_sent", { to: data.to, destination: data.destination, ip });
      return Response.json({ sent: true });
    } catch (err) {
      log.error("email_send_error", {
        error: err instanceof Error ? err.message : String(err),
        ip,
      });
      return Response.json({ error: "Failed to send email" }, { status: 502 });
    }
  }

  // ── Fallback: return formatted text for client-side mailto ──
  log.info("email_mailto_fallback", { destination: data.destination, ip });
  return Response.json({
    sent: false,
    mailto: true,
    subject: encodeURIComponent(
      `My ${data.destination} itinerary from Roamly`
    ),
    body: encodeURIComponent(data.summary),
  });
}
