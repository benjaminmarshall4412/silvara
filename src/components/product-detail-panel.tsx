"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import type { BundleId } from "@/lib/products";
import {
  applyPromoToCents,
  formatMoney,
  getProduct,
} from "@/lib/products";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { withSiteRegion } from "@/lib/site-region";
import { useSiteRegion } from "@/lib/site-region-context";
import {
  DEFAULT_SOCK_COLOR,
  SOCK_COLOR_LABEL,
  SOCK_COLORS,
  type SockColor,
} from "@/lib/sock-colors";
import {
  DEFAULT_SOCK_SIZE,
  SOCK_SIZE_DESCRIPTION,
  SOCK_SIZES,
} from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";

export function ProductDetailPanel({ bundleId }: { bundleId: BundleId }) {
  const region = useSiteRegion();
  const shop = withSiteRegion(region, "/#loadouts");
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const { state: promo } = usePromoEligibility();
  const [sockSize, setSockSize] = useState<SockSize>(DEFAULT_SOCK_SIZE);
  const [sockColor, setSockColor] = useState<SockColor>(DEFAULT_SOCK_COLOR);
  const p = getProduct(bundleId);

  useEffect(() => {
    if (!p) return;
    posthog.capture("product_viewed", {
      bundle_id: bundleId,
      product_name: p.name,
      is_subscription: p.isSubscription,
      region,
    });
  }, [bundleId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;

  const cents = unitAmountCentsByBundle[bundleId] ?? p.priceCents;
  const showDiscount =
    !!promo && promo.claimedOnThisDevice && promo.pct > 0;
  const pct = promo?.pct ?? 15;
  const after = applyPromoToCents(cents, pct);

  return (
    <div className="space-y-6">
      <div>
        {p.badge ? (
          <span className="font-mono-label text-xs font-bold uppercase tracking-widest text-accent">
            {p.badge}
          </span>
        ) : null}
        <h1 className="font-heading mt-2 text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
          {p.name}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {p.description}
        </p>
      </div>

      <div className="border-4 border-foreground bg-muted px-5 py-5 md:px-6">
        {showDiscount ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-heading text-3xl font-extrabold tabular-nums line-through decoration-2 text-muted-foreground md:text-4xl">
              {formatMoney(cents, currency)}
            </span>
            <span className="font-heading text-3xl font-extrabold tabular-nums md:text-4xl">
              {formatMoney(after, currency)}
            </span>
            <span className="font-mono-label rounded-sm border border-foreground px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide">
              −{pct}%
            </span>
          </div>
        ) : (
          <p className="font-heading text-3xl font-extrabold tabular-nums md:text-4xl">
            {formatMoney(cents, currency)}
          </p>
        )}
        <p className="mt-2 font-mono-label text-xs uppercase tracking-wide text-muted-foreground">
          {p.unitNote}
          {p.isSubscription ? " · Billed per shipment in checkout." : null}
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor={`sock-color-${bundleId}`}
              className="inline-block cursor-pointer font-mono-label text-xs font-bold uppercase tracking-wide text-foreground"
            >
              Color
            </label>
            <select
              id={`sock-color-${bundleId}`}
              value={sockColor}
              onChange={(e) => setSockColor(e.target.value as SockColor)}
              className="border-border mt-2 w-full max-w-md cursor-pointer border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SOCK_COLORS.map((c) => (
                <option key={c} value={c}>
                  {SOCK_COLOR_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`sock-size-${bundleId}`}
              className="inline-block cursor-pointer font-mono-label text-xs font-bold uppercase tracking-wide text-foreground"
            >
              Sock size (crew)
            </label>
            <select
              id={`sock-size-${bundleId}`}
              value={sockSize}
              onChange={(e) => setSockSize(e.target.value as SockSize)}
              className="border-border mt-2 w-full max-w-md cursor-pointer border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SOCK_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} — {SOCK_SIZE_DESCRIPTION[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6">
          <AddToCartButton
            id={bundleId}
            sockSize={sockSize}
            sockColor={sockColor}
            label={p.isSubscription ? "Start rotation" : "Add to cart"}
            className="!h-14 !text-base md:!h-16"
          />
        </div>
      </div>

      <Link
        href={shop}
        className="inline-block font-mono-label text-xs uppercase tracking-widest text-foreground underline underline-offset-4 hover:text-accent"
      >
        ← Back to all loadouts
      </Link>
    </div>
  );
}
