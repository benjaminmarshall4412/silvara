/**
 * Resend Automation trigger names — create one Automation per flow in the Resend
 * dashboard and set each trigger’s custom event to the string below (exact match).
 *
 * Each step uses Delay + Send email (publish Templates first). Use
 * `{{{RESEND_UNSUBSCRIBE_URL}}}` where Resend requires it for marketing.
 *
 * Flow wiring (this repo):
 * - `SILVARA_RESEND_EVENTS.PROMO_SIGNUP` → POST /api/promo-signup — once per email (`promoAutomationSentAt`)
 * - `SILVARA_RESEND_EVENTS.PRODUCT_VIEWED` → POST /api/resend/track — skipped if `firstOrderAt` set
 * - `SILVARA_RESEND_EVENTS.CART_ABANDONED` → POST /api/resend/track — skipped if `firstOrderAt` set
 * - `SILVARA_RESEND_EVENTS.ORDER_RECEIPT` → Stripe webhook — **every** order (transactional receipt)
 * - `SILVARA_RESEND_EVENTS.ORDER_COMPLETED` → Stripe webhook — **first order only** (nurture drip)
 * - `SILVARA_RESEND_EVENTS.WINBACK` → reserved; no server trigger until you have order history + cron
 *
 * Suggested delays (configure in Resend, not in code):
 * - Promo: 0, +12h, +12h, +24h, +24h after trigger for 0/12/24/48/72h emails
 * - Browse: +2h, +22h, +24h after product_viewed (tune in dashboard)
 * - Cart: +3h, +21h, +24h after cart_abandoned (tune in dashboard)
 * - Post-purchase nurture (`order_completed`): 7d → 7d → 14d after first order only
 */
export const SILVARA_RESEND_EVENTS = {
  PROMO_SIGNUP: "silvara.promo_signup",
  PRODUCT_VIEWED: "silvara.product_viewed",
  CART_ABANDONED: "silvara.cart_abandoned",
  /** Order confirmation / receipt — every checkout. */
  ORDER_RECEIPT: "silvara.order_receipt",
  /** First-purchase nurture sequence only (no receipt). */
  ORDER_COMPLETED: "silvara.order_completed",
  WINBACK: "silvara.winback",
} as const;

export type SilvaraResendEventName =
  (typeof SILVARA_RESEND_EVENTS)[keyof typeof SILVARA_RESEND_EVENTS];
