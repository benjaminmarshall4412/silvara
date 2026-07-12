import type { BundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";

/** Product is one-size; legacy S/M/L/XL cart values normalize to OS. */
export const SOCK_SIZES = ["OS"] as const;
export type SockSize = (typeof SOCK_SIZES)[number];

export const DEFAULT_SOCK_SIZE: SockSize = "OS";

const LEGACY_SIZES = new Set(["S", "M", "L", "XL", "OS"]);

/** Short label for cart / checkout rows */
export const SOCK_SIZE_SHORT: Record<SockSize, string> = {
  OS: "One size",
};

/** Product-page helper copy */
export const SOCK_SIZE_DESCRIPTION: Record<SockSize, string> = {
  OS: "One size fits most",
};

export function isSockSize(value: unknown): value is SockSize {
  return value === "OS";
}

/** Accept legacy cart sizes and map everything to one-size. */
export function normalizeSockSize(value: unknown): SockSize {
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
