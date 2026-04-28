/**
 * Embedded Checkout inherits these from Checkout Session `branding_settings`.
 * `ui_mode: embedded_page` supports colors/font/`display_name` but not custom `logo` (Stripe API).
 *
 * HTTPS icon URL can be included when NEXT_PUBLIC_SITE_URL is https — Stripe loads it remotely.
 */

const BRAND_HEX = {
  /** ~ oklch(0.985 0.002 90) paper */
  paper: "#f8f7f5",
  /** ~ oklch(0.14 0 0) ink / primary CTA */
  ink: "#161616",
} as const;

export function stripeCheckoutBranding(siteBaseUrl: string): {
  display_name: string;
  background_color: string;
  button_color: string;
  border_style: "rectangular";
  font_family: "montserrat";
  icon?: { type: "url"; url: string };
} {
  const clean = siteBaseUrl.replace(/\/$/, "");
  /** Stripe fetches logo/icon from this URL — must be reachable on the public internet (not dev-only). */
  const canUseRemoteAssets = clean.startsWith("https://");

  const base = {
    display_name: "SILVARA",
    background_color: BRAND_HEX.paper,
    button_color: BRAND_HEX.ink,
    border_style: "rectangular" as const,
    font_family: "montserrat" as const,
  };

  if (!canUseRemoteAssets) {
    return base;
  }

  const faviconUrl = `${clean}/silvarafavicon.jpg`;

  return {
    ...base,
    icon: { type: "url" as const, url: faviconUrl },
  };
}
