const fallbackSiteUrl = "http://localhost:3000"

/**
 * NEXT_PUBLIC_* is inlined into the browser bundle — set it in `.env` and restart `next dev` after editing.
 */
export const envPublic = {
  /** Empty string when unset — checkout UI should guard before calling Stripe. */
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl,
  /** Email capture modal (%). Set `0` to hide. */
  promoPct: process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "15",
}
