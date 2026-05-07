import type { SiteRegion } from "@/lib/site-region";

const fallbackSiteUrl = "http://localhost:3000";

/**
 * NEXT_PUBLIC_* is inlined into the browser bundle — set it in `.env` and restart `next dev` after editing.
 */
export const envPublic = {
  stripePublishableKeyUs:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_US ?? "",
  stripePublishableKeyUk:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_UK ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl,
  /** Email capture modal (%). Set `0` to hide. */
  promoPct: process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "15",
};

export function getStripePublishableKeyForRegion(region: SiteRegion): string {
  return region === "us"
    ? envPublic.stripePublishableKeyUs
    : envPublic.stripePublishableKeyUk;
}
