import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { claimStripeEvent } from "@/lib/db/queries";
import { log } from "@/lib/logger";

// POST /api/stripe/webhook — handle Stripe events
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Log the real reason server-side, return a generic message to the caller
    // so we don't leak details of the verification failure.
    log.warn("stripe_webhook_signature_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }

  // Idempotency: if we've already processed this event id, ack and return.
  // Stripe will retry on non-2xx, so we want duplicates to no-op with 200.
  let firstTime: boolean;
  try {
    firstTime = await claimStripeEvent(event.id, event.type);
  } catch (err) {
    log.error("stripe_event_claim_error", {
      eventId: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
    // DB down — return 500 so Stripe retries.
    return Response.json({ error: "Temporary failure" }, { status: 500 });
  }

  if (!firstTime) {
    log.info("stripe_webhook_duplicate", { eventId: event.id, type: event.type });
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        if (clerkUserId) {
          await db
            .update(users)
            .set({
              plan: "pro",
              stripeCustomerId: session.customer as string,
              updatedAt: new Date(),
            })
            .where(eq(users.id, clerkUserId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        if (customerId) {
          await db
            .update(users)
            .set({ plan: "free", updatedAt: new Date() })
            .where(eq(users.stripeCustomerId, customerId));
        }
        break;
      }
    }
  } catch (err) {
    log.error("stripe_webhook_handler_error", {
      eventId: event.id,
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // Let Stripe retry. Note: claimStripeEvent already inserted the id, so on
    // retry we'd see `duplicate: true` and skip. For now, accept at-most-once
    // semantics here — losing a subscription state change is better than
    // flipping a user twice. (Revisit if this becomes an issue.)
    return Response.json({ error: "Handler error" }, { status: 500 });
  }

  return Response.json({ received: true });
}
