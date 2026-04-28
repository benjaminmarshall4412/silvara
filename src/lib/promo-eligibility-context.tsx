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

export type PromoEligibilityState = {
  discountWillApplyAtCheckout: boolean;
  claimedOnThisDevice: boolean;
  stripeCouponConfigured: boolean;
  pct: number;
};

type Ctx = {
  /** `null` until first fetch completes */
  state: PromoEligibilityState | null;
  refetch: () => Promise<void>;
};

const PromoEligibilityContext = createContext<Ctx | null>(null);

export function PromoEligibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PromoEligibilityState | null>(null);

  const refetch = useCallback(async () => {
    const r = await fetch("/api/promo-eligibility", { credentials: "same-origin" });
    const d = (await r.json()) as Partial<PromoEligibilityState>;
    const pctRaw = d.pct;
    const pct =
      typeof pctRaw === "number" && Number.isFinite(pctRaw) ? Math.round(pctRaw) : 15;

    setState({
      discountWillApplyAtCheckout: !!d.discountWillApplyAtCheckout,
      claimedOnThisDevice: !!d.claimedOnThisDevice,
      stripeCouponConfigured: !!d.stripeCouponConfigured,
      pct: Math.min(90, Math.max(0, pct)),
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch]);

  const value = useMemo(() => ({ state, refetch }), [state, refetch]);

  return (
    <PromoEligibilityContext.Provider value={value}>
      {children}
    </PromoEligibilityContext.Provider>
  );
}

export function usePromoEligibility() {
  const ctx = useContext(PromoEligibilityContext);
  if (!ctx) {
    throw new Error("usePromoEligibility must be used within PromoEligibilityProvider");
  }
  return ctx;
}
