"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BundleId } from "@/lib/products";
import { getProduct } from "@/lib/products";

export type CartLine = {
  id: BundleId;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  add: (id: BundleId, qty?: number) => void;
  setQty: (id: BundleId, qty: number) => void;
  remove: (id: BundleId) => void;
  clear: () => void;
  openCart: boolean;
  setOpenCart: (open: boolean) => void;
  itemCount: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [openCart, setOpenCart] = useState(false);

  const add = useCallback((id: BundleId, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      if (i === -1) return [...prev, { id, quantity: qty }];
      const next = [...prev];
      next[i] = { ...next[i], quantity: next[i].quantity + qty };
      return next;
    });
    setOpenCart(true);
  }, []);

  const setQty = useCallback((id: BundleId, qty: number) => {
    if (qty < 1) {
      setLines((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l)),
    );
  }, []);

  const remove = useCallback((id: BundleId) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { itemCount, subtotalCents } = useMemo(() => {
    let count = 0;
    let sub = 0;
    for (const line of lines) {
      const p = getProduct(line.id);
      if (!p) continue;
      count += line.quantity;
      sub += p.priceCents * line.quantity;
    }
    return { itemCount: count, subtotalCents: sub };
  }, [lines]);

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
