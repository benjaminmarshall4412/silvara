"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import { formatUsd, getProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    lines,
    openCart,
    setOpenCart,
    subtotalCents,
    setQty,
    remove,
  } = useCart();
  const { state: promo } = usePromoEligibility();

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
          "fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l-4 border-foreground bg-background text-foreground transition-transform duration-200 ease-out",
          openCart ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!openCart}
      >
        <div className="flex items-center justify-between border-b-4 border-foreground px-5 py-4">
          <span className="font-mono-label text-sm font-semibold uppercase tracking-wide">
            Cart
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none border-2 border-foreground text-xs uppercase tracking-wider"
            onClick={() => setOpenCart(false)}
          >
            Close
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="p-5 text-base leading-relaxed text-foreground/85">
              Empty. Add a bundle or rotation from the shop block.
            </p>
          ) : (
            lines.map((line) => {
              const p = getProduct(line.id);
              if (!p) return null;
              return (
                <div
                  key={line.id}
                  className="border-b-2 border-foreground px-5 py-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg font-extrabold uppercase tracking-tight">
                        {p.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {p.isSubscription
                          ? "Subscription · billed per shipment"
                          : p.unitNote}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono-label text-sm font-medium">
                      {formatUsd(p.priceCents * line.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-none border-2 border-foreground"
                      onClick={() => setQty(line.id, line.quantity - 1)}
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
                      className="rounded-none border-2 border-foreground"
                      onClick={() => setQty(line.id, line.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto rounded-none text-xs uppercase text-destructive"
                      onClick={() => remove(line.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t-4 border-foreground p-5">
          {promoDiscountCents > 0 ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground/80">
                  Subtotal
                </span>
                <span className="font-heading text-xl font-extrabold tabular-nums line-through decoration-2 decoration-foreground/40">
                  {formatUsd(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-mono-label text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  First-order · −{pct}%
                </span>
                <span className="font-mono-label text-sm font-semibold tabular-nums text-foreground">
                  −{formatUsd(promoDiscountCents)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t-2 border-foreground pt-3">
                <span className="font-mono-label text-xs font-bold uppercase tracking-widest">
                  Estimated total
                </span>
                <span className="font-heading text-2xl font-extrabold tabular-nums">
                  {formatUsd(estimatedTotalAfterPromo)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground/80">
                Subtotal
              </span>
              <span className="font-heading text-2xl font-extrabold">
                {formatUsd(subtotalCents)}
              </span>
            </div>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Shipping and tax calculated at checkout. Rotation ships on your
            schedule after account setup.
          </p>
          {lines.length === 0 ? (
            <span
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-4 flex h-14 w-full cursor-not-allowed items-center justify-center rounded-none border-2 border-foreground bg-muted text-base font-extrabold uppercase tracking-wide text-muted-foreground opacity-60",
              )}
            >
              Checkout
            </span>
          ) : (
            <Link
              href="/checkout"
              onClick={() => setOpenCart(false)}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-4 flex h-14 w-full cursor-pointer items-center justify-center rounded-none border-2 border-transparent bg-accent text-base font-extrabold uppercase tracking-wide text-accent-foreground hover:bg-accent/90",
              )}
            >
              Checkout
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
