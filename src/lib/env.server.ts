import "server-only";

import type { BundleId } from "@/lib/products";
import type { SiteRegion } from "@/lib/site-region";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value;
}

/** Resolved when Stripe routes run — avoids failing `next build` when `.env` is incomplete locally. */
export function getStripeSecretKeyForRegion(region: SiteRegion): string {
  return region === "us"
    ? required("STRIPE_SECRET_KEY_US")
    : required("STRIPE_SECRET_KEY_UK");
}

export function getStripeWebhookSecretForRegion(region: SiteRegion): string | undefined {
  return region === "us"
    ? optional("STRIPE_WEBHOOK_SECRET_US")
    : optional("STRIPE_WEBHOOK_SECRET_UK");
}

export function getStripePromoCouponIdForRegion(region: SiteRegion): string | undefined {
  const raw =
    region === "us"
      ? optional("STRIPE_EMAIL_PROMO_COUPON_ID_US")
      : optional("STRIPE_EMAIL_PROMO_COUPON_ID_UK");
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function getStripePriceIdsForRegion(region: SiteRegion): Record<BundleId, string> {
  if (region === "us") {
    return {
      single: required("STRIPE_PRICE_SINGLE_US"),
      triple: required("STRIPE_PRICE_TRIPLE_US"),
      six: required("STRIPE_PRICE_SIX_US"),
      rotation: required("STRIPE_PRICE_ROTATION_US"),
    };
  }
  return {
    single: required("STRIPE_PRICE_SINGLE_UK"),
    triple: required("STRIPE_PRICE_TRIPLE_UK"),
    six: required("STRIPE_PRICE_SIX_UK"),
    rotation: required("STRIPE_PRICE_ROTATION_UK"),
  };
}
