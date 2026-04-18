import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  upsertPackingList,
  getPackingList,
  userOwnsTrip,
} from "@/lib/db/queries";
import { readJson, BODY_LIMITS, PayloadTooLargeError } from "@/lib/reqGuard";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/trips/[id]/packing — get packing list
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const list = await getPackingList(id, userId);
  return Response.json({ packingList: list });
}

// POST /api/trips/[id]/packing — save packing list state
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!(await userOwnsTrip(id, userId))) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  let body: { categories: unknown };
  try {
    body = await readJson<{ categories: unknown }>(req, BODY_LIMITS.medium);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.categories) {
    return Response.json(
      { error: "categories is required" },
      { status: 400 }
    );
  }

  const list = await upsertPackingList(id, userId, body.categories);
  return Response.json({ packingList: list });
}
