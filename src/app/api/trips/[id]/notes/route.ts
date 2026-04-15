import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { upsertNote, getNotesForTrip } from "@/lib/db/queries";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/trips/[id]/notes — get all notes for a trip
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tripNotes = await getNotesForTrip(id, userId);
  return Response.json({ notes: tripNotes });
}

// POST /api/trips/[id]/notes — upsert a note for a day
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { dayNumber, content } = (await req.json()) as {
    dayNumber: number;
    content: string;
  };

  if (typeof dayNumber !== "number") {
    return Response.json({ error: "dayNumber is required" }, { status: 400 });
  }

  const note = await upsertNote(id, userId, dayNumber, content ?? "");
  return Response.json({ note });
}
