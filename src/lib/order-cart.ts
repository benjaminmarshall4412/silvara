import "server-only";

import type { AdminOrderAddress, AdminOrderLine } from "@/lib/admin-orders-types";
import { getProduct, isBundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  isSockColor,
  SOCK_COLOR_LABEL,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE, normalizeSockSize } from "@/lib/sock-sizes";

/** Shared parser for Stripe `metadata.silvara_cart`. */
export function parseSilvaraCartMetadata(
  raw: string | null | undefined,
): AdminOrderLine[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const o = row as Record<string, unknown>;
      const id = typeof o.i === "string" ? o.i : "";
      if (!id) return [];
      const quantity =
        typeof o.q === "number" && Number.isFinite(o.q) && o.q > 0
          ? Math.floor(o.q)
          : 1;
      const sockSize = normalizeSockSize(o.s);
      const sockColor = isSockColor(o.c) ? o.c : DEFAULT_SOCK_COLOR;
      const product = isBundleId(id) ? getProduct(id) : undefined;
      return [
        {
          bundleId: id,
          name: product?.name ?? id,
          quantity,
          sockSize: sockSize || DEFAULT_SOCK_SIZE,
          sockColor,
          sockColorLabel: SOCK_COLOR_LABEL[sockColor],
        },
      ];
    });
  } catch {
    return [];
  }
}

export function formatAddressLines(
  addr: AdminOrderAddress | null | undefined,
): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  if (addr.line1) lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  const cityLine = [addr.city, addr.state, addr.postalCode]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  return lines;
}
