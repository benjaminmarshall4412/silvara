"use client";

import { useEffect, useRef } from "react";

import { SILVARA_MARKETING_EMAIL_LS } from "@/lib/marketing-email-storage";
import type { SiteRegion } from "@/lib/site-region";
import { usePathname } from "next/navigation";

type Props = {
  region: SiteRegion;
  bundleId: string;
};

/**
 * Fires `silvara.product_viewed` once per tab session per product when the shopper
 * has previously submitted the promo modal (marketing email in localStorage).
 */
export function ResendProductViewTracker({ region, bundleId }: Props) {
  const pathname = usePathname();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    let email: string | null = null;
    try {
      email = localStorage.getItem(SILVARA_MARKETING_EMAIL_LS);
    } catch {
      return;
    }
    if (!email) return;

    const sessionKey = `silvara_pv_${bundleId}`;
    try {
      if (sessionStorage.getItem(sessionKey) === "1") return;
    } catch {
      return;
    }

    fired.current = true;
    void fetch("/api/resend/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "product_viewed",
        email,
        region,
        pathname: pathname || "",
        bundleId,
      }),
      credentials: "same-origin",
    })
      .then(() => {
        try {
          sessionStorage.setItem(sessionKey, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, [bundleId, pathname, region]);

  return null;
}
