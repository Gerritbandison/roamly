import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

// POST /api/stripe/checkout — create checkout session for Pro upgrade
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

  if (!secretKey || !priceId) {
    return Response.json(
      { error: "Stripe is not configured yet" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?upgraded=true`,
    cancel_url: `${baseUrl}/`,
    metadata: { clerkUserId: userId },
  });

  return Response.json({ url: session.url });
}
