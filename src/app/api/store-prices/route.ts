import { NextResponse } from "next/server";

import { getStripePriceIdsForRegion } from "@/lib/env.server";
import type { BundleId } from "@/lib/products";
import { validateSiteRegionParam } from "@/lib/site-region";
import { getStripeForRegion } from "@/lib/stripe/server";

const BUNDLE_IDS = ["single", "triple", "six", "rotation"] as const satisfies readonly BundleId[];

/**
 * Returns Stripe Price `unit_amount` (minor units) per bundle for the regional account.
 * Used so the storefront display matches what Checkout charges.
 */
export async function GET(request: Request) {
  const regionParam = new URL(request.url).searchParams.get("region");
  const region = validateSiteRegionParam(regionParam ?? "");
  if (!region) {
    return NextResponse.json({ error: "Missing or invalid region" }, { status: 400 });
  }

  try {
    const stripe = getStripeForRegion(region);
    const priceIds = getStripePriceIdsForRegion(region);
    const prices: Partial<Record<BundleId, number>> = {};
    let currency = "usd";

    for (const bundleId of BUNDLE_IDS) {
      const priceId = priceIds[bundleId];
      const price = await stripe.prices.retrieve(priceId);
      if (price.unit_amount == null) {
        return NextResponse.json(
          { error: `Stripe price ${priceId} has no fixed unit_amount` },
          { status: 500 },
        );
      }
      prices[bundleId] = price.unit_amount;
      currency = price.currency;
    }

    return NextResponse.json({ prices, currency });
  } catch (error) {
    console.error("[store-prices] failed", error);
    return NextResponse.json({ error: "Unable to load prices" }, { status: 500 });
  }
}
