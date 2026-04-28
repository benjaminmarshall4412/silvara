import type { BundleId } from "@/lib/products";

export type CartLine = {
  id: BundleId;
  quantity: number;
};
