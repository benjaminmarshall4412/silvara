import type { BundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";

export const SOCK_SIZES = ["S", "M", "L", "XL"] as const;
export type SockSize = (typeof SOCK_SIZES)[number];

export const DEFAULT_SOCK_SIZE: SockSize = "M";

/** Short label for cart / checkout rows */
export const SOCK_SIZE_SHORT: Record<SockSize, string> = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
};

/** Product-page helper copy (approximate US men's shoe range for crew). */
export const SOCK_SIZE_DESCRIPTION: Record<SockSize, string> = {
  S: "US men's ~5–7",
  M: "US men's ~8–10",
  L: "US men's ~11–13",
  XL: "US men's ~14+",
};

export function isSockSize(value: unknown): value is SockSize {
  return typeof value === "string" && (SOCK_SIZES as readonly string[]).includes(value);
}

const KEY_SEP = "__";

export function cartLineKey(line: {
  id: BundleId;
  sockSize?: SockSize;
  sockColor?: SockColor;
}): string {
  return `${line.id}${KEY_SEP}${line.sockSize ?? DEFAULT_SOCK_SIZE}${KEY_SEP}${line.sockColor ?? DEFAULT_SOCK_COLOR}`;
}
