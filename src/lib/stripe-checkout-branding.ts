/**
 * Embedded Checkout (`ui_mode: embedded_page`) only allows a subset of
 * `branding_settings`: colors, `display_name`, `border_style`, `font_family`.
 * Stripe rejects `logo` and `icon` URLs in this mode — use Dashboard → Branding for those on hosted pages if needed.
 */

const BRAND_HEX = {
  /** ~ oklch(0.985 0.002 90) paper */
  paper: "#f8f7f5",
  /** ~ oklch(0.14 0 0) ink / primary CTA */
  ink: "#161616",
} as const;

export function stripeCheckoutBranding(): {
  display_name: string;
  background_color: string;
  button_color: string;
  border_style: "rectangular";
  font_family: "montserrat";
} {
  return {
    display_name: "SILVARA",
    background_color: BRAND_HEX.paper,
    button_color: BRAND_HEX.ink,
    border_style: "rectangular",
    font_family: "montserrat",
  };
}
