import type { BundleId } from "@/lib/products";
import type { SockColor } from "@/lib/sock-colors";
import type { SockSize } from "@/lib/sock-sizes";

export type CartLine = {
  id: BundleId;
  quantity: number;
  /** One-size fit; persisted for fulfillment metadata. */
  sockSize: SockSize;
  /** Colorway for fulfillment; persisted with the line. */
  sockColor: SockColor;
};
