import type { BundleId } from "@/lib/products";
import { getProduct } from "@/lib/products";
import { getStripePriceIdsForRegion } from "@/lib/env.server";
import type { SiteRegion } from "@/lib/site-region";
import { DEFAULT_SOCK_SIZE, isSockSize } from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";

export type CheckoutLine = {
  id: BundleId;
  quantity: number;
  sockSize: SockSize;
};

export function validateCheckoutLines(lines: unknown): CheckoutLine[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const normalized: CheckoutLine[] = [];

  for (const line of lines) {
    const id = typeof line?.id === "string" ? line.id : null;
    const quantity = Number(line?.quantity);
    const rawSize =
      line && typeof line === "object" && "sockSize" in line
        ? (line as { sockSize?: unknown }).sockSize
        : undefined;
    const sockSize: SockSize = isSockSize(rawSize) ? rawSize : DEFAULT_SOCK_SIZE;

    if (
      !id ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      !Number.isInteger(quantity)
    ) {
      throw new Error("Invalid cart line");
    }

    const product = getProduct(id as BundleId);
    if (!product) {
      throw new Error(`Invalid product: ${id}`);
    }

    if (product.isSubscription && quantity > 1) {
      throw new Error("Rotation subscription quantity cannot exceed 1");
    }

    normalized.push({ id: id as BundleId, quantity, sockSize });
  }

  return normalized;
}

export function getCheckoutMode(
  lines: CheckoutLine[],
): "payment" | "subscription" {
  return lines.some((line) => getProduct(line.id)?.isSubscription)
    ? "subscription"
    : "payment";
}

export function toStripeLineItems(
  lines: CheckoutLine[],
  region: SiteRegion,
): { price: string; quantity: number }[] {
  const stripePriceByBundle = getStripePriceIdsForRegion(region);
  return lines.map((line) => ({
    price: stripePriceByBundle[line.id],
    quantity: line.quantity,
  }));
}
