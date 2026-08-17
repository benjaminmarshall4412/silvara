import type { BundleId } from "@/lib/products";
import { PRODUCTS } from "@/lib/products";
import type { SiteRegion } from "@/lib/site-region";

/** UK odor landing slug; US keeps American spelling. */
export function odorLandingPath(region: SiteRegion): "/odor" | "/odour" {
  return region === "uk" ? "/odour" : "/odor";
}

export function getShippingFeeCents(region: SiteRegion): number {
  return region === "uk" ? 200 : 595;
}

const UK_FALLBACK_PRICES: Partial<Record<BundleId, number>> = {
  single: 1599,
  triple: 3600,
};

/** Stripe `unit_amount` fallbacks when catalog API is unavailable. */
export function getFallbackPriceCents(
  bundleId: BundleId,
  region: SiteRegion,
): number {
  if (region === "uk") {
    const uk = UK_FALLBACK_PRICES[bundleId];
    if (uk != null) return uk;
  }
  return PRODUCTS.find((p) => p.id === bundleId)?.priceCents ?? 0;
}

export function defaultFallbackPrices(
  region: SiteRegion,
): Record<BundleId, number> {
  return Object.fromEntries(
    PRODUCTS.map((p) => [p.id, getFallbackPriceCents(p.id, region)]),
  ) as Record<BundleId, number>;
}

/** US "odor" → UK "odour" in customer-facing copy. */
export function localizeOdorSpelling(
  text: string,
  region: SiteRegion,
): string {
  if (region !== "uk") return text;
  return text.replace(/\bodor\b/gi, (match) => {
    if (match === "ODOR") return "ODOUR";
    if (match[0] === match[0]?.toUpperCase()) return "Odour";
    return "odour";
  });
}

export const US_SOCK_SIZES = ["7", "8", "9", "10", "11", "12", "13"] as const;
export const UK_SOCK_SIZES = ["6", "7", "8", "9", "10", "11", "12"] as const;

export const DEFAULT_SOCK_SIZE: UsSockSize = "10";

export type UsSockSize = (typeof US_SOCK_SIZES)[number];
export type UkSockSize = (typeof UK_SOCK_SIZES)[number];
export type SockSize = UsSockSize | UkSockSize;

export function getSockSizesForRegion(
  region: SiteRegion,
): readonly SockSize[] {
  return region === "uk" ? UK_SOCK_SIZES : US_SOCK_SIZES;
}

export function getDefaultSockSizeForRegion(region: SiteRegion): SockSize {
  return region === "uk" ? "9" : "10";
}

export function getShoeSizeFieldLabel(region: SiteRegion): string {
  return region === "uk" ? "UK men's shoe size" : "US men's shoe size";
}

export function isSockSizeForRegion(
  value: unknown,
  region: SiteRegion,
): value is SockSize {
  return (
    typeof value === "string" &&
    (getSockSizesForRegion(region) as readonly string[]).includes(value)
  );
}

export function normalizeSockSizeForRegion(
  value: unknown,
  region: SiteRegion,
): SockSize {
  if (isSockSizeForRegion(value, region)) return value;
  return getDefaultSockSizeForRegion(region);
}
