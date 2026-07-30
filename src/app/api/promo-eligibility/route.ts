import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStripePromoCouponIdForRegion } from "@/lib/env.server";
import {
  SILVARA_PROMO_COOKIE_NAME,
  verifyPromoEligibleToken,
} from "@/lib/promo-cookie";
import { isSiteRegion } from "@/lib/site-region";

function pctFromPublicEnv(): number {
  const raw = process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "0";
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  return Math.min(90, Math.max(1, Math.round(n)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionRaw = searchParams.get("region");
  const region = isSiteRegion(regionRaw) ? regionRaw : null;

  if (!region) {
    return NextResponse.json({ error: "Missing or invalid region" }, { status: 400 });
  }

  const store = await cookies();
  const token = store.get(SILVARA_PROMO_COOKIE_NAME)?.value;
  const cookieOk = verifyPromoEligibleToken(token);
  const couponReady = !!getStripePromoCouponIdForRegion(region);
  const pct = pctFromPublicEnv();

  return NextResponse.json({
    /** Matches what Checkout will honor: signed cookie plus Stripe coupon id on the server */
    discountWillApplyAtCheckout: cookieOk && couponReady,
    claimedOnThisDevice: cookieOk,
    stripeCouponConfigured: couponReady,
    pct,
  });
}
