import type { BundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";

/**
 * Customer picks a US men's shoe size. Same sock ships for every size —
 * the label is for the buyer, not a different SKU.
 */
export const SOCK_SIZES = ["7", "8", "9", "10", "11", "12", "13"] as const;
export type SockSize = (typeof SOCK_SIZES)[number];

export const DEFAULT_SOCK_SIZE: SockSize = "10";

const LEGACY_SIZES = new Set(["S", "M", "L", "XL", "OS"]);

/** Short label for cart / checkout rows */
export const SOCK_SIZE_SHORT: Record<SockSize, string> = {
  "7": "Size 7",
  "8": "Size 8",
  "9": "Size 9",
  "10": "Size 10",
  "11": "Size 11",
  "12": "Size 12",
  "13": "Size 13",
};

/** Product-page helper copy */
export const SOCK_SIZE_DESCRIPTION: Record<SockSize, string> = {
  "7": "US men’s 7",
  "8": "US men’s 8",
  "9": "US men’s 9",
  "10": "US men’s 10",
  "11": "US men’s 11",
  "12": "US men’s 12",
  "13": "US men’s 13",
};

export function isSockSize(value: unknown): value is SockSize {
  return (
    typeof value === "string" &&
    (SOCK_SIZES as readonly string[]).includes(value)
  );
}

/** Accept legacy cart sizes and map unknown values to the default. */
export function normalizeSockSize(value: unknown): SockSize {
  if (isSockSize(value)) return value;
  if (typeof value === "string" && LEGACY_SIZES.has(value)) {
    return DEFAULT_SOCK_SIZE;
  }
  return DEFAULT_SOCK_SIZE;
}

const KEY_SEP = "__";

export function cartLineKey(line: {
  id: BundleId;
  sockSize?: SockSize;
  sockColor?: SockColor;
}): string {
  return `${line.id}${KEY_SEP}${line.sockSize ?? DEFAULT_SOCK_SIZE}${KEY_SEP}${line.sockColor ?? DEFAULT_SOCK_COLOR}`;
}
