"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  DEFAULT_ODOR_PACK,
  ODOR_PACKS,
  ODOR_PRODUCT,
  isFilled,
  type OdorPackId,
} from "@/lib/odor-product-data";
import { formatMoney, getProduct, SHIPPING_FEE_CENTS } from "@/lib/products";
import {
  SOCK_COLOR_LABEL,
  SOCK_COLORS,
  type SockColor,
} from "@/lib/sock-colors";
import {
  DEFAULT_SOCK_SIZE,
  SOCK_SIZES,
  type SockSize,
} from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

export type OfferPlacement = "hero" | "final" | "sticky";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Resets at local midnight so refresh doesn’t restart the clock. */
function useDealCountdown() {
  const [label, setLabel] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setLabel(`${pad2(h)}:${pad2(m)}:${pad2(s)}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return label;
}

export function OdorDealCountdown({ className }: { className?: string }) {
  const time = useDealCountdown();
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border border-[#b84a2d]/35 bg-[#fff1e8] px-3 py-2.5 text-sm",
        className,
      )}
    >
      <span className="font-bold text-[#8a3a22]">Deal ends in</span>
      <span className="font-extrabold tracking-wide text-[#21130e] tabular-nums">
        {time}
      </span>
    </div>
  );
}

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

export function OdorPackSelector({
  value,
  onChange,
  priceByPack,
}: {
  value: OdorPackId;
  onChange: (pack: OdorPackId) => void;
  priceByPack: Record<OdorPackId, string>;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#5c514a]">Pack</legend>
      <div
        className="mt-2 grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Pack size"
      >
        {ODOR_PACKS.map((pack) => {
          const selected = value === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(pack.id)}
              className={cn(
                "min-h-14 cursor-pointer rounded-none border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84a2d]",
                selected
                  ? "border-[#21130e] bg-[#21130e] text-white"
                  : "border-[#21130e]/20 bg-white text-[#21130e] hover:border-[#21130e]/55",
              )}
            >
              <span className="block text-sm font-extrabold uppercase tracking-wide">
                {pack.label}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-xs font-semibold",
                  selected ? "text-white/70" : "text-[#5c514a]",
                )}
              >
                {priceByPack[pack.id]}
                {pack.freeShipping ? " · free ship" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function OdorSizeSelector({
  value,
  onChange,
}: {
  value: SockSize;
  onChange: (size: SockSize) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#5c514a]">
        Shoe size
      </legend>
      <p className="mt-1 text-xs text-[#5c514a]/80">US men’s shoe size</p>
      <div
        className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7"
        role="radiogroup"
        aria-label="Shoe size"
      >
        {SOCK_SIZES.map((size) => {
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(size)}
              className={cn(
                "min-h-11 cursor-pointer rounded-none border text-sm font-extrabold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84a2d]",
                selected
                  ? "border-[#21130e] bg-[#21130e] text-white"
                  : "border-[#21130e]/20 bg-white text-[#21130e] hover:border-[#21130e]/55",
              )}
            >
              {size}
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
  pack,
  setPack,
  priceLabel,
  sockColor,
  setSockColor,
  sockSize,
  setSockSize,
  placement,
  showTitle = true,
}: {
  id: string;
  pack: OdorPackId;
  setPack: (pack: OdorPackId) => void;
  priceLabel: string;
  sockColor: SockColor;
  setSockColor: (color: SockColor) => void;
  sockSize: SockSize;
  setSockSize: (size: SockSize) => void;
  placement: OfferPlacement;
  showTitle?: boolean;
}) {
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const packMeta =
    ODOR_PACKS.find((p) => p.id === pack) ??
    ODOR_PACKS.find((p) => p.id === DEFAULT_ODOR_PACK)!;
  const catalogCents =
    unitAmountCentsByBundle[packMeta.bundleId] ??
    getProduct(packMeta.bundleId)?.priceCents ??
    packMeta.priceCents;

  const priceByPack: Record<OdorPackId, string> = {
    single: formatMoney(
      unitAmountCentsByBundle.single ??
        getProduct("single")?.priceCents ??
        2000,
      currency,
    ),
    triple: formatMoney(
      unitAmountCentsByBundle.triple ??
        getProduct("triple")?.priceCents ??
        4800,
      currency,
    ),
  };

  const unitLabel = formatMoney(
    Math.round(catalogCents / packMeta.quantity),
    currency,
  );

  const trustLines = [
    packMeta.freeShipping
      ? "Free shipping"
      : `${formatMoney(SHIPPING_FEE_CENTS, currency)} shipping`,
    packMeta.id === "triple" &&
    ODOR_PRODUCT.guaranteeEnabled &&
    isFilled(ODOR_PRODUCT.guaranteeSummary)
      ? ODOR_PRODUCT.guaranteeSummary
      : null,
    isFilled(ODOR_PRODUCT.shippingEstimate)
      ? ODOR_PRODUCT.shippingEstimate
      : null,
    ODOR_PRODUCT.noAccountRequired
      ? "Secure checkout · no account required"
      : "Secure checkout",
  ].filter((line): line is string => Boolean(line));

  const buyLabel =
    packMeta.id === "single"
      ? `Buy 1 pair · ${priceLabel}`
      : `Buy 3 pairs · ${priceLabel}`;

  return (
    <div id={id} className="text-[#21130e]">
      {showTitle ? (
        <>
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight">
            {packMeta.id === "single"
              ? "1 pair of Silvara socks"
              : "3 pairs of Silvara socks"}
          </h2>
          <StarSummary />
        </>
      ) : null}

      <OdorDealCountdown className="mt-3" />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-3xl font-extrabold tabular-nums tracking-tight">
          {priceLabel}
        </p>
        {packMeta.freeShipping ? (
          <span className="rounded-none bg-[#e6f0df] px-3 py-1.5 text-xs font-bold text-[#26451d]">
            Free shipping
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm text-[#5c514a]">
        {packMeta.quantity === 1
          ? "1 pair"
          : `${packMeta.quantity} pairs · ${unitLabel} per pair`}
      </p>

      <div className="mt-5">
        <OdorPackSelector
          value={pack}
          onChange={setPack}
          priceByPack={priceByPack}
        />
      </div>

      <div className="mt-5">
        <OdorColorSelector value={sockColor} onChange={setSockColor} />
      </div>

      <div className="mt-5">
        <OdorSizeSelector value={sockSize} onChange={setSockSize} />
      </div>

      <AddToCartButton
        id={packMeta.bundleId}
        sockSize={sockSize}
        sockColor={sockColor}
        label={buyLabel}
        flow="buy-now"
        onAdd={() => {
          posthog.capture("odor_cta_clicked", {
            placement,
            bundle_id: packMeta.bundleId,
            sock_color: sockColor,
            sock_size: sockSize,
            pack: packMeta.id,
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
