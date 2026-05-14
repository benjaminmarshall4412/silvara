/**
 * Resend Automation trigger names — create one Automation per flow in the Resend
 * dashboard and set each trigger’s custom event to the string below (exact match).
 *
 * Each step uses Delay + Send email (publish Templates first). Use
 * `{{{RESEND_UNSUBSCRIBE_URL}}}` where Resend requires it for marketing.
 *
 * Flow wiring (this repo):
 * - `SILVARA_RESEND_EVENTS.PROMO_SIGNUP` → POST /api/promo-signup (server)
 * - `SILVARA_RESEND_EVENTS.PRODUCT_VIEWED` → POST /api/resend/track (client, needs marketing email)
 * - `SILVARA_RESEND_EVENTS.CART_ABANDONED` → POST /api/resend/track (client, needs marketing email)
 * - `SILVARA_RESEND_EVENTS.ORDER_COMPLETED` → Stripe webhook checkout.session.completed (server)
 * - `SILVARA_RESEND_EVENTS.WINBACK` → reserved; no server trigger until you have order history + cron
 *
 * Suggested delays (configure in Resend, not in code):
 * - Promo: 0, +12h, +12h, +24h, +24h after trigger for 0/12/24/48/72h emails
 * - Browse: +2h, +22h, +24h after product_viewed (tune in dashboard)
 * - Cart: +3h, +21h, +24h after cart_abandoned (tune in dashboard)
 * - Post-purchase: immediate, then delays from trigger (delivery-based needs extra events later)
 */
export const SILVARA_RESEND_EVENTS = {
  PROMO_SIGNUP: "silvara.promo_signup",
  PRODUCT_VIEWED: "silvara.product_viewed",
  CART_ABANDONED: "silvara.cart_abandoned",
  ORDER_COMPLETED: "silvara.order_completed",
  WINBACK: "silvara.winback",
} as const;

export type SilvaraResendEventName =
  (typeof SILVARA_RESEND_EVENTS)[keyof typeof SILVARA_RESEND_EVENTS];
