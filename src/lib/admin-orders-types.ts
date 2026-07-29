import type { SockColor } from "@/lib/sock-colors";
import type { SiteRegion } from "@/lib/site-region";

export type AdminOrderLine = {
  bundleId: string;
  name: string;
  quantity: number;
  sockSize: string;
  sockColor: SockColor;
  sockColorLabel: string;
};

export type AdminOrderAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type AdminOrder = {
  id: string;
  region: SiteRegion;
  createdAt: number;
  mode: string;
  paymentStatus: string;
  status: string | null;
  amountTotal: number | null;
  amountSubtotal: number | null;
  amountDiscount: number | null;
  amountShipping: number | null;
  currency: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingName: string | null;
  shippingAddress: AdminOrderAddress | null;
  billingAddress: AdminOrderAddress | null;
  lines: AdminOrderLine[];
  stripeLineItems: {
    description: string | null;
    quantity: number | null;
    amountTotal: number | null;
  }[];
  /** ISO timestamp when marked packed in admin, or null. */
  packedAt: string | null;
};
