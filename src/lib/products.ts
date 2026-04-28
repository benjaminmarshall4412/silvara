export type BundleId = "single" | "triple" | "six" | "rotation";

export type Product = {
  id: BundleId;
  name: string;
  shortName: string;
  stripeLookupKey: string;
  priceCents: number;
  unitNote: string;
  description: string;
  badge?: string;
  featured?: boolean;
  isSubscription?: boolean;
};

export const PRODUCTS: Product[] = [
  {
    id: "single",
    name: "1 PAIR",
    shortName: "Single",
    stripeLookupKey: "silvara_single_usd_onetime_v1",
    priceCents: 1800,
    unitNote: "Anchor · try fit in your boot before you stock up.",
    description: "Test toe box, calf height, and wash cycle. One pair.",
  },
  {
    id: "triple",
    name: "3-PACK",
    shortName: "Triple",
    stripeLookupKey: "silvara_triple_usd_onetime_v1",
    priceCents: 4200,
    unitNote: "$14 / pair bundled.",
    description: "Main offer. Enough to rotate a full workweek without re-wearing damp.",
    badge: "PRIMARY",
    featured: true,
  },
  {
    id: "six",
    name: "6-PACK",
    shortName: "Six",
    stripeLookupKey: "silvara_six_usd_onetime_v1",
    priceCents: 7200,
    unitNote: "$12 / pair — best per-shift cost.",
    description: "Overtime, six-day weeks, or two people on the same laundry day. Buy once.",
    badge: "VALUE",
  },
  {
    id: "rotation",
    name: "FRESH ROTATION",
    shortName: "Rotation",
    stripeLookupKey: "silvara_rotation_usd_subscription_v1",
    priceCents: 3800,
    unitNote: "Per shipment · 3 pairs",
    description:
      "Resupply every 2–3 months so you never run out mid-pay-period. Pause anytime.",
    badge: "WORKWEEK",
    isSubscription: true,
  },
];

export function getProduct(id: BundleId): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Two-decimal USD (e.g. per-pair after promo). */
export function formatUsdFine(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
