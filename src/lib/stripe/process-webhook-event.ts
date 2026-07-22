import type Stripe from "stripe";

import { getPostHogClient } from "@/lib/posthog-server";
import { recordFirstOrderIfNeeded } from "@/lib/email-signup-db";
import { sendMetaCapiEvents } from "@/lib/meta/capi";
import { SILVARA_RESEND_EVENTS } from "@/lib/resend-automation-events";
import { sendResendAutomationEvent } from "@/lib/send-resend-automation-event";
import { isSiteRegion } from "@/lib/site-region";

function splitName(full: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  if (!full?.trim()) return {};
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
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
      const extended = session as Stripe.Checkout.Session & {
        shipping_details?: { address?: Stripe.Address | null } | null;
      };
      const addr =
        session.customer_details?.address ?? extended.shipping_details?.address ?? null;
      const discountCents =
        session.total_details?.amount_discount ?? undefined;
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

      const { firstName, lastName } = splitName(session.customer_details?.name);
      const metaFbp = session.metadata?.meta_fbp?.trim() || undefined;
      const metaFbc = session.metadata?.meta_fbc?.trim() || undefined;
      let contentIds: string[] | undefined;
      try {
        const cartRaw = session.metadata?.silvara_cart;
        if (cartRaw) {
          const parsed = JSON.parse(cartRaw) as Array<{ i?: string }>;
          contentIds = parsed
            .map((row) => row.i)
            .filter((id): id is string => typeof id === "string");
        }
      } catch {
        contentIds = undefined;
      }

      await sendMetaCapiEvents([
        {
          eventName: "Purchase",
          eventId: session.id,
          eventSourceUrl: undefined,
          userData: {
            email: session.customer_details?.email,
            phone: session.customer_details?.phone,
            firstName,
            lastName,
            country: addr?.country,
            state: addr?.state,
            zip: addr?.postal_code,
            city: addr?.city,
            fbp: metaFbp,
            fbc: metaFbc,
          },
          customData: {
            value:
              typeof session.amount_total === "number"
                ? session.amount_total / 100
                : undefined,
            currency: session.currency?.toUpperCase(),
            content_ids: contentIds,
            content_type: "product",
            order_id: session.id,
          },
        },
      ]);

      if (session.customer_details?.email) {
        posthog.identify({
          distinctId: session.customer_details.email,
          properties: { email: session.customer_details.email },
        });

        const rawRegion = session.metadata?.silvara_region;
        const region = isSiteRegion(rawRegion) ? rawRegion : null;
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
