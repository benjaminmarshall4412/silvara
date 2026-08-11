"use client";

import posthog from "posthog-js";

import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  ODOR_PRODUCT,
  isFilled,
} from "@/lib/odor-product-data";
import { formatMoney } from "@/lib/products";
import {
  SOCK_COLOR_LABEL,
  SOCK_COLORS,
  type SockColor,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

export type OfferPlacement = "hero" | "final" | "sticky";

export function OdorColorSelector({
  value,
  onChange,
  inverse = false,
}: {
  value: SockColor;
  onChange: (color: SockColor) => void;
  inverse?: boolean;
}) {
  return (
    <fieldset>
      <legend
        className={cn(
          "text-sm font-semibold",
          inverse ? "text-white/70" : "text-[#5c514a]",
        )}
      >
        Color
      </legend>
      <div
        className="mt-2 grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Sock color"
      >
        {SOCK_COLORS.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(color)}
              className={cn(
                "min-h-11 cursor-pointer rounded-none border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84a2d]",
                selected
                  ? inverse
                    ? "border-[#f6efe4] bg-[#f6efe4] text-[#21130e]"
                    : "border-[#21130e] bg-[#21130e] text-white"
                  : inverse
                    ? "border-white/30 bg-white/5 text-white hover:border-white/60"
                    : "border-[#21130e]/20 bg-white text-[#21130e] hover:border-[#21130e]/55",
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "size-3 rounded-full border",
                    color === "black"
                      ? "border-black/40 bg-[#2a2420]"
                      : "border-[#21130e]/30 bg-[#f3eee6]",
                  )}
                />
                {SOCK_COLOR_LABEL[color]}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function StarSummary({ inverse = false }: { inverse?: boolean }) {
  const reviews = ODOR_PRODUCT.reviews;
  if (reviews.length === 0) return null;
  const rated = reviews.filter((r) => typeof r.rating === "number");
  if (rated.length === 0) return null;
  const avg =
    rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
  const rounded = Math.round(avg * 10) / 10;

  return (
    <a
      href="#odor-reviews"
      className="mt-2 inline-flex items-center gap-2 text-sm hover:underline"
    >
      <span
        className="font-semibold text-[#b84a2d]"
        aria-label={`${rounded} out of 5`}
      >
        {"★".repeat(Math.round(avg))}
      </span>
      <span className={inverse ? "text-white/60" : "text-[#5c514a]"}>
        {rounded.toFixed(1)} · {reviews.length}{" "}
        {reviews.length === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}

/** Product-page buy panel: title, price, rating, variant, CTA, trust. */
export function OdorBuyStrip({
  id,
  priceLabel,
  sockColor,
  setSockColor,
  placement,
  showTitle = true,
}: {
  id: string;
  priceLabel: string;
  sockColor: SockColor;
  setSockColor: (color: SockColor) => void;
  placement: OfferPlacement;
  showTitle?: boolean;
}) {
  const { currency } = useStripeCatalogPrices();
  const unitLabel = formatMoney(ODOR_PRODUCT.unitPriceCents, currency);

  const trustLines = [
    isFilled(ODOR_PRODUCT.shoeSizeRange) ? ODOR_PRODUCT.shoeSizeRange : null,
    ODOR_PRODUCT.guaranteeEnabled && isFilled(ODOR_PRODUCT.guaranteeSummary)
      ? ODOR_PRODUCT.guaranteeSummary
      : null,
    isFilled(ODOR_PRODUCT.shippingEstimate)
      ? ODOR_PRODUCT.shippingEstimate
      : null,
    ODOR_PRODUCT.noAccountRequired
      ? "Secure checkout · no account required"
      : "Secure checkout",
  ].filter((line): line is string => Boolean(line));

  return (
    <div id={id} className="text-[#21130e]">
      {showTitle ? (
        <>
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight">
            3 pairs of Silvara socks
          </h2>
          <StarSummary />
        </>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-3xl font-extrabold tabular-nums tracking-tight">
          {priceLabel}
        </p>
        {ODOR_PRODUCT.freeShippingOnThisOffer ? (
          <span className="rounded-none bg-[#e6f0df] px-3 py-1.5 text-xs font-bold text-[#26451d]">
            Free shipping
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm text-[#5c514a]">
        {ODOR_PRODUCT.quantity} pairs · {unitLabel} per pair
      </p>

      <div className="mt-5">
        <OdorColorSelector value={sockColor} onChange={setSockColor} />
      </div>

      {/* Analytics: odor_cta_clicked + buy-now InitiateCheckout (Meta).
          Checkout page skips a duplicate InitiateCheckout after buy-now. */}
      <AddToCartButton
        id={ODOR_PRODUCT.bundleId}
        sockSize={DEFAULT_SOCK_SIZE}
        sockColor={sockColor}
        label={`Buy 3 pairs · ${priceLabel}`}
        flow="buy-now"
        onAdd={() => {
          posthog.capture("odor_cta_clicked", {
            placement,
            bundle_id: ODOR_PRODUCT.bundleId,
            sock_color: sockColor,
          });
        }}
        className="!mt-5 !h-14 !border-0 !bg-[#b84a2d] !text-sm !font-extrabold !text-white !shadow-none rounded-none hover:!bg-[#a23e25]"
      />

      <ul className="mt-4 space-y-2 border-t border-[#21130e]/10 pt-4 text-sm leading-snug text-[#5c514a]">
        {trustLines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#b84a2d]"
            />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Closing purchase block — same controls on a raised card. */
export function OdorOfferCard({
  id,
  priceLabel,
  sockColor,
  setSockColor,
  placement,
}: {
  id: string;
  priceLabel: string;
  sockColor: SockColor;
  setSockColor: (color: SockColor) => void;
  placement: OfferPlacement;
}) {
  return (
    <div
      id={id}
      className="rounded-none bg-[#fffaf2] p-5 text-[#21130e] sm:p-6"
    >
      <OdorBuyStrip
        id={`${id}-strip`}
        priceLabel={priceLabel}
        sockColor={sockColor}
        setSockColor={setSockColor}
        placement={placement}
      />
    </div>
  );
}
