import { auth } from "@clerk/nextjs/server";
import { getUsageSummary } from "@/lib/usage";

// GET /api/usage — get current user's usage summary
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getUsageSummary(userId);
  return Response.json(summary);
}
