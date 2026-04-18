import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { upsertNote, getNotesForTrip, userOwnsTrip } from "@/lib/db/queries";

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

  // IDOR defense: don't let a user write notes that reference someone else's
  // trip_id (the notes would be scoped to the attacker, but would pollute the
  // table and leak trip existence via side channels).
  if (!(await userOwnsTrip(id, userId))) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  const { dayNumber, content } = (await req.json()) as {
    dayNumber: number;
    content: string;
  };

  if (typeof dayNumber !== "number" || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    return Response.json({ error: "dayNumber must be an integer between 1 and 30" }, { status: 400 });
  }

  const safeContent = typeof content === "string" ? content.slice(0, 4000) : "";
  const note = await upsertNote(id, userId, dayNumber, safeContent);
  return Response.json({ note });
}
