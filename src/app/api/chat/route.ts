import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  checkUsageLimit,
  trackUsage,
  UsageCheckUnavailableError,
} from "@/lib/usage";
import { env } from "@/lib/env";
import { chatHistorySchema, chatMessageContentSchema } from "@/lib/schemas";
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
        const usage = await checkUsageLimit(userId, "chat");
        if (!usage.allowed) {
          return new Response(
            JSON.stringify({ error: "Monthly chat limit reached", code: "USAGE_LIMIT", current: usage.current, limit: usage.limit, resetsAt: usage.resetsAt.toISOString() }),
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

    let body: { message?: unknown; trip?: unknown; history?: unknown };
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

    // Validate user message — length-cap and strip control chars so a user
    // can't inject fake "assistant:" / "system:" directives via newlines.
    const msgParsed = chatMessageContentSchema.safeParse(body.message);
    if (!msgParsed.success) {
      return new Response(
        JSON.stringify({
          error: msgParsed.error.issues[0]?.message ?? "Invalid message",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const message = msgParsed.data;

    // Body-size guard (via readJson above) already bounds payload. We don't
    // fully validate trip shape here because in-flight edits can include
    // partially-populated trips from older localStorage entries.
    if (body.trip == null || typeof body.trip !== "object") {
      return new Response(
        JSON.stringify({ error: "Trip data is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const trip = body.trip;

    const history = body.history;

    const systemPrompt = `You are Roamly's trip planning assistant. The user has an existing itinerary and wants to modify or ask questions about it. You have two modes:

MODE 1 — MODIFICATION: When the user asks to change something (swap an activity, add a day, change a restaurant, adjust for weather, etc.), respond with BOTH:
- A brief, friendly explanation of what you changed
- The modified trip JSON wrapped in <trip_update> tags

The JSON inside <trip_update> must match the original structure exactly. Only include the fields that changed. For a single day change, return just that day object. For broader changes, return the full trip object.

Single day update format:
<trip_update>
{"type": "day", "day": 3, "data": { ...full day object with all fields... }}
</trip_update>

Full trip update format:
<trip_update>
{"type": "trip", "data": { ...full trip object... }}
</trip_update>

MODE 2 — QUESTION: When the user asks a question (best time to visit, visa info, packing tips, restaurant recommendations), just answer conversationally. No <trip_update> tags needed.

Key rules:
- Be specific — name real places, give real prices
- Keep the same style as the original itinerary (opinionated, local knowledge)
- When modifying, preserve all unaffected parts of the itinerary exactly
- Each day must keep all required fields: day, date, theme, region, locations (with lat/lng), morning, afternoon, evening, food, stay, costs, tips
- Be concise — travelers want quick answers, not essays`;

    const tripContext = JSON.stringify(trip, null, 2);

    // Build message history for multi-turn conversation.
    // Each message's content is an array of content blocks so we can apply
    // cache_control to the large, stable trip JSON.
    const messages: Anthropic.Messages.MessageParam[] = [];

    // Include recent conversation history (last 6 messages max).
    // Validate shape so a malformed client can't inject arbitrary roles or
    // oversized payloads into the Claude request.
    if (history !== undefined) {
      const historyParsed = chatHistorySchema.safeParse(history);
      if (!historyParsed.success) {
        return new Response(
          JSON.stringify({ error: "Invalid chat history" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      for (const msg of historyParsed.data.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // The trip JSON is stable across every follow-up message in a chat
    // session. Put it in its own content block with a 5-minute cache
    // breakpoint so subsequent chat turns read from the prompt cache
    // instead of re-ingesting 2-10 KB of trip context each time.
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `Here is my current itinerary:\n\n${tripContext}`,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `My request: ${message}`,
        },
      ],
    });

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
          const stream = getClient().messages.stream({
            model: env.AI_MODEL,
            max_tokens: 8192,
            messages,
            system: [
              {
                type: "text",
                text: systemPrompt,
                cache_control: { type: "ephemeral" },
              },
            ],
          });

          let fullText = "";

          stream.on("text", (text) => {
            fullText += text;
            send({ type: "delta", text });
          });

          await stream.finalMessage();

          // Parse any trip update from the response
          const updateMatch = fullText.match(
            /<trip_update>([\s\S]*?)<\/trip_update>/
          );

          if (updateMatch) {
            try {
              const update = JSON.parse(updateMatch[1].trim());
              // Strip the trip_update tags from the display text
              const displayText = fullText
                .replace(/<trip_update>[\s\S]*?<\/trip_update>/, "")
                .trim();
              send({ type: "complete", text: displayText, update });
            } catch {
              // JSON parse failed — send as plain text
              send({ type: "complete", text: fullText, update: null });
            }
          } else {
            send({ type: "complete", text: fullText, update: null });
          }
          // Track usage on success
          if (userId) trackUsage(userId, "chat");
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown error occurred";
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
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
