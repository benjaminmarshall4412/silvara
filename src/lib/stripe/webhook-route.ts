import { NextResponse } from "next/server";

import { getStripeWebhookSecretForRegion } from "@/lib/env.server";
import { getStripeForRegion } from "@/lib/stripe/server";
import { logStripeWebhookEvent } from "@/lib/stripe/process-webhook-event";
import type { SiteRegion } from "@/lib/site-region";

export async function stripeWebhookPost(
  request: Request,
  region: SiteRegion,
): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const webhookSecret = getStripeWebhookSecretForRegion(region);
  if (!webhookSecret) {
    const suffix = region.toUpperCase();
    return NextResponse.json(
      {
        error: `Missing STRIPE_WEBHOOK_SECRET_${suffix} in server environment`,
      },
      { status: 500 },
    );
  }

  const body = await request.text();
  const stripe = getStripeForRegion(region);

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] invalid webhook signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  logStripeWebhookEvent(event);

  return NextResponse.json({ received: true });
}
