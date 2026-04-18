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

  // Idempotency strategy: run the handler FIRST, then claim the event id.
  // Handlers are idempotent single-statement UPDATEs, so a Stripe retry that
  // re-runs a handler is safe. Claiming after ensures that a transient handler
  // failure returns 500 → Stripe retries → the event is eventually applied.
  // (The previous claim-first approach silently dropped events on any handler
  // error, since retries hit the claim row and skipped the handler.)
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
    return Response.json({ error: "Handler error" }, { status: 500 });
  }

  // Record the event so future redeliveries no-op via ON CONFLICT. If this
  // fails, return 500 and let Stripe retry — the handler is idempotent, so
  // re-running it on the next delivery is safe.
  try {
    const firstTime = await claimStripeEvent(event.id, event.type);
    if (!firstTime) {
      log.info("stripe_webhook_redelivery", {
        eventId: event.id,
        type: event.type,
      });
      return Response.json({ received: true, duplicate: true });
    }
  } catch (err) {
    log.error("stripe_event_claim_error", {
      eventId: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Temporary failure" }, { status: 500 });
  }

  return Response.json({ received: true });
}
