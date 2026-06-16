import { NextResponse } from "next/server";

import { getStripeForRegion } from "@/lib/stripe/server";
import { isSiteRegion } from "@/lib/site-region";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const regionRaw = searchParams.get("region");
  const region = isSiteRegion(regionRaw) ? regionRaw : null;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  if (!region) {
    return NextResponse.json({ error: "Missing or invalid region" }, { status: 400 });
  }

  try {
    const stripe = getStripeForRegion(region);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("[stripe] failed to fetch session status", error);
    return NextResponse.json(
      { error: "Unable to load payment status" },
      { status: 400 },
    );
  }
}
