import { db } from "./index";
import {
  users,
  trips,
  sharedTrips,
  notes,
  favorites,
  packingLists,
  usage,
} from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Trip } from "@/types/itinerary";

// ── Users ──────────────────────────────────────────────

export async function upsertUser(
  clerkId: string,
  email: string,
  name?: string | null
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ email, name: name ?? existing[0].name, updatedAt: new Date() })
      .where(eq(users.id, clerkId));
    return existing[0];
  }

  const [user] = await db
    .insert(users)
    .values({ id: clerkId, email, name })
    .returning();
  return user;
}

export async function getUser(clerkId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkId))
    .limit(1);
  return user ?? null;
}

// ── Trips ──────────────────────────────────────────────

export async function createTrip(
  userId: string,
  formData: {
    destination: string;
    durationDays: number;
    budget: string;
    startDate?: string;
    endDate?: string;
    travelers?: number;
    interests?: string;
  },
  tripData: Trip
) {
  const [trip] = await db
    .insert(trips)
    .values({
      userId,
      destination: formData.destination,
      durationDays: formData.durationDays,
      budget: formData.budget,
      startDate: formData.startDate,
      endDate: formData.endDate,
      travelers: formData.travelers ?? 1,
      interests: formData.interests,
      tripData: tripData as unknown as Record<string, unknown>,
    })
    .returning();
  return trip;
}

export async function getTrip(tripId: string, userId?: string) {
  const conditions = userId
    ? and(eq(trips.id, tripId), eq(trips.userId, userId))
    : eq(trips.id, tripId);

  const [trip] = await db.select().from(trips).where(conditions).limit(1);
  return trip ?? null;
}

export async function listTrips(
  userId: string,
  limit = 20,
  offset = 0
) {
  return db
    .select({
      id: trips.id,
      destination: trips.destination,
      durationDays: trips.durationDays,
      budget: trips.budget,
      startDate: trips.startDate,
      endDate: trips.endDate,
      travelers: trips.travelers,
      createdAt: trips.createdAt,
    })
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateTrip(
  tripId: string,
  userId: string,
  tripData: Trip
) {
  const [updated] = await db
    .update(trips)
    .set({
      tripData: tripData as unknown as Record<string, unknown>,
      destination: tripData.destination,
      durationDays: tripData.duration_days,
      updatedAt: new Date(),
    })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteTrip(tripId: string, userId: string) {
  const [deleted] = await db
    .delete(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .returning({ id: trips.id });
  return !!deleted;
}

// ── Shared Trips ───────────────────────────────────────

export async function createShareLink(tripId: string, shareCode: string) {
  const [share] = await db
    .insert(sharedTrips)
    .values({ tripId, shareCode })
    .returning();
  return share;
}

export async function getSharedTrip(shareCode: string) {
  const [shared] = await db
    .select({
      shareCode: sharedTrips.shareCode,
      isPublic: sharedTrips.isPublic,
      views: sharedTrips.views,
      tripId: sharedTrips.tripId,
      tripData: trips.tripData,
      destination: trips.destination,
      durationDays: trips.durationDays,
      budget: trips.budget,
    })
    .from(sharedTrips)
    .innerJoin(trips, eq(sharedTrips.tripId, trips.id))
    .where(
      and(eq(sharedTrips.shareCode, shareCode), eq(sharedTrips.isPublic, true))
    )
    .limit(1);

  if (shared) {
    // Increment view count
    await db
      .update(sharedTrips)
      .set({ views: sql`${sharedTrips.views} + 1` })
      .where(eq(sharedTrips.shareCode, shareCode));
  }

  return shared ?? null;
}

export async function getShareForTrip(tripId: string) {
  const [share] = await db
    .select()
    .from(sharedTrips)
    .where(and(eq(sharedTrips.tripId, tripId), eq(sharedTrips.isPublic, true)))
    .limit(1);
  return share ?? null;
}

export async function revokeShareLink(tripId: string, userId: string) {
  // Verify ownership first
  const trip = await getTrip(tripId, userId);
  if (!trip) return false;

  await db
    .update(sharedTrips)
    .set({ isPublic: false })
    .where(eq(sharedTrips.tripId, tripId));
  return true;
}

// ── Notes ──────────────────────────────────────────────

export async function upsertNote(
  tripId: string,
  userId: string,
  dayNumber: number,
  content: string
) {
  const existing = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.tripId, tripId),
        eq(notes.userId, userId),
        eq(notes.dayNumber, dayNumber)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (!content.trim()) {
      await db.delete(notes).where(eq(notes.id, existing[0].id));
      return null;
    }
    const [updated] = await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, existing[0].id))
      .returning();
    return updated;
  }

  if (!content.trim()) return null;

  const [note] = await db
    .insert(notes)
    .values({ tripId, userId, dayNumber, content })
    .returning();
  return note;
}

export async function getNotesForTrip(tripId: string, userId: string) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.tripId, tripId), eq(notes.userId, userId)));
}

// ── Favorites ──────────────────────────────────────────

export async function toggleFavorite(
  tripId: string,
  userId: string,
  item: { type: string; name: string; dayNumber: number; note?: string }
) {
  const existing = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.tripId, tripId),
        eq(favorites.userId, userId),
        eq(favorites.itemType, item.type),
        eq(favorites.itemName, item.name),
        eq(favorites.dayNumber, item.dayNumber)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { action: "removed" as const };
  }

  await db.insert(favorites).values({
    tripId,
    userId,
    itemType: item.type,
    itemName: item.name,
    dayNumber: item.dayNumber,
    note: item.note,
  });
  return { action: "added" as const };
}

export async function getFavorites(tripId: string, userId: string) {
  return db
    .select()
    .from(favorites)
    .where(and(eq(favorites.tripId, tripId), eq(favorites.userId, userId)));
}

// ── Packing Lists ──────────────────────────────────────

export async function upsertPackingList(
  tripId: string,
  userId: string,
  categories: unknown
) {
  const existing = await db
    .select()
    .from(packingLists)
    .where(
      and(eq(packingLists.tripId, tripId), eq(packingLists.userId, userId))
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(packingLists)
      .set({
        categories: categories as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(packingLists.id, existing[0].id))
      .returning();
    return updated;
  }

  const [list] = await db
    .insert(packingLists)
    .values({
      tripId,
      userId,
      categories: categories as Record<string, unknown>,
    })
    .returning();
  return list;
}

export async function getPackingList(tripId: string, userId: string) {
  const [list] = await db
    .select()
    .from(packingLists)
    .where(
      and(eq(packingLists.tripId, tripId), eq(packingLists.userId, userId))
    )
    .limit(1);
  return list ?? null;
}

// ── Usage Tracking ─────────────────────────────────────

export async function recordUsage(userId: string, action: string) {
  await db.insert(usage).values({ userId, action });
}

export async function getMonthlyUsage(userId: string, action: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usage)
    .where(
      and(
        eq(usage.userId, userId),
        eq(usage.action, action),
        sql`${usage.createdAt} >= ${startOfMonth}`
      )
    );
  return result?.count ?? 0;
}
