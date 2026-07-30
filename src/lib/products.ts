export type BundleId = "single" | "triple" | "six" | "rotation";

export const BUNDLE_IDS: readonly BundleId[] = [
  "single",
  "triple",
  "six",
  "rotation",
] as const;

export function isBundleId(value: string): value is BundleId {
  return (BUNDLE_IDS as readonly string[]).includes(value);
}

/** First-order promo estimate (matches pricing / checkout UI). */
export function applyPromoToCents(cents: number, pct: number): number {
  return Math.round((cents * (100 - pct)) / 100);
}

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
    unitNote: "$5.95 shipping at checkout.",
    description: "Same thin silver crew as the packs—fit, wash, toe box before you buy more.",
  },
  {
    id: "triple",
    name: "3-PACK",
    shortName: "Triple",
    stripeLookupKey: "silvara_triple_usd_onetime_v2",
    priceCents: 4800,
    unitNote: "Free shipping · $16 a pair.",
    description: "Three pairs—same sock—for a workweek without re-wearing damp.",
    featured: true,
  },
  {
    id: "six",
    name: "6-PACK",
    shortName: "Six",
    stripeLookupKey: "silvara_six_usd_onetime_v1",
    priceCents: 7200,
    unitNote: "$12 a pair.",
    description: "Six pairs—heavy weeks, six days, or two people on one wash day.",
  },
  {
    id: "rotation",
    name: "FRESH ROTATION",
    shortName: "Rotation",
    stripeLookupKey: "silvara_rotation_usd_subscription_v1",
    priceCents: 3800,
    unitNote: "3 pairs · monthly",
    description: "Same sock as packs. 3 pairs/month—pause in Stripe anytime.",
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

/** Format minor units using Stripe currency (ISO 4217). */
export function formatMoney(cents: number, currencyCode: string): string {
  const code = currencyCode.length === 3 ? currencyCode.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return formatUsdFine(cents);
  }
}
