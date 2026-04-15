import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getUser } from "@/lib/db/queries";

// POST /api/stripe/portal — create billing portal session
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://roamly.vercel.app";

  if (!secretKey) {
    return Response.json(
      { error: "Stripe is not configured yet" },
      { status: 503 }
    );
  }

  const user = await getUser(userId);
  if (!user?.stripeCustomerId) {
    return Response.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const stripe = new Stripe(secretKey);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/`,
  });

  return Response.json({ url: session.url });
}
