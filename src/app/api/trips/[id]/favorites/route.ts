import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { toggleFavorite, getFavorites, userOwnsTrip } from "@/lib/db/queries";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/trips/[id]/favorites — get all favorites for a trip
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const favs = await getFavorites(id, userId);
  return Response.json({ favorites: favs });
}

// POST /api/trips/[id]/favorites — toggle a favorite
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!(await userOwnsTrip(id, userId))) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  const { type, name, dayNumber, note } = (await req.json()) as {
    type: string;
    name: string;
    dayNumber: number;
    note?: string;
  };

  if (
    typeof type !== "string" ||
    !["place", "food"].includes(type) ||
    typeof name !== "string" ||
    name.length === 0 ||
    name.length > 200 ||
    typeof dayNumber !== "number" ||
    !Number.isInteger(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > 30
  ) {
    return Response.json(
      { error: "Invalid favorite payload" },
      { status: 400 }
    );
  }

  const safeNote =
    typeof note === "string" && note.length <= 1000 ? note : undefined;

  const result = await toggleFavorite(id, userId, {
    type,
    name,
    dayNumber,
    note: safeNote,
  });
  return Response.json(result);
}
