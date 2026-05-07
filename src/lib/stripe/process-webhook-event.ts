import type Stripe from "stripe";

/** Shared handler after signature verification — keep logic in one place for US + UK endpoints. */
export function logStripeWebhookEvent(event: Stripe.Event): void {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.info("[stripe] checkout.session.completed", {
        sessionId: session.id,
        mode: session.mode,
        amountTotal: session.amount_total,
        customerEmail: session.customer_details?.email,
      });
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
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.info(`[stripe] ${event.type}`, {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      break;
    }
    default:
      break;
  }
}
