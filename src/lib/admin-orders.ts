import "server-only";

import type Stripe from "stripe";

import type {
  AdminOrder,
  AdminOrderAddress,
  AdminOrderLine,
} from "@/lib/admin-orders-types";
import { formatAddressLines, parseSilvaraCartMetadata } from "@/lib/order-cart";
import { getStripeForRegion } from "@/lib/stripe/server";
import { isSiteRegion, type SiteRegion } from "@/lib/site-region";

export type { AdminOrder, AdminOrderAddress, AdminOrderLine } from "@/lib/admin-orders-types";
export { formatAddressLines };

function mapAddress(addr: Stripe.Address | null | undefined): AdminOrderAddress | null {
  if (!addr) return null;
  if (!addr.line1 && !addr.city && !addr.country && !addr.postal_code) return null;
  return {
    line1: addr.line1 ?? null,
    line2: addr.line2 ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    postalCode: addr.postal_code ?? null,
    country: addr.country ?? null,
  };
}

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

function shippingFromSession(session: SessionWithShipping): {
  name: string | null;
  address: AdminOrderAddress | null;
} {
  const collected = session.collected_information?.shipping_details;
  const legacy = session.shipping_details;
  const name = collected?.name ?? legacy?.name ?? null;
  const address = mapAddress(collected?.address ?? legacy?.address);
  return { name, address };
}

function mapSession(
  session: Stripe.Checkout.Session,
  regionFallback: SiteRegion,
): AdminOrder {
  const s = session as SessionWithShipping;
  const metaRegion = session.metadata?.silvara_region;
  const region = isSiteRegion(metaRegion) ? metaRegion : regionFallback;
  const shipping = shippingFromSession(s);
  const lineItems =
    session.line_items && typeof session.line_items !== "string"
      ? session.line_items.data
      : [];

  return {
    id: session.id,
    region,
    createdAt: session.created,
    mode: session.mode,
    paymentStatus: session.payment_status,
    status: session.status,
    amountTotal: session.amount_total,
    amountSubtotal: session.amount_subtotal,
    amountDiscount: session.total_details?.amount_discount ?? null,
    amountShipping: session.total_details?.amount_shipping ?? null,
    currency: session.currency,
    customerName: session.customer_details?.name ?? null,
    customerEmail: session.customer_details?.email ?? null,
    customerPhone: session.customer_details?.phone ?? null,
    shippingName: shipping.name,
    shippingAddress: shipping.address,
    billingAddress: mapAddress(session.customer_details?.address),
    lines: parseSilvaraCartMetadata(session.metadata?.silvara_cart),
    stripeLineItems: lineItems.map((li) => ({
      description: li.description ?? null,
      quantity: li.quantity,
      amountTotal: li.amount_total,
    })),
  };
}

async function listRegionOrders(
  region: SiteRegion,
  limit: number,
): Promise<{ orders: AdminOrder[]; error?: string }> {
  try {
    const stripe = getStripeForRegion(region);
    const listed = await stripe.checkout.sessions.list({
      limit,
      status: "complete",
      expand: ["data.line_items"],
    });
    const paid = listed.data.filter(
      (s) => s.payment_status === "paid" || s.payment_status === "no_payment_required",
    );
    return { orders: paid.map((s) => mapSession(s, region)) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Failed to list ${region} orders`;
    console.error(`[admin-orders] ${region}`, message);
    return { orders: [], error: message };
  }
}

/** Paid/complete Checkout Sessions from US + UK Stripe accounts, newest first. */
export async function listAdminOrders(limitPerRegion = 40): Promise<{
  orders: AdminOrder[];
  warnings: string[];
}> {
  const [us, uk] = await Promise.all([
    listRegionOrders("us", limitPerRegion),
    listRegionOrders("uk", limitPerRegion),
  ]);
  const warnings: string[] = [];
  if (us.error) warnings.push(`US Stripe: ${us.error}`);
  if (uk.error) warnings.push(`UK Stripe: ${uk.error}`);
  const orders = [...us.orders, ...uk.orders].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  return { orders, warnings };
}

/** Single Checkout Session for label / fulfillment actions. */
export async function getAdminOrder(
  sessionId: string,
  region: SiteRegion,
): Promise<AdminOrder | null> {
  try {
    const stripe = getStripeForRegion(region);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    return mapSession(session, region);
  } catch (error) {
    console.error("[admin-orders] getAdminOrder", error);
    return null;
  }
}
