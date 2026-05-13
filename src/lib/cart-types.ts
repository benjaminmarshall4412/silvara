import type { BundleId } from "@/lib/products";
import type { SockSize } from "@/lib/sock-sizes";

export type CartLine = {
  id: BundleId;
  quantity: number;
  /** Crew sock size for fulfillment; persisted with the line. */
  sockSize: SockSize;
};
