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
  promoPct: process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "0",
  /**
   * Google Ads account ids. UK falls back to the legacy unscoped var so existing
   * Vercel `NEXT_PUBLIC_GOOGLE_ADS_ID` keeps working.
   */
  googleAdsIdUs: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID_US ?? "",
  googleAdsIdUk:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID_UK ??
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ??
    "",
  /**
   * Purchase conversion `send_to` from Google Ads event snippet, e.g. AW-18207293610/AbCdEfGh.
   */
  googleAdsPurchaseSendToUs:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO_US?.trim() ||
    "AW-18428618209/ntYTCMLkzu0cEOHLudNE",
  googleAdsPurchaseSendToUk:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO_UK ??
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO ??
    "",
  /** Meta Pixel ID. Leave empty to disable. */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
};

export function getStripePublishableKeyForRegion(region: SiteRegion): string {
  return region === "us"
    ? envPublic.stripePublishableKeyUs
    : envPublic.stripePublishableKeyUk;
}

export function getGoogleAdsIdForRegion(region: SiteRegion): string {
  return region === "us"
    ? envPublic.googleAdsIdUs.trim()
    : envPublic.googleAdsIdUk.trim();
}

export function getGoogleAdsPurchaseSendToForRegion(region: SiteRegion): string {
  return region === "us"
    ? envPublic.googleAdsPurchaseSendToUs.trim()
    : envPublic.googleAdsPurchaseSendToUk.trim();
}
