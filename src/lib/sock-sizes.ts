import type { BundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_SIZE,
  getDefaultSockSizeForRegion,
  getShoeSizeFieldLabel,
  getSockSizesForRegion,
  isSockSizeForRegion,
  normalizeSockSizeForRegion,
  type SockSize,
  US_SOCK_SIZES,
} from "@/lib/region-storefront";
import type { SiteRegion } from "@/lib/site-region";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";

export type { SockSize };
export { US_SOCK_SIZES as SOCK_SIZES, getSockSizesForRegion, getShoeSizeFieldLabel };

export { DEFAULT_SOCK_SIZE };

const LEGACY_SIZES = new Set(["S", "M", "L", "XL", "OS"]);

/** Short label for cart / checkout rows */
export const SOCK_SIZE_SHORT: Record<string, string> = {
  "6": "Size 6",
  "7": "Size 7",
  "8": "Size 8",
  "9": "Size 9",
  "10": "Size 10",
  "11": "Size 11",
  "12": "Size 12",
  "13": "Size 13",
};

/** Product-page helper copy (US labels — use getShoeSizeFieldLabel for regional UI). */
export const SOCK_SIZE_DESCRIPTION: Record<string, string> = {
  "6": "UK men's 6",
  "7": "US men's 7",
  "8": "US men's 8",
  "9": "US men's 9",
  "10": "US men's 10",
  "11": "US men's 11",
  "12": "US men's 12",
  "13": "US men's 13",
};

export function isSockSize(value: unknown): value is SockSize {
  return isSockSizeForRegion(value, "us") || isSockSizeForRegion(value, "uk");
}

/** Accept legacy cart sizes and map unknown values to the default. */
export function normalizeSockSize(value: unknown): SockSize {
  if (isSockSize(value)) return value;
  if (typeof value === "string" && LEGACY_SIZES.has(value)) {
    return DEFAULT_SOCK_SIZE;
  }
  return DEFAULT_SOCK_SIZE;
}

export {
  getDefaultSockSizeForRegion,
  isSockSizeForRegion,
  normalizeSockSizeForRegion,
};

const KEY_SEP = "__";

export function cartLineKey(line: {
  id: BundleId;
  sockSize?: SockSize;
  sockColor?: SockColor;
}): string {
  return `${line.id}${KEY_SEP}${line.sockSize ?? DEFAULT_SOCK_SIZE}${KEY_SEP}${line.sockColor ?? DEFAULT_SOCK_COLOR}`;
}

export function sockSizeLabel(size: SockSize, region: SiteRegion): string {
  if (region === "uk") {
    return `UK men's ${size}`;
  }
  return `US men's ${size}`;
}
