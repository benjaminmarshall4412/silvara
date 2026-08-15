"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { GiftProductGallery } from "@/components/gift/gift-product-gallery";
import { SiteFooter } from "@/components/sections/site-footer";
import type { GiftAngle } from "@/lib/gift-angles";
import { GIFT_ANGLES } from "@/lib/gift-angles";
import { formatMoney, getProduct } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  SOCK_COLOR_LABEL,
  SOCK_COLORS,
  type SockColor,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE, SOCK_SIZES, type SockSize } from "@/lib/sock-sizes";
import { trackMetaEvent } from "@/lib/meta/track-client";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Is this only for construction?",
    a: "No. Built for hard environments like work boots—also fine for warehouse, kitchen, retail, travel, or daily wear.",
  },
  {
    q: "Are these thick work socks?",
    a: "No. Thin low-calf—more room in the shoe or boot.",
  },
  {
    q: "Does it stop all foot odor?",
    a: "No sock can guarantee that. SILVARA helps manage odor in the fabric through silver-infused yarn—not perfume.",
  },
  {
    q: "How should they be washed?",
    a: "Machine wash cold. Tumble dry low. Do not bleach.",
  },
] as const;

function ColorPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: SockColor;
  onChange: (c: SockColor) => void;
}) {
  return (
    <div>
      <p
        id={`${id}-color-label`}
        className="font-mono-label text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        Color
      </p>
      <div
        className="mt-2 flex gap-2"
        role="group"
        aria-labelledby={`${id}-color-label`}
      >
        {SOCK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "flex-1 cursor-pointer border-2 px-3 py-2.5 font-mono-label text-xs font-bold uppercase tracking-wide transition-colors",
              value === c
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/25 bg-background text-foreground hover:border-foreground",
            )}
          >
            {SOCK_COLOR_LABEL[c]}
          </button>
        ))}
      </div>
    </div>
  );
}

function GiftPurchaseBlock({
  id,
  sockColor,
  setSockColor,
  sockSize,
  setSockSize,
  priceLabel,
  ctaLabel,
}: {
  id: string;
  sockColor: SockColor;
  setSockColor: (c: SockColor) => void;
  sockSize: SockSize;
  setSockSize: (s: SockSize) => void;
  priceLabel: string;
  ctaLabel: string;
}) {
  return (
    <div id={id} className="space-y-5">
      <div>
        <p className="font-heading text-4xl font-extrabold tabular-nums tracking-tight md:text-5xl">
          {priceLabel}
        </p>
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          Free shipping · 3 pairs
        </p>
      </div>

      <ColorPicker id={id} value={sockColor} onChange={setSockColor} />

      <div>
        <p className="font-mono-label text-xs font-bold uppercase tracking-wide text-foreground">
          Shoe size
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {SOCK_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSockSize(size)}
              className={
                sockSize === size
                  ? "min-h-10 border-2 border-foreground bg-foreground font-mono text-sm font-bold text-background"
                  : "min-h-10 border-2 border-foreground/25 bg-background font-mono text-sm font-bold text-foreground hover:border-foreground"
              }
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <AddToCartButton
        id="triple"
        sockSize={sockSize}
        sockColor={sockColor}
        label={ctaLabel}
        className="!h-14 !text-sm md:!h-16 md:!text-base"
      />
      <p className="font-mono-label text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
        Most people choose black
      </p>
    </div>
  );
}

export function GiftLanding({ angle }: { angle: GiftAngle }) {
  const region = useSiteRegion();
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const hero = GIFT_ANGLES[angle];
  const triple = getProduct("triple");
  const six = getProduct("six");
  const single = getProduct("single");
  const tripleCents =
    unitAmountCentsByBundle.triple ?? triple?.priceCents ?? 4800;
  const sixCents = unitAmountCentsByBundle.six ?? six?.priceCents ?? 7200;
  const singleCents =
    unitAmountCentsByBundle.single ?? single?.priceCents ?? 2000;
  const priceLabel = formatMoney(tripleCents, currency);

  const [sockColor, setSockColor] = useState<SockColor>(DEFAULT_SOCK_COLOR);
  const [sockSize, setSockSize] = useState<SockSize>(DEFAULT_SOCK_SIZE);
  const [stickyVisible, setStickyVisible] = useState(false);
  const firstCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    posthog.capture("gift_landing_viewed", {
      angle,
      region,
      bundle_id: "triple",
    });
    void trackMetaEvent({
      eventName: "ViewContent",
      customData: {
        content_ids: ["triple"],
        content_type: "product",
        content_name: "SILVARA 3-Pair Gift Set",
        value: tripleCents / 100,
        currency: currency.toUpperCase(),
      },
    });
  }, [angle, region, tripleCents, currency]);

  useEffect(() => {
    const el = firstCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-48px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="mx-auto grid max-w-[1120px] gap-8 px-4 py-8 md:grid-cols-2 md:items-start md:gap-12 md:px-6 md:py-14 lg:gap-16">
        <div className="order-2 space-y-6 md:order-1 md:sticky md:top-24 md:self-start">
          <div>
            <p className="font-heading text-3xl font-extrabold uppercase tracking-tighter text-foreground sm:text-4xl">
              SILVARA
            </p>
            <p className="font-mono-label mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {hero.eyebrow}
            </p>
            <h1 className="font-heading mt-3 text-pretty text-3xl font-extrabold uppercase leading-[0.98] tracking-tight md:text-4xl lg:text-[2.75rem]">
              {hero.headline}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/75 md:text-lg">
              {hero.subheadline}
            </p>
          </div>

          <div className="hidden max-w-md md:block">
            <GiftPurchaseBlock
              id="gift-purchase-hero"
              sockColor={sockColor}
              setSockColor={setSockColor}
              sockSize={sockSize}
              setSockSize={setSockSize}
              priceLabel={priceLabel}
              ctaLabel="Add the 3-pack"
            />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <GiftProductGallery sockColor={sockColor} priority />
        </div>

        <div className="order-3 max-w-md md:hidden">
          <GiftPurchaseBlock
            id="gift-purchase-mobile"
            sockColor={sockColor}
            setSockColor={setSockColor}
            sockSize={sockSize}
            setSockSize={setSockSize}
            priceLabel={priceLabel}
            ctaLabel="Add the 3-pack"
          />
        </div>
        <div
          ref={firstCtaRef}
          className="order-4 col-span-full h-px"
          aria-hidden
        />
      </section>

      {/* Proof strip */}
      <section className="border-y-4 border-foreground bg-muted/50">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-10 md:grid-cols-3 md:gap-10 md:px-6 md:py-12">
          {[
            ["He’ll use them", "Already in the boot-and-laundry routine."],
            ["Thin low-calf fit", "Room in the toe box—not a thick work sock."],
            ["Silver in the yarn", "Helps manage odor in the fabric."],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-heading text-sm font-extrabold uppercase tracking-tight">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-[1120px] px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-end md:gap-16">
          <div className="max-w-lg">
            <p className="font-mono-label text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Why it works
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
              Wet isn’t smell—bacteria is.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/75 md:text-lg">
              Heat and hours in work boots leave odor in the sock. Sprays
              treat the shoe. SILVARA changes the layer on his foot.
            </p>
          </div>
          <div className="space-y-5">
            <div className="border-l-4 border-foreground/20 pl-4">
              <p className="font-mono-label text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Typical sock
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                Standard yarn. Holds moisture and odor after long wear.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <p className="font-mono-label text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                SILVARA
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                Silver-infused yarn. Thin low-calf for boots and everyday wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What arrives + CTA */}
      <section className="border-y-4 border-foreground bg-surface-inverse text-background">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-6 md:py-20">
          <div>
            <p className="font-mono-label text-xs font-semibold uppercase tracking-[0.22em] text-background/55">
              In the box
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
              Three pairs. One color. Free shipping.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-background/75">
              Matching thin low-calf socks in black or white. Same sock as the
              main line—gift-ready as a workweek set.
            </p>
          </div>
          <div className="max-w-md rounded-none border-2 border-background/30 bg-background p-5 text-foreground md:p-6">
            <GiftPurchaseBlock
              id="gift-purchase-mid"
              sockColor={sockColor}
              setSockColor={setSockColor}
              sockSize={sockSize}
              setSockSize={setSockSize}
              priceLabel={priceLabel}
              ctaLabel="Add the 3-pack"
            />
          </div>
        </div>
      </section>

      {/* Specs + FAQ */}
      <section className="mx-auto max-w-[1120px] px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight md:text-2xl">
              Specs
            </h2>
            <dl className="mt-6 space-y-0 border-t-2 border-foreground">
              {[
                ["Contents", "3 pairs"],
                ["Height", "Low calf"],
                ["Colors", "Black or white"],
                ["Fit", "Pick shoe size"],
                ["Yarn", "Silver-infused blend"],
                ["Shipping", "Free on this set"],
                ["Care", "Wash like any other sock"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b-2 border-foreground py-3.5 text-sm"
                >
                  <dt className="font-mono-label text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-right text-foreground/85">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight md:text-2xl">
              Questions
            </h2>
            <div className="mt-4 divide-y-2 divide-foreground/15 border-t-2 border-foreground">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-heading text-sm font-extrabold uppercase tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <span className="text-muted-foreground group-open:hidden">
                        +
                      </span>
                      <span className="hidden text-muted-foreground group-open:inline">
                        −
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 pr-6 text-sm leading-relaxed text-foreground/70">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Secondary options — quiet */}
      <section className="border-t-4 border-foreground bg-muted/40">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-sm text-foreground/65">
            Not gifting?{" "}
            <Link
              href={withSiteRegion(region, "/#shop")}
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
            >
              See all packs
            </Link>
            {single ? (
              <>
                {" "}
                · try one pair for {formatMoney(singleCents, currency)}
                <span className="text-muted-foreground"> (+$5.95 ship)</span>
              </>
            ) : null}
            {six ? (
              <>
                {" "}
                · 6-pack {formatMoney(sixCents, currency)}
              </>
            ) : null}
          </p>
        </div>
      </section>

      <SiteFooter region={region} />

      {/* Mobile sticky CTA */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t-4 border-foreground bg-background/95 p-3 backdrop-blur-sm transition-transform duration-300 md:hidden",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-extrabold tabular-nums">
              {priceLabel}
              <span className="ml-2 font-mono-label text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Free ship
              </span>
            </p>
            <p className="truncate font-mono-label text-[0.6rem] uppercase text-muted-foreground">
              3-pack · {SOCK_COLOR_LABEL[sockColor]}
            </p>
          </div>
          <a
            href="#gift-purchase-mobile"
            className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center bg-accent px-5 font-heading text-xs font-extrabold uppercase tracking-wide text-accent-foreground"
            onClick={() => {
              posthog.capture("gift_sticky_cta_clicked", { angle, region });
            }}
          >
            Add to cart
          </a>
        </div>
      </div>
    </div>
  );
}
