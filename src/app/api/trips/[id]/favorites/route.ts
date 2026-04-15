import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { toggleFavorite, getFavorites } from "@/lib/db/queries";

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
  const { type, name, dayNumber, note } = (await req.json()) as {
    type: string;
    name: string;
    dayNumber: number;
    note?: string;
  };

  if (!type || !name || typeof dayNumber !== "number") {
    return Response.json(
      { error: "type, name, and dayNumber are required" },
      { status: 400 }
    );
  }

  const result = await toggleFavorite(id, userId, {
    type,
    name,
    dayNumber,
    note,
  });
  return Response.json(result);
}
