import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  name: text("name"),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Trips ──────────────────────────────────────────────
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    destination: text("destination").notNull(),
    durationDays: integer("duration_days").notNull(),
    budget: text("budget").notNull(), // 'backpacker' | 'mid-range' | 'luxury'
    startDate: text("start_date"),
    endDate: text("end_date"),
    travelers: integer("travelers").default(1),
    interests: text("interests"),
    tripData: jsonb("trip_data").notNull(), // Full Trip JSON blob
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_trips_user_id").on(table.userId),
    index("idx_trips_created_at").on(table.createdAt),
  ]
);

// ── Shared Trips ───────────────────────────────────────
export const sharedTrips = pgTable(
  "shared_trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    shareCode: text("share_code").notNull().unique(),
    isPublic: boolean("is_public").default(true),
    views: integer("views").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_shared_trips_code").on(table.shareCode),
  ]
);

// ── Notes ──────────────────────────────────────────────
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    dayNumber: integer("day_number").notNull(),
    content: text("content").notNull().default(""),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_notes_trip_user_day").on(
      table.tripId,
      table.userId,
      table.dayNumber
    ),
  ]
);

// ── Favorites ──────────────────────────────────────────
export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    itemType: text("item_type").notNull(), // 'place' | 'food'
    itemName: text("item_name").notNull(),
    dayNumber: integer("day_number").notNull(),
    note: text("note"),
  },
  (table) => [
    uniqueIndex("idx_favorites_unique").on(
      table.tripId,
      table.userId,
      table.itemType,
      table.itemName,
      table.dayNumber
    ),
  ]
);

// ── Packing Lists ──────────────────────────────────────
export const packingLists = pgTable(
  "packing_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    categories: jsonb("categories").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_packing_trip_user").on(table.tripId, table.userId),
  ]
);

// ── Stripe Events (idempotency) ────────────────────────
// Stripe may deliver the same webhook multiple times. Before processing an
// event, insert its id here; the unique constraint turns duplicate deliveries
// into a no-op (`ON CONFLICT DO NOTHING`).
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(), // Stripe event id, e.g. evt_1P...
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// ── Usage Tracking ─────────────────────────────────────
export const usage = pgTable(
  "usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(), // 'generate' | 'regenerate' | 'chat'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_usage_user_action").on(
      table.userId,
      table.action,
      table.createdAt
    ),
  ]
);
