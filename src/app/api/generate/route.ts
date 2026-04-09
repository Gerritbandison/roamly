import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local or your Vercel environment variables."
    );
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── Route ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, startDate, endDate, travelers, budget, interests } =
      body;

    if (!destination || !startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "Destination, start date, and end date are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    if (days < 1 || days > 21) {
      return new Response(
        JSON.stringify({ error: "Trip must be between 1 and 21 days" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Detect multi-city trip
    const isMultiCity = destination.includes("→") || destination.includes("->");
    const stops = isMultiCity
      ? destination.split(/→|->/).map((s: string) => s.trim()).filter(Boolean)
      : [destination];

    const multiCityRules = isMultiCity
      ? `\n\nMULTI-CITY TRIP RULES (this trip visits ${stops.length} stops: ${stops.join(" → ")}):
- Allocate days intelligently across stops based on how much each city has to offer
- Include dedicated TRAVEL DAYS between cities — theme them as "Travel: [City A] → [City B]"
- On travel days, include the transport mode (train, bus, flight, ferry), duration, cost, and booking tips
- The region field should reflect which city/stop the traveler is in that day
- Suggest the optimal route order if the user's order seems suboptimal
- Include practical transfer info (which train station, which terminal, luggage storage)
- Travel days can still have activities — e.g. morning in departure city, evening in arrival city`
      : "";

    const systemPrompt = `You are an expert travel planner who creates detailed, opinionated, and genuinely useful day-by-day itineraries. Your style is specific and local — you name actual restaurants, give real prices, mention the best exchange offices, warn about tourist traps, and write with personality. You sound like a well-traveled friend who's been there, not a guidebook.

Key rules:
- Name SPECIFIC places, not generic categories. "Confeitaria Nacional on Praça da Figueira" not "a local bakery"
- Include real prices in local currency AND USD equivalents
- Flag must-try dishes with must_try: true — be selective, max 1-2 per day
- Each day's costs should itemize accommodation, food, transport, and activities separately
- The region field groups days geographically (e.g. "Northern Albania", "Central Lisbon")
- Accommodation should include specific hostel/hotel names with per-night prices
- Tips should be genuinely useful and specific — not "wear comfortable shoes"${multiCityRules}

You MUST respond with valid JSON only — no markdown, no code fences, no extra text. Just the JSON object.`;

    const userPrompt = `Plan a ${days}-day trip to ${destination}.${isMultiCity ? `\n\nThis is a MULTI-CITY trip visiting: ${stops.join(" → ")}. Distribute the ${days} days across all stops, with travel days between them.` : ""}

Details:
- Start date: ${startDate}
- End date: ${endDate}
- Number of travelers: ${travelers}
- Budget level: ${budget}
- Interests/vibe: ${interests || "general sightseeing and local culture"}

Return a JSON object with this EXACT structure:
{
  "trip": {
    "destination": "string — full destination name with country",
    "duration_days": ${days},
    "days": [
      {
        "day": 1,
        "date": "${startDate}",
        "theme": "string — short theme like 'Arrival & Old Town'",
        "region": "string — geographic region within the destination",
        "locations": [
          { "name": "string — specific place name", "lat": number, "lng": number, "notes": "brief note about this spot" }
        ],
        "morning": "string — detailed morning plan with specific places, prices, and practical details",
        "afternoon": "string — detailed afternoon plan",
        "evening": "string — detailed evening plan",
        "food": [
          { "name": "string — dish or restaurant name", "note": "description with price", "must_try": false }
        ],
        "stay": {
          "name": "string — specific accommodation name",
          "price": "string — price per night like '€15-20/night'",
          "note": "string — practical note about location, booking, etc."
        },
        "costs": [
          { "item": "string — cost category", "cost": "string — amount like '$14'" }
        ],
        "tips": "string — specific practical tip for this day"
      }
    ],
    "practical_info": {
      "best_time_to_visit": "string",
      "currency": "string — local currency with rough USD conversion rate",
      "transport_tips": "string — how to get around",
      "budget_estimate": "string — estimated total cost per person for the full trip"
    }
  }
}

Requirements:
- Every day must have 2-4 locations with real, accurate lat/lng coordinates
- Food should include 2-3 items per day. Flag 1-2 must-try dishes per day max
- Costs should have 3-5 line items per day, plus a "Day total" as the last item
- Stay should name a specific accommodation with a real price range
- Region should group days by area (e.g. "Albanian Alps", "Southern Coast")
- Be opinionated and specific — recommend the BEST options, not every option
- Write with personality and genuine local knowledge
- Include transport between cities/areas in the costs and tips`;

    const maxTokens = Math.min(16384, 2000 + days * 1200);

    // ── Streaming SSE response ─────────────────────────────
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send({
            type: "progress",
            progress: 5,
            message: `Researching ${destination}...`,
          });

          const stream = getClient().messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: maxTokens,
            messages: [{ role: "user", content: userPrompt }],
            system: systemPrompt,
          });

          let fullText = "";
          let lastPct = 0;
          const expectedChars = days * 800;

          const stages = [
            { at: 10, msg: `Planning your ${days} days in ${destination}...` },
            { at: 25, msg: "Scouting the best local spots..." },
            { at: 40, msg: "Mapping out routes and activities..." },
            { at: 55, msg: "Finding must-try food and restaurants..." },
            { at: 70, msg: "Pricing out accommodation and transport..." },
            { at: 85, msg: "Adding insider tips and final touches..." },
          ];

          stream.on("text", (text) => {
            fullText += text;
            const pct = Math.min(
              95,
              Math.round((fullText.length / expectedChars) * 100)
            );
            if (pct - lastPct >= 4) {
              let msg = stages[0].msg;
              for (const s of stages) {
                if (pct >= s.at) msg = s.msg;
              }
              send({ type: "progress", progress: pct, message: msg });
              lastPct = pct;
            }
          });

          const finalMessage = await stream.finalMessage();

          const textBlock = finalMessage.content.find(
            (b) => b.type === "text"
          );
          if (!textBlock || textBlock.type !== "text") {
            throw new Error("No text response from Claude");
          }

          let tripData;
          try {
            tripData = JSON.parse(textBlock.text);
          } catch {
            const m = textBlock.text.match(/\{[\s\S]*\}/);
            if (m) {
              tripData = JSON.parse(m[0]);
            } else {
              throw new Error("Could not parse itinerary JSON");
            }
          }

          send({ type: "complete", progress: 100, data: tripData });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown error occurred";
          send({ type: "error", message: `Failed to generate itinerary: ${msg}` });
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
    console.error("Error generating itinerary:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: `Failed to generate itinerary: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
