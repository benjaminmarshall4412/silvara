import type { CartLine } from "@/lib/cart-types";
import type { BundleId } from "@/lib/products";

/** localStorage payload */
export const SILVARA_CART_STORAGE_KEY = "silvara-cart-v1";
/** Mirrors cart in `document.cookie` so it survives as a fallback (small JSON blob). */
export const SILVARA_CART_COOKIE_NAME = "silvara_cart";

const IDS: BundleId[] = ["single", "triple", "six", "rotation"];

export function isBundleId(id: unknown): id is BundleId {
  return typeof id === "string" && IDS.includes(id as BundleId);
}

/** Parse cart from storage safely; invalid entries are dropped */
export function parseStoredCart(raw: string | null): CartLine[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const qtyById = new Map<BundleId, number>();
    for (const row of parsed) {
      const id =
        row && typeof row === "object" && "id" in row ? (row as { id: unknown }).id : undefined;
      const q =
        row && typeof row === "object" && "quantity" in row
          ? (row as { quantity: unknown }).quantity
          : undefined;
      if (!isBundleId(id)) continue;
      const qty = Number(q);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) continue;
      qtyById.set(id, (qtyById.get(id) ?? 0) + qty);
    }
    if (qtyById.size === 0) return [];
    return Array.from(qtyById.entries()).map(([bundleId, quantity]) => ({
      id: bundleId,
      quantity,
    }));
  } catch {
    return null;
  }
}

function readCookieCart(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SILVARA_CART_COOKIE_NAME}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** Prefer localStorage, then mirrored cookie — both stay in sync on save */
export function readPersistedCart(): CartLine[] | null {
  if (typeof window === "undefined") return null;
  let raw = localStorage.getItem(SILVARA_CART_STORAGE_KEY);
  if (!raw) raw = readCookieCart();
  return parseStoredCart(raw);
}

/** Write cart to localStorage + scoped cookie (~1 yr, SameSite=Lax). */
export function persistCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(lines);
  try {
    localStorage.setItem(SILVARA_CART_STORAGE_KEY, payload);
    const encoded = encodeURIComponent(payload);
    const maxAgeSeconds = 60 * 60 * 24 * 365;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SILVARA_CART_COOKIE_NAME}=${encoded}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  } catch {
    // storage full or denied — cart still works in memory
  }
}

export function clearPersistedCart(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SILVARA_CART_STORAGE_KEY);
    document.cookie = `${SILVARA_CART_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // ignore
  }
}
