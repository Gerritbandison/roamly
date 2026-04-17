import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { createTrip, listTrips, upsertUser } from "@/lib/db/queries";
import { validateTrip, TripValidationError } from "@/lib/schemas";

// GET /api/trips — list user's trips
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await listTrips(userId);
  return Response.json({ trips });
}

// POST /api/trips — create a new trip
export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { formData, tripData } = body as {
    formData: {
      destination: string;
      durationDays: number;
      budget: string;
      startDate?: string;
      endDate?: string;
      travelers?: number;
      interests?: string;
    };
    tripData: unknown;
  };

  if (!formData || !tripData) {
    return Response.json(
      { error: "formData and tripData are required" },
      { status: 400 }
    );
  }

  let validatedTrip;
  try {
    validatedTrip = validateTrip(tripData);
  } catch (err) {
    if (err instanceof TripValidationError) {
      return Response.json(
        { error: "Invalid trip data", issues: err.issues },
        { status: 400 }
      );
    }
    throw err;
  }

  // Ensure user exists in our DB
  await upsertUser(
    userId,
    (sessionClaims?.email as string) ?? "",
    (sessionClaims?.name as string) ?? null
  );

  const trip = await createTrip(userId, formData, validatedTrip);
  return Response.json({ trip }, { status: 201 });
}
