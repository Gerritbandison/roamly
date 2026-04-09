import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, trip, history } = body;

    if (!message || !trip) {
      return new Response(
        JSON.stringify({ error: "Message and trip data are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // Build message history for multi-turn conversation
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Include recent conversation history (last 6 messages max)
    if (history && Array.isArray(history)) {
      const recent = history.slice(-6);
      for (const msg of recent) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add the current message with trip context
    messages.push({
      role: "user",
      content: `Here is my current itinerary:\n\n${tripContext}\n\nMy request: ${message}`,
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
            model: "claude-sonnet-4-20250514",
            max_tokens: 8192,
            messages,
            system: systemPrompt,
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
