import { NextResponse } from "next/server"

import { envPublic } from "@/lib/env.public"
import { stripe } from "@/lib/stripe/server"
import {
  getCheckoutMode,
  toStripeLineItems,
  validateCheckoutLines,
} from "@/lib/stripe/prices"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lines = validateCheckoutLines(body?.lines)
    const mode = getCheckoutMode(lines)
    const line_items = toStripeLineItems(lines)

    const session = await stripe.checkout.sessions.create({
      // Stripe runtime supports embedded checkout, but current SDK typings lag here.
      ui_mode: "embedded",
      mode,
      line_items,
      return_url: `${envPublic.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      payment_method_collection: "always",
    } as never)

    if (!session.client_secret) {
      throw new Error("Stripe did not return a client secret")
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("[stripe] create-intent failed", error)
    return NextResponse.json(
      { error: "Unable to start checkout session" },
      { status: 400 },
    )
  }
}
