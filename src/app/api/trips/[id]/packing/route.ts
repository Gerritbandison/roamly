import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { upsertPackingList, getPackingList } from "@/lib/db/queries";

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
  const { categories } = (await req.json()) as { categories: unknown };

  if (!categories) {
    return Response.json(
      { error: "categories is required" },
      { status: 400 }
    );
  }

  const list = await upsertPackingList(id, userId, categories);
  return Response.json({ packingList: list });
}
