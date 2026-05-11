"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BundleId } from "@/lib/products";
import { PRODUCTS } from "@/lib/products";
import { useSiteRegion } from "@/lib/site-region-context";

type CatalogPricesPayload = {
  prices: Partial<Record<BundleId, number>>;
  currency: string;
};

type CatalogPricesContextValue = {
  /** Minor units per bundle (Stripe `unit_amount`), merged with catalog fallback until loaded. */
  unitAmountCentsByBundle: Record<BundleId, number>;
  /** Uppercase ISO 4217 (e.g. USD, GBP). */
  currency: string;
  /** Stripe fetch finished (success or left fallback on failure). */
  ready: boolean;
};

const StripeCatalogPricesContext = createContext<CatalogPricesContextValue | null>(
  null,
);

function defaultAmounts(): Record<BundleId, number> {
  return Object.fromEntries(PRODUCTS.map((p) => [p.id, p.priceCents])) as Record<
    BundleId,
    number
  >;
}

export function StripeCatalogPricesProvider({ children }: { children: ReactNode }) {
  const region = useSiteRegion();
  const [payload, setPayload] = useState<CatalogPricesPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPayload(null);
    setReady(false);

    void (async () => {
      try {
        const r = await fetch(
          `/api/store-prices?region=${encodeURIComponent(region)}`,
          { credentials: "same-origin" },
        );
        const data = (await r.json()) as Partial<CatalogPricesPayload> & {
          error?: string;
        };
        if (cancelled) return;
        if (r.ok && data.prices && typeof data.currency === "string") {
          setPayload({
            prices: data.prices as Partial<Record<BundleId, number>>,
            currency: data.currency,
          });
        }
      } catch {
        /* keep fallback amounts */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [region]);

  const value = useMemo((): CatalogPricesContextValue => {
    const base = defaultAmounts();
    const merged = { ...base, ...(payload?.prices ?? {}) };
    const currency = (
      payload?.currency ?? (region === "uk" ? "gbp" : "usd")
    ).toUpperCase();
    return {
      unitAmountCentsByBundle: merged,
      currency,
      ready,
    };
  }, [payload, ready, region]);

  return (
    <StripeCatalogPricesContext.Provider value={value}>
      {children}
    </StripeCatalogPricesContext.Provider>
  );
}

export function useStripeCatalogPrices(): CatalogPricesContextValue {
  const ctx = useContext(StripeCatalogPricesContext);
  if (!ctx) {
    throw new Error(
      "useStripeCatalogPrices must be used within StripeCatalogPricesProvider",
    );
  }
  return ctx;
}
