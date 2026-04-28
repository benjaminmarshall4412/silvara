import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { envServer } from "@/lib/env.server";
import {
  SILVARA_PROMO_COOKIE_NAME,
  verifyPromoEligibleToken,
} from "@/lib/promo-cookie";

function pctFromPublicEnv(): number {
  const raw = process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "15";
  const n = Number(raw);
  if (!Number.isFinite(n)) return 15;
  if (n <= 0) return 0;
  return Math.min(90, Math.max(1, Math.round(n)));
}

export async function GET() {
  const store = await cookies();
  const token = store.get(SILVARA_PROMO_COOKIE_NAME)?.value;
  const cookieOk = verifyPromoEligibleToken(token);
  const couponReady = !!(envServer.stripeEmailPromoCouponId ?? "").trim();
  const pct = pctFromPublicEnv();

  return NextResponse.json({
    /** Matches what Checkout will honor: signed cookie plus Stripe coupon id on the server */
    discountWillApplyAtCheckout: cookieOk && couponReady,
    claimedOnThisDevice: cookieOk,
    stripeCouponConfigured: couponReady,
    pct,
  });
}
