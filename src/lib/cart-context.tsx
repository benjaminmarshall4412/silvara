"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CartLine } from "@/lib/cart-types";
import type { BundleId } from "@/lib/products";
import { getProduct } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";
import { cartLineKey } from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { clearPersistedCart, persistCart, readPersistedCart } from "@/lib/cart-storage";

type AddOptions = {
  /** Buy-now flows navigate straight to checkout, so the drawer would only flash. */
  openDrawer?: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  add: (
    id: BundleId,
    qty?: number,
    sockSize?: SockSize,
    sockColor?: SockColor,
    options?: AddOptions,
  ) => void;
  setQty: (lineKey: string, qty: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
  openCart: boolean;
  setOpenCart: (open: boolean) => void;
  itemCount: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { unitAmountCentsByBundle } = useStripeCatalogPrices();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const stored = readPersistedCart();
    queueMicrotask(() => {
      if (stored && stored.length > 0) {
        setLines(stored);
      }
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    if (lines.length === 0) clearPersistedCart();
    else persistCart(lines);
  }, [lines, storageReady]);

  const add = useCallback(
    (
      id: BundleId,
      qty = 1,
      sockSize: SockSize = DEFAULT_SOCK_SIZE,
      sockColor: SockColor = DEFAULT_SOCK_COLOR,
      options: AddOptions = {},
    ) => {
      setLines((prev) => {
        const i = prev.findIndex(
          (l) =>
            l.id === id &&
            l.sockSize === sockSize &&
            l.sockColor === sockColor,
        );
        if (i === -1) {
          return [...prev, { id, quantity: qty, sockSize, sockColor }];
        }
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty };
        return next;
      });
      if (options.openDrawer !== false) setOpenCart(true);
    },
    [],
  );

  const setQty = useCallback((lineKey: string, qty: number) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => cartLineKey(l) === lineKey);
      if (i === -1) return prev;
      if (qty < 1) return prev.filter((l) => cartLineKey(l) !== lineKey);
      const next = [...prev];
      next[i] = { ...next[i], quantity: qty };
      return next;
    });
  }, []);

  const remove = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => cartLineKey(l) !== lineKey));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    clearPersistedCart();
  }, []);

  const { itemCount, subtotalCents } = useMemo(() => {
    let count = 0;
    let sub = 0;
    for (const line of lines) {
      const p = getProduct(line.id);
      if (!p) continue;
      const unit =
        unitAmountCentsByBundle[line.id] ?? p.priceCents;
      count += line.quantity;
      sub += unit * line.quantity;
    }
    return { itemCount: count, subtotalCents: sub };
  }, [lines, unitAmountCentsByBundle]);

  const value = useMemo(
    () => ({
      lines,
      add,
      setQty,
      remove,
      clear,
      openCart,
      setOpenCart,
      itemCount,
      subtotalCents,
    }),
    [
      lines,
      add,
      setQty,
      remove,
      clear,
      openCart,
      itemCount,
      subtotalCents,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export type { CartLine } from "@/lib/cart-types";
