import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import { checkUsageLimit, trackUsage } from "@/lib/usage";
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
        JSON.stringify({ error: "Sign in to use the budget optimizer" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Per-user burst limit — protect against rapid-fire abuse even within
    // the monthly quota.
    const rl = rateLimit(`ai:budget:${userId}`, 10, 60_000);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests — try again shortly" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Monthly usage limit for free-tier users.
    const usage = await checkUsageLimit(userId, "budget");
    if (!usage.allowed) {
      return new Response(
        JSON.stringify({
          error: "Monthly budget optimizer limit reached",
          code: "USAGE_LIMIT",
          current: usage.current,
          limit: usage.limit,
          resetsAt: usage.resetsAt.toISOString(),
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { trip, priorities } = body;

    if (!trip) {
      return new Response(
        JSON.stringify({ error: "Trip data is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Gather all costs from the trip
    const allCosts = trip.days.flatMap(
      (d: { day: number; costs?: { item: string; cost: string }[] }) =>
        (d.costs || []).map((c: { item: string; cost: string }) => ({
          day: d.day,
          ...c,
        }))
    );

    const stayInfo = trip.days
      .map(
        (d: { day: number; stay?: { name: string; price: string; note: string } }) =>
          d.stay ? `Day ${d.day}: ${d.stay.name} (${d.stay.price})` : null
      )
      .filter(Boolean)
      .join("\n");

    const diningInfo = trip.days
      .map(
        (d: { day: number; food?: { name: string; note: string }[] }) =>
          d.food && d.food.length > 0
            ? `Day ${d.day}: ${d.food.map((f: { name: string }) => f.name).join(", ")}`
            : null
      )
      .filter(Boolean)
      .join("\n");

    // Build priority context if provided
    const priorityContext = priorities
      ? `\nUser budget priorities (scale 1-5, higher = spend more here):
- Accommodation: ${priorities.accommodation || 3}/5
- Food & Dining: ${priorities.food || 3}/5
- Activities & Experiences: ${priorities.activities || 3}/5
- Transport: ${priorities.transport || 3}/5
- Shopping & Souvenirs: ${priorities.shopping || 3}/5`
      : "";

    const prompt = `Analyze this ${trip.duration_days}-day trip to ${trip.destination} and create a smart budget optimization plan.

Current trip costs breakdown:
${allCosts.map((c: { day: number; item: string; cost: string }) => `Day ${c.day} — ${c.item}: ${c.cost}`).join("\n") || "No detailed costs available"}

Accommodation:
${stayInfo || "Not specified"}

Dining:
${diningInfo || "Not specified"}

Budget level: ${trip.practical_info.budget_estimate}
${priorityContext}

Return a JSON object with this exact structure:
{
  "total_estimated": "$X,XXX",
  "categories": [
    {
      "name": "string — e.g. 'Accommodation', 'Food & Dining', 'Activities', 'Transport', 'Shopping'",
      "emoji": "string — single emoji",
      "current_spend": number,
      "optimized_spend": number,
      "percentage": number,
      "color": "string — hex color",
      "tips": ["string — 2-3 specific money-saving tips for this category"]
    }
  ],
  "savings_total": number,
  "savings_tips": [
    "string — 3-5 general top savings tips for this destination"
  ],
  "splurge_worthy": [
    "string — 2-3 things that are worth spending extra on at this destination"
  ]
}

Rules:
- Always include exactly 5 categories: Accommodation, Food & Dining, Activities, Transport, Shopping
- Use these colors in order: #c8843a (amber), #6b8f71 (sage), #c0502a (rust), #4a6fa5 (blue), #9b7cb8 (purple)
- current_spend and optimized_spend in raw numbers (no $ sign)
- percentage is the % of total budget this category represents
- Be specific to ${trip.destination} — reference actual local alternatives
- If user priorities given, shift budget toward higher-priority categories
- optimized_spend should reflect realistic savings without sacrificing quality
- Tips should be actionable and destination-specific
- Return ONLY the JSON — no markdown, no explanation`;

    const response = await getClient().messages.create({
      model: env.AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      system:
        "You are a budget-savvy travel finance advisor. Return only valid JSON. Be specific and practical with your suggestions.",
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
        throw new Error("Could not parse budget optimization");
      }
    }

    trackUsage(userId, "budget");

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Budget optimizer error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
