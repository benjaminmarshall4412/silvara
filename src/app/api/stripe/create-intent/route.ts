import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { envPublic } from "@/lib/env.public"
import { envServer } from "@/lib/env.server"
import {
  SILVARA_PROMO_COOKIE_NAME,
  verifyPromoEligibleToken,
} from "@/lib/promo-cookie"
import { stripe } from "@/lib/stripe/server"
import { stripeCheckoutBranding } from "@/lib/stripe-checkout-branding"
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

    const cookieStore = await cookies()
    const promoEligible = verifyPromoEligibleToken(
      cookieStore.get(SILVARA_PROMO_COOKIE_NAME)?.value,
    )
    const couponId = envServer.stripeEmailPromoCouponId?.trim()

    const autoDiscount =
      promoEligible && couponId ? [{ coupon: couponId }] : undefined

    // `payment_method_collection` is invalid for pure one-time carts (Stripe 2026+).
    const baseParams = {
      ui_mode: "embedded_page",
      mode,
      line_items,
      return_url: `${envPublic.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      billing_address_collection: "auto" as const,
      /** Match SILVARA storefront (Stripe-hosted UI; wallets like Link inherit theme colors). */
      branding_settings: stripeCheckoutBranding(envPublic.siteUrl),
      /** No typed codes — signup uses an auto-applied coupon when eligible */
      allow_promotion_codes: false as const,
      ...(autoDiscount ? { discounts: autoDiscount } : {}),
    }
    const sessionParams =
      mode === "subscription"
        ? { ...baseParams, payment_method_collection: "always" as const }
        : baseParams

    const session = await stripe.checkout.sessions.create(sessionParams as never)

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
