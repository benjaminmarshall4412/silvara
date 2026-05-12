<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the SILVARA Next.js App Router storefront. PostHog is initialized client-side via `instrumentation-client.ts` (Next.js 15.3+ recommended approach) with a reverse proxy through `/ingest` to improve ad-blocker resilience. A shared `posthog-node` server client (`src/lib/posthog-server.ts`) is used across all API routes and webhooks. Exception capture is enabled globally. Users are identified by email address at promo signup, order confirmation (client-side), and on the server at order completion and promo signup.

| Event | Description | File |
|---|---|---|
| `product_viewed` | User views a product detail page (top of conversion funnel) | `src/components/product-detail-panel.tsx` |
| `product_added_to_cart` | User clicks Add to Cart or Start Rotation on any product | `src/components/add-to-cart-button.tsx` |
| `cart_item_removed` | User removes a line item from the cart drawer | `src/components/cart-drawer.tsx` |
| `cart_item_quantity_changed` | User increments or decrements a line item quantity in the cart drawer | `src/components/cart-drawer.tsx` |
| `checkout_started` | User clicks the Checkout link in the cart drawer (cart is non-empty) | `src/components/cart-drawer.tsx` |
| `promo_modal_dismissed` | User dismisses the email promo modal without submitting | `src/components/email-promo-modal.tsx` |
| `promo_email_submitted` | User successfully submits their email to claim the first-order discount | `src/components/email-promo-modal.tsx` |
| `checkout_session_error` | Stripe checkout session failed to initialize on the checkout page | `src/app/[region]/checkout/page.tsx` |
| `order_confirmed` | Client-side purchase confirmation after Stripe redirects to the success page | `src/app/[region]/checkout/success/success-content.tsx` |
| `promo_signup_completed` | Server-side: promo email signup succeeded and promo cookie was set | `src/app/api/promo-signup/route.ts` |
| `checkout_session_created` | Server-side: Stripe checkout session created via create-intent API | `src/app/api/stripe/create-intent/route.ts` |
| `order_completed` | Server-side: Stripe webhook checkout.session.completed received | `src/lib/stripe/process-webhook-event.ts` |
| `subscription_invoice_paid` | Server-side: Stripe webhook invoice.paid received for a rotation subscription | `src/lib/stripe/process-webhook-event.ts` |
| `subscription_cancelled` | Server-side: Stripe webhook customer.subscription.deleted received | `src/lib/stripe/process-webhook-event.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1576075)
- [Purchase funnel](/insights/BfCqnnCL) — conversion from product viewed → add to cart → checkout started → order confirmed
- [Add to cart & checkout started](/insights/DgONDvaD) — daily volume of cart actions
- [Promo email signups](/insights/Hd2Ng6qn) — daily count of first-order discount claims
- [Orders completed (server-side)](/insights/JisYzS3D) — authoritative purchase count from Stripe webhooks
- [Subscription health](/insights/HmzrSuNr) — weekly invoices paid vs cancellations

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
