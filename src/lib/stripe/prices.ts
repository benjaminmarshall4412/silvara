import type { BundleId } from "@/lib/products";
import { getProduct } from "@/lib/products";
import { getStripePriceIdsForRegion } from "@/lib/env.server";
import type { SiteRegion } from "@/lib/site-region";
import {
  DEFAULT_SOCK_COLOR,
  isSockColor,
  type SockColor,
} from "@/lib/sock-colors";
import { normalizeSockSize } from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";

export type CheckoutLine = {
  id: BundleId;
  quantity: number;
  sockSize: SockSize;
  sockColor: SockColor;
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
    const rawColor =
      line && typeof line === "object" && "sockColor" in line
        ? (line as { sockColor?: unknown }).sockColor
        : undefined;
    const sockSize: SockSize = normalizeSockSize(rawSize);
    const sockColor: SockColor = isSockColor(rawColor)
      ? rawColor
      : DEFAULT_SOCK_COLOR;

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

    normalized.push({
      id: id as BundleId,
      quantity,
      sockSize,
      sockColor,
    });
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
