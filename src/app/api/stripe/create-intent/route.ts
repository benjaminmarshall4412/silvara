import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"

import { getPostHogClient } from "@/lib/posthog-server"
import { envPublic } from "@/lib/env.public"
import { getStripePromoCouponIdForRegion } from "@/lib/env.server"
import {
  SILVARA_PROMO_COOKIE_NAME,
  verifyPromoEligibleToken,
} from "@/lib/promo-cookie"
import { getStripeForRegion } from "@/lib/stripe/server"
import { stripeCheckoutBranding } from "@/lib/stripe-checkout-branding"
import { isSiteRegion, type SiteRegion } from "@/lib/site-region"
import {
  getCheckoutMode,
  toStripeLineItems,
  validateCheckoutLines,
} from "@/lib/stripe/prices"

/** Countries Stripe Checkout may offer for shipping address (ISO 3166-1 alpha-2). */
function shippingAllowedCountries(region: SiteRegion): string[] {
  return region === "uk" ? ["GB"] : ["US"]
}

/**
 * Where Stripe should send the buyer after pay — must match the storefront they used.
 * Prefer the request Origin/Host so a bad NEXT_PUBLIC_SITE_URL (e.g. localhost baked
 * into a production build) cannot strand live customers on localhost.
 */
function resolveCheckoutSiteBase(request: Request): string {
  const origin = request.headers.get("origin")?.trim()
  if (origin && /^https?:\/\//i.test(origin)) {
    try {
      return new URL(origin).origin
    } catch {
      /* fall through */
    }
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
  const host =
    forwardedHost || request.headers.get("host")?.trim() || ""
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https")
    return `${proto}://${host}`.replace(/\/$/, "")
  }

  const fromEnv = envPublic.siteUrl.replace(/\/$/, "")
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv
  }
  return "https://www.silvara.org"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lines = validateCheckoutLines(body?.lines)
    const region = isSiteRegion(body?.region) ? body.region : "us"
    const mode = getCheckoutMode(lines)
    const line_items = toStripeLineItems(lines, region)

    const cookieStore = await cookies()
    const promoEligible = verifyPromoEligibleToken(
      cookieStore.get(SILVARA_PROMO_COOKIE_NAME)?.value,
    )
    const couponId = getStripePromoCouponIdForRegion(region)

    const autoDiscount =
      promoEligible && couponId ? [{ coupon: couponId }] : undefined

    // `payment_method_collection` is invalid for pure one-time carts (Stripe 2026+).
    // Stripe forbids `allow_promotion_codes` and `discounts` on the same session — use one or the other.
    const siteBase = resolveCheckoutSiteBase(request)
    const silvaraCartMeta = JSON.stringify(
      lines.map((l) => ({
        i: l.id,
        q: l.quantity,
        s: l.sockSize,
        c: l.sockColor,
      })),
    )
    const baseParams = {
      ui_mode: "embedded_page",
      mode,
      line_items,
      return_url: `${siteBase}/${region}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      billing_address_collection: "auto" as const,
      /** Ask for a contact number on Checkout (shows in admin orders). */
      phone_number_collection: { enabled: true },
      /** Fulfillment: sizes per line (Stripe metadata max 500 chars — keep cart small). */
      metadata: {
        silvara_cart: silvaraCartMeta.slice(0, 500),
        silvara_region: region,
      },
      /** Physical fulfillment — collected by Stripe on the embedded Checkout page. */
      shipping_address_collection: {
        allowed_countries: shippingAllowedCountries(region),
      },
      /** Match SILVARA storefront (Stripe-hosted UI; wallets like Link inherit theme colors). */
      branding_settings: stripeCheckoutBranding(),
      ...(autoDiscount
        ? { discounts: autoDiscount }
        : { allow_promotion_codes: false as const }),
    }
    const sessionParams =
      mode === "subscription"
        ? { ...baseParams, payment_method_collection: "always" as const }
        : baseParams

    const stripe = getStripeForRegion(region)
    const session = await stripe.checkout.sessions.create(sessionParams as never)

    if (!session.client_secret) {
      throw new Error("Stripe did not return a client secret")
    }

    /** True when Checkout Session includes `discounts` (cookie + STRIPE_EMAIL_PROMO_COUPON_ID_*). */
    const appliedPromoDiscount = Boolean(
      autoDiscount && autoDiscount.length > 0,
    )

    const reqHeaders = await headers()
    const distinctId = reqHeaders.get("x-posthog-distinct-id") ?? session.id
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId,
      event: "checkout_session_created",
      properties: {
        session_id: session.id,
        mode,
        region,
        line_count: lines.length,
        applied_promo_discount: appliedPromoDiscount,
      },
    })
    await posthog.shutdown()

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      appliedPromoDiscount,
    })
  } catch (error) {
    console.error("[stripe] create-intent failed", error)
    return NextResponse.json(
      { error: "Unable to start checkout session" },
      { status: 400 },
    )
  }
}
