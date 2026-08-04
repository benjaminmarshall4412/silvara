"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import {
  FREE_SHIPPING_MIN_PAIRS,
  SHIPPING_FEE_CENTS,
  countPairs,
  formatMoney,
  getProduct,
} from "@/lib/products";
import { FIT_NOTE, RETURNS_PROMISE } from "@/lib/store-promises";
import { SOCK_COLOR_LABEL } from "@/lib/sock-colors";
import { cartLineKey } from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const region = useSiteRegion();
  const checkoutHref = withSiteRegion(region, "/checkout");
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();

  const {
    lines,
    openCart,
    setOpenCart,
    subtotalCents,
    setQty,
    remove,
  } = useCart();
  const { state: promo } = usePromoEligibility();

  const cartViewLoggedForOpen = useRef(false);
  useEffect(() => {
    if (!openCart) {
      cartViewLoggedForOpen.current = false;
      return;
    }
    if (cartViewLoggedForOpen.current) return;
    cartViewLoggedForOpen.current = true;
    posthog.capture("cart_viewed", {
      line_count: lines.length,
      subtotal_cents: subtotalCents,
      currency,
      region,
    });
  }, [openCart, lines.length, subtotalCents, currency, region]);

  const pairs = countPairs(lines);
  const freeShipping = pairs >= FREE_SHIPPING_MIN_PAIRS;

  const eligiblePromo =
    !!(promo && promo.pct > 0 && promo.claimedOnThisDevice);
  const pct = promo?.pct ?? 0;
  const promoDiscountCents =
    eligiblePromo && pct > 0 && lines.length > 0
      ? Math.round(subtotalCents * (pct / 100))
      : 0;
  const estimatedTotalAfterPromo = Math.max(0, subtotalCents - promoDiscountCents);

  return (
    <>
      <button
        type="button"
        aria-hidden={!openCart}
        className={cn(
          "fixed inset-0 z-40 bg-surface-inverse/80 transition-opacity",
          openCart ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpenCart(false)}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-background text-foreground shadow-[0_0_80px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out",
          openCart ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!openCart}
      >
        <div className="border-border/25 flex items-center justify-between border-b px-5 py-4">
          <span className="font-mono-label text-sm font-semibold uppercase tracking-wide">
            Your cart
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none text-xs uppercase tracking-wider"
            onClick={() => setOpenCart(false)}
          >
            Close
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="p-5 text-base leading-relaxed text-foreground/85">
              Your cart is empty.
            </p>
          ) : (
            lines.map((line) => {
              const p = getProduct(line.id);
              if (!p) return null;
              const lk = cartLineKey(line);
              const unit = unitAmountCentsByBundle[line.id] ?? p.priceCents;
              return (
                <div
                  key={lk}
                  className="border-border/20 border-b px-5 py-4 last:border-b-0"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg font-extrabold uppercase tracking-tight">
                        {p.name}
                      </p>
                      <p className="mt-1 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                        {SOCK_COLOR_LABEL[line.sockColor]} · one size
                      </p>
                      {p.isSubscription ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Subscription · billed per shipment
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-mono-label text-sm font-medium">
                      {formatMoney(unit * line.quantity, currency)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-border/40 rounded-none border"
                      onClick={() => {
                        setQty(lk, line.quantity - 1);
                        posthog.capture("cart_item_quantity_changed", {
                          bundle_id: line.id,
                          sock_size: line.sockSize,
                          sock_color: line.sockColor,
                          new_quantity: line.quantity - 1,
                          direction: "decrease",
                        });
                      }}
                      aria-label="Decrease quantity"
                    >
                      −
                    </Button>
                    <span className="min-w-8 text-center font-mono-label text-sm">
                      {line.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-border/40 rounded-none border"
                      onClick={() => {
                        setQty(lk, line.quantity + 1);
                        posthog.capture("cart_item_quantity_changed", {
                          bundle_id: line.id,
                          sock_size: line.sockSize,
                          sock_color: line.sockColor,
                          new_quantity: line.quantity + 1,
                          direction: "increase",
                        });
                      }}
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto rounded-none text-xs uppercase text-destructive"
                      onClick={() => {
                        remove(lk);
                        posthog.capture("cart_item_removed", {
                          bundle_id: line.id,
                          sock_size: line.sockSize,
                          sock_color: line.sockColor,
                          quantity: line.quantity,
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-border/25 border-t p-5">
          {promoDiscountCents > 0 ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground/80">
                  Subtotal
                </span>
                <span className="font-heading text-xl font-extrabold tabular-nums line-through decoration-2 decoration-foreground/40">
                  {formatMoney(subtotalCents, currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-mono-label text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  First-order · −{pct}%
                </span>
                <span className="font-mono-label text-sm font-semibold tabular-nums text-foreground">
                  −{formatMoney(promoDiscountCents, currency)}
                </span>
              </div>
              <div className="border-border/30 flex items-baseline justify-between gap-4 border-t pt-3">
                <span className="font-mono-label text-xs font-bold uppercase tracking-widest">
                  Estimated total
                </span>
                <span className="font-heading text-2xl font-extrabold tabular-nums">
                  {formatMoney(estimatedTotalAfterPromo, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground/80">
                Subtotal
              </span>
              <span className="font-heading text-2xl font-extrabold">
                {formatMoney(subtotalCents, currency)}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {lines.length === 0
                ? "—"
                : freeShipping
                  ? "Free"
                  : `${formatMoney(SHIPPING_FEE_CENTS, currency)} standard`}
            </span>
          </div>
          {!freeShipping && lines.length > 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Add {FREE_SHIPPING_MIN_PAIRS - pairs} more{" "}
              {FREE_SHIPPING_MIN_PAIRS - pairs === 1 ? "pair" : "pairs"} for free
              shipping.
            </p>
          ) : null}
          {lines.length === 0 ? (
            <span
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-4 flex h-14 w-full cursor-not-allowed items-center justify-center rounded-none border-0 bg-muted text-base font-extrabold uppercase tracking-wide text-muted-foreground opacity-60",
              )}
            >
              Checkout
            </span>
          ) : (
            <Link
              href={checkoutHref}
              onClick={() => {
                setOpenCart(false);
                posthog.capture("checkout_started", {
                  line_count: lines.length,
                  subtotal_cents: subtotalCents,
                  currency,
                  has_promo: eligiblePromo,
                });
              }}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-4 flex h-14 w-full cursor-pointer items-center justify-center rounded-none border-0 bg-accent text-base font-extrabold uppercase tracking-wide text-accent-foreground hover:bg-accent/90",
              )}
            >
              Checkout
            </Link>
          )}
          {[RETURNS_PROMISE, FIT_NOTE].filter(Boolean).length > 0 ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {[RETURNS_PROMISE, FIT_NOTE].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
