import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getTrip, updateTrip, deleteTrip } from "@/lib/db/queries";
import type { Trip } from "@/types/itinerary";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/trips/[id] — fetch a single trip
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const trip = await getTrip(id, userId);
  if (!trip) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  return Response.json({ trip });
}

// PUT /api/trips/[id] — update trip data
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { tripData } = body as { tripData: Trip };

  if (!tripData) {
    return Response.json({ error: "tripData is required" }, { status: 400 });
  }

  const updated = await updateTrip(id, userId, tripData);
  if (!updated) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  return Response.json({ trip: updated });
}

// DELETE /api/trips/[id] — delete a trip
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const deleted = await deleteTrip(id, userId);
  if (!deleted) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
