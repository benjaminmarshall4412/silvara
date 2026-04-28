import type { BundleId } from "@/lib/products"
import { getProduct } from "@/lib/products"
import { envServer } from "@/lib/env.server"

export type CheckoutLine = {
  id: BundleId
  quantity: number
}

const stripePriceByBundle: Record<BundleId, string> = {
  single: envServer.stripePriceSingle,
  triple: envServer.stripePriceTriple,
  six: envServer.stripePriceSix,
  rotation: envServer.stripePriceRotation,
}

export function validateCheckoutLines(lines: unknown): CheckoutLine[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Cart is empty")
  }

  const normalized: CheckoutLine[] = []

  for (const line of lines) {
    const id = typeof line?.id === "string" ? line.id : null
    const quantity = Number(line?.quantity)

    if (!id || !Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error("Invalid cart line")
    }

    const product = getProduct(id as BundleId)
    if (!product) {
      throw new Error(`Invalid product: ${id}`)
    }

    if (product.isSubscription && quantity > 1) {
      throw new Error("Rotation subscription quantity cannot exceed 1")
    }

    normalized.push({ id: id as BundleId, quantity })
  }

  return normalized
}

export function getCheckoutMode(lines: CheckoutLine[]): "payment" | "subscription" {
  return lines.some((line) => getProduct(line.id)?.isSubscription) ? "subscription" : "payment"
}

export function toStripeLineItems(lines: CheckoutLine[]): { price: string; quantity: number }[] {
  return lines.map((line) => ({
    price: stripePriceByBundle[line.id],
    quantity: line.quantity,
  }))
}
