import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import {
  checkUsageLimit,
  trackUsage,
  UsageCheckUnavailableError,
} from "@/lib/usage";
import { rateLimit } from "@/lib/rateLimit";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Sign in to generate packing lists" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const rl = await rateLimit(`ai:packing:${userId}`, 10, 60_000);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests — try again shortly" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const usage = await checkUsageLimit(userId, "packing");
      if (!usage.allowed) {
        return new Response(
          JSON.stringify({
            error: "Monthly packing list limit reached",
            code: "USAGE_LIMIT",
            current: usage.current,
            limit: usage.limit,
            resetsAt: usage.resetsAt.toISOString(),
          }),
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

    const body = await req.json();
    const { trip } = body;

    if (!trip) {
      return new Response(
        JSON.stringify({ error: "Trip data is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract activities and context from the trip
    const activities = trip.days
      .map(
        (d: { morning: string; afternoon: string; evening: string }) =>
          `${d.morning} ${d.afternoon} ${d.evening}`
      )
      .join(" ");

    const regions = [
      ...new Set(
        trip.days
          .map((d: { region?: string }) => d.region)
          .filter(Boolean)
      ),
    ].join(", ");

    const prompt = `Generate a packing list for a ${trip.duration_days}-day trip to ${trip.destination}.

Context:
- Regions visited: ${regions || trip.destination}
- Budget level: ${trip.practical_info.budget_estimate}
- Activities include: ${activities.slice(0, 1500)}

Return a JSON object with this exact structure:
{
  "categories": [
    {
      "category": "string — category name like 'Clothing' or 'Electronics'",
      "emoji": "string — single emoji for this category",
      "items": ["string — specific item names"]
    }
  ]
}

Rules:
- 6-8 categories max
- 4-8 items per category
- Be SPECIFIC to this trip — don't just list generic items
- If they're hiking, include hiking gear. If visiting temples, include modest clothing
- Include destination-specific items (power adapter type, insect repellent, etc.)
- Include a "Documents" category with passport, insurance, etc.
- Keep item names concise (2-5 words each)
- Return ONLY the JSON — no markdown, no explanation`;

    const response = await getClient().messages.create({
      model: env.AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      system: [
        {
          type: "text",
          text: "You are a practical travel packing expert. Return only valid JSON.",
          cache_control: { type: "ephemeral" },
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No response from AI");
    }

    let data;
    try {
      data = JSON.parse(textBlock.text);
    } catch {
      const m = textBlock.text.match(/\{[\s\S]*\}/);
      if (m) {
        data = JSON.parse(m[0]);
      } else {
        throw new Error("Could not parse packing list");
      }
    }

    trackUsage(userId, "packing");

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Packing list error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
