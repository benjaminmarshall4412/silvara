"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/lib/cart-context";
import { SILVARA_MARKETING_EMAIL_LS } from "@/lib/marketing-email-storage";
import { useSiteRegion } from "@/lib/site-region-context";
import { usePathname } from "next/navigation";

const HIDDEN_DEBOUNCE_MS = 20_000;
const LS_LAST_CART_ABANDON = "silvara_last_cart_abandon_at";

/**
 * When the tab hides for a while and the cart still has items, send `silvara.cart_abandoned`
 * (max about once per 24h per device — loose guard).
 */
export function ResendCartAbandonTracker() {
  const { lines } = useCart();
  const region = useSiteRegion();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (document.visibilityState !== "hidden") return;
      if (lines.length === 0) return;

      let email: string | null = null;
      try {
        email = localStorage.getItem(SILVARA_MARKETING_EMAIL_LS);
      } catch {
        return;
      }
      if (!email) return;

      try {
        const last = Number(localStorage.getItem(LS_LAST_CART_ABANDON) ?? "0");
        if (last && Date.now() - last < 24 * 60 * 60 * 1000) return;
      } catch {
        /* ignore */
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void fetch("/api/resend/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "cart_abandoned",
            email,
            region,
            pathname: pathname || "",
          }),
          credentials: "same-origin",
        })
          .then(() => {
            try {
              localStorage.setItem(LS_LAST_CART_ABANDON, String(Date.now()));
            } catch {
              /* ignore */
            }
          })
          .catch(() => {});
      }, HIDDEN_DEBOUNCE_MS);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lines.length, pathname, region]);

  return null;
}
