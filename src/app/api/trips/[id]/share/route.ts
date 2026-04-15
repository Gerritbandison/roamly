import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import {
  getTrip,
  createShareLink,
  getShareForTrip,
  revokeShareLink,
} from "@/lib/db/queries";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/trips/[id]/share — check if trip has a share link
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

  const share = await getShareForTrip(id);
  if (!share) {
    return Response.json({ shared: false });
  }

  return Response.json({
    shared: true,
    shareCode: share.shareCode,
    views: share.views,
  });
}

// POST /api/trips/[id]/share — create a share link
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const trip = await getTrip(id, userId);
  if (!trip) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  // Check if already shared
  const existing = await getShareForTrip(id);
  if (existing) {
    return Response.json({
      shareCode: existing.shareCode,
      views: existing.views,
    });
  }

  const shareCode = nanoid(8);
  const share = await createShareLink(id, shareCode);

  return Response.json({ shareCode: share.shareCode }, { status: 201 });
}

// DELETE /api/trips/[id]/share — revoke share link
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const revoked = await revokeShareLink(id, userId);
  if (!revoked) {
    return Response.json({ error: "Trip not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
