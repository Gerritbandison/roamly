import { z } from "zod";

// Zod schemas for data written to Postgres.
// Mirrors src/types/itinerary.ts; kept permissive (passthrough) so that
// future additive fields don't require a lockstep schema migration, but
// strict enough to catch AI responses with missing required structure.

const locationSchema = z
  .object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    notes: z.string().default(""),
  })
  .passthrough();

const foodItemSchema = z
  .object({
    name: z.string(),
    note: z.string().default(""),
    must_try: z.boolean().optional(),
  })
  .passthrough();

const costItemSchema = z
  .object({
    item: z.string(),
    cost: z.string(),
  })
  .passthrough();

const staySchema = z
  .object({
    name: z.string(),
    price: z.string(),
    note: z.string().default(""),
  })
  .passthrough();

const dayPlanSchema = z
  .object({
    day: z.number().int().min(1).max(30),
    date: z.string(),
    theme: z.string().default(""),
    region: z.string().default(""),
    locations: z.array(locationSchema).default([]),
    morning: z.string().default(""),
    afternoon: z.string().default(""),
    evening: z.string().default(""),
    food: z.array(foodItemSchema).default([]),
    stay: staySchema.optional(),
    costs: z.array(costItemSchema).default([]),
    tips: z.string().default(""),
    dining: z.array(z.string()).optional(),
  })
  .passthrough();

const practicalInfoSchema = z
  .object({
    best_time_to_visit: z.string().default(""),
    currency: z.string().default(""),
    transport_tips: z.string().default(""),
    budget_estimate: z.string().default(""),
  })
  .passthrough();

export const tripSchema = z
  .object({
    destination: z.string().min(1).max(200),
    duration_days: z.number().int().min(1).max(30),
    days: z.array(dayPlanSchema).min(1).max(30),
    practical_info: practicalInfoSchema,
  })
  .passthrough();

export type ValidatedTrip = z.infer<typeof tripSchema>;

export class TripValidationError extends Error {
  readonly issues: z.ZodIssue[];
  constructor(issues: z.ZodIssue[]) {
    super("Invalid trip data");
    this.name = "TripValidationError";
    this.issues = issues;
  }
}

export function validateTrip(input: unknown): ValidatedTrip {
  const result = tripSchema.safeParse(input);
  if (!result.success) {
    throw new TripValidationError(result.error.issues);
  }
  return result.data;
}
