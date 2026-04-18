import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  checkUsageLimit,
  trackUsage,
  UsageCheckUnavailableError,
} from "@/lib/usage";
import { env } from "@/lib/env";
import { modifierSchema } from "@/lib/schemas";
import { readJson, BODY_LIMITS, PayloadTooLargeError } from "@/lib/reqGuard";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId) {
      try {
        const usage = await checkUsageLimit(userId, "regenerate");
        if (!usage.allowed) {
          return new Response(
            JSON.stringify({ error: "Monthly regeneration limit reached", code: "USAGE_LIMIT", current: usage.current, limit: usage.limit, resetsAt: usage.resetsAt.toISOString() }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        if (err instanceof UsageCheckUnavailableError) {
          return new Response(
            JSON.stringify({ error: "Service temporarily unavailable — please try again" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
        throw err;
      }
    }

    let body: { trip?: unknown; dayNumber?: unknown; modifier?: unknown };
    try {
      body = await readJson(req, BODY_LIMITS.medium);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        return new Response(
          JSON.stringify({ error: "Payload too large" }),
          { status: 413, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { trip } = body as { trip: { destination: string; duration_days: number; days: Array<{ day: number; date: string; theme: string; morning: string; evening: string }> } };

    if (!trip || typeof trip !== "object" || !Array.isArray(trip.days)) {
      return new Response(
        JSON.stringify({ error: "Trip data is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate dayNumber — bounds-check against actual trip length so a
    // caller can't force regeneration for day 999 of a 5-day trip.
    if (
      typeof body.dayNumber !== "number" ||
      !Number.isInteger(body.dayNumber) ||
      body.dayNumber < 1 ||
      body.dayNumber > (trip.duration_days ?? 30)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid dayNumber" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const dayNumber = body.dayNumber;

    // Validate modifier — whitelist shape/length to prevent prompt injection.
    const modifierParsed = modifierSchema.safeParse(body.modifier ?? undefined);
    if (!modifierParsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid modifier" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const modifier = modifierParsed.data;

    const currentDay = trip.days.find(
      (d: { day: number }) => d.day === dayNumber
    );
    if (!currentDay) {
      return new Response(
        JSON.stringify({ error: `Day ${dayNumber} not found` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build context about surrounding days to maintain continuity
    const prevDay = trip.days.find(
      (d: { day: number }) => d.day === dayNumber - 1
    );
    const nextDay = trip.days.find(
      (d: { day: number }) => d.day === dayNumber + 1
    );

    const modifierText = modifier
      ? `The user wants a ${modifier} version of this day.`
      : "The user wants a completely fresh take on this day.";

    // System is split into a stable rules block (cached) + a small volatile
    // block carrying the per-request destination and modifier. Putting
    // volatile content AFTER stable content is what makes the cache usable.
    const systemRules = `You are Roamly's trip planning AI. You regenerate a SINGLE day of an existing itinerary.

Rules:
- Return ONLY a valid JSON object for the regenerated day — no markdown, no explanation, no wrapping
- Keep the exact same structure: day, date, theme, region, locations (with real lat/lng), morning, afternoon, evening, food (with must_try flags), stay, costs, tips
- Keep the same date and day number
- Stay in the same city/region unless the modifier implies otherwise
- Suggest DIFFERENT activities, restaurants, and experiences from the original
- Be specific — real place names, real prices, local knowledge
- Keep the same budget level and travel style as the rest of the trip
- Ensure continuity with surrounding days (don't revisit places already covered)`;

    const systemTail = `Destination: ${trip.destination}. ${modifierText}`;

    const tripJson = JSON.stringify(trip, null, 2);
    const contextTail = `${prevDay ? `The day before (Day ${prevDay.day}): ${prevDay.theme} — ends with: ${prevDay.evening}` : "This is the first day of the trip."}
${nextDay ? `The day after (Day ${nextDay.day}): ${nextDay.theme} — starts with: ${nextDay.morning}` : "This is the last day of the trip."}

Now regenerate Day ${dayNumber} (currently: "${currentDay.theme}"). Return ONLY the JSON object for this day.`;

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send({ type: "status", message: "Reimagining your day..." });

          const stream = getClient().messages.stream({
            model: env.AI_MODEL,
            max_tokens: 4096,
            system: [
              {
                type: "text",
                text: systemRules,
                cache_control: { type: "ephemeral" },
              },
              { type: "text", text: systemTail },
            ],
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Here is the full trip for context:\n${tripJson}`,
                    cache_control: { type: "ephemeral" },
                  },
                  { type: "text", text: contextTail },
                ],
              },
            ],
          });

          let fullText = "";

          stream.on("text", (text) => {
            fullText += text;
            send({ type: "delta", text });
          });

          await stream.finalMessage();

          // Parse the JSON response
          // The model should return raw JSON, but handle markdown fences just in case
          let jsonStr = fullText.trim();
          const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) {
            jsonStr = fenceMatch[1].trim();
          }

          const newDay = JSON.parse(jsonStr);
          // Ensure day number is correct
          newDay.day = dayNumber;
          newDay.date = currentDay.date;

          send({ type: "complete", day: newDay });
          if (userId) trackUsage(userId, "regenerate");
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to regenerate day";
          send({ type: "error", message: msg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Regenerate day error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
