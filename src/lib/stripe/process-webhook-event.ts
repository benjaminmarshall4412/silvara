import type Stripe from "stripe";

import { getPostHogClient } from "@/lib/posthog-server";
import { recordFirstOrderIfNeeded } from "@/lib/email-signup-db";
import { formatAddressLines, parseSilvaraCartMetadata } from "@/lib/order-cart";
import { notifyNtfy } from "@/lib/ntfy";
import { SILVARA_RESEND_EVENTS } from "@/lib/resend-automation-events";
import { sendOrderConfirmationEmail } from "@/lib/send-order-confirmation-email";
import { sendResendAutomationEvent } from "@/lib/send-resend-automation-event";
import { formatMoney } from "@/lib/products";
import { isSiteRegion } from "@/lib/site-region";

type SessionWithShipping = Stripe.Checkout.Session & {
  shipping_details?: {
    name?: string | null;
    address?: Stripe.Address | null;
  } | null;
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      address?: Stripe.Address | null;
    } | null;
  } | null;
};

function shippingFromSession(session: SessionWithShipping) {
  const collected = session.collected_information?.shipping_details;
  const legacy = session.shipping_details;
  return {
    name: collected?.name ?? legacy?.name ?? null,
    address: collected?.address ?? legacy?.address ?? null,
  };
}

function mapAddr(addr: Stripe.Address | null | undefined) {
  if (!addr) return null;
  return {
    line1: addr.line1 ?? null,
    line2: addr.line2 ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    postalCode: addr.postal_code ?? null,
    country: addr.country ?? null,
  };
}

/** Shared handler after signature verification — keep logic in one place for US + UK endpoints. */
export async function logStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const posthog = getPostHogClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.info("[stripe] checkout.session.completed", {
        sessionId: session.id,
        mode: session.mode,
        amountTotal: session.amount_total,
        customerEmail: session.customer_details?.email,
      });
      const distinctId = session.customer_details?.email ?? session.id;
      const extended = session as SessionWithShipping;
      const shipping = shippingFromSession(extended);
      const shipAddr = mapAddr(shipping.address);
      const billAddr = mapAddr(session.customer_details?.address);
      const addr = shipAddr ?? billAddr;
      const discountCents =
        session.total_details?.amount_discount ?? undefined;
      const lines = parseSilvaraCartMetadata(session.metadata?.silvara_cart);
      const rawRegion = session.metadata?.silvara_region;
      const region = isSiteRegion(rawRegion) ? rawRegion : null;
      const currency = session.currency?.toUpperCase() ?? "USD";
      const totalLabel =
        session.amount_total != null
          ? formatMoney(session.amount_total, currency)
          : "—";

      posthog.capture({
        distinctId,
        event: "order_completed",
        properties: {
          session_id: session.id,
          mode: session.mode,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email ?? null,
          discount_total_cents: discountCents,
          shipping_country: addr?.country ?? null,
          shipping_state: addr?.state ?? null,
        },
      });

      const itemSummary =
        lines.length > 0
          ? lines
              .map(
                (l) =>
                  `${l.quantity}× ${l.name} (${l.sockColorLabel})`,
              )
              .join(", ")
          : "see Stripe session";
      const shipLines = formatAddressLines(addr);
      const ntfyBody = [
        `${session.customer_details?.name?.trim() || "Customer"} · ${totalLabel}`,
        session.customer_details?.email ?? "",
        session.customer_details?.phone
          ? `Phone: ${session.customer_details.phone}`
          : "",
        itemSummary,
        shipLines.length
          ? `Ship: ${[shipping.name, ...shipLines].filter(Boolean).join(", ")}`
          : "",
        `${(region ?? "?").toUpperCase()} · ${session.id}`,
      ]
        .filter(Boolean)
        .join("\n");

      await notifyNtfy({
        title: `SILVARA order ${totalLabel}`,
        message: ntfyBody,
        priority: 4,
        tags: ["package", "silvara"],
      });

      if (session.customer_details?.email) {
        posthog.identify({
          distinctId: session.customer_details.email,
          properties: { email: session.customer_details.email },
        });

        await sendOrderConfirmationEmail({
          to: session.customer_details.email,
          customerName: session.customer_details.name,
          amountTotal: session.amount_total,
          currency: session.currency,
          sessionId: session.id,
          lines: lines.map((l) => ({
            name: l.name,
            quantity: l.quantity,
            colorLabel: l.sockColorLabel,
          })),
          shippingLines: [
            ...(shipping.name ? [shipping.name] : []),
            ...shipLines,
          ],
        });

        const { shouldSendOrderAutomation } = await recordFirstOrderIfNeeded({
          email: session.customer_details.email,
          region,
        });
        if (shouldSendOrderAutomation) {
          await sendResendAutomationEvent({
            event: SILVARA_RESEND_EVENTS.ORDER_COMPLETED,
            email: session.customer_details.email,
            payload: {
              session_id: session.id,
              amount_total: session.amount_total,
              currency: session.currency,
              mode: session.mode,
              region,
            },
          });
        }
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      console.info("[stripe] invoice.paid", {
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        customerId:
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id,
      });
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer?.id ?? invoice.id);
      posthog.capture({
        distinctId: customerId,
        event: "subscription_invoice_paid",
        properties: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          customer_id: customerId,
        },
      });
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.info(`[stripe] ${event.type}`, {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.info(`[stripe] ${event.type}`, {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      const subCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : (subscription.customer?.id ?? subscription.id);
      posthog.capture({
        distinctId: subCustomerId,
        event: "subscription_cancelled",
        properties: {
          subscription_id: subscription.id,
          status: subscription.status,
          customer_id: subCustomerId,
        },
      });
      break;
    }
    default:
      break;
  }

  await posthog.shutdown();
}
