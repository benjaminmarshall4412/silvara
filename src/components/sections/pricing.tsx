"use client";

import Image from "next/image";
import Link from "next/link";

import { HeroTypewriter } from "@/components/hero-typewriter";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import type { BundleId, Product } from "@/lib/products";
import {
  PRODUCTS,
  applyPromoToCents,
  formatMoney,
} from "@/lib/products";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { withSiteRegion } from "@/lib/site-region";
import { useSiteRegion } from "@/lib/site-region-context";
import { cn } from "@/lib/utils";

type OneTimeBundleProduct = Product & { id: Exclude<BundleId, "rotation"> };

const bundles = PRODUCTS.filter(
  (p): p is OneTimeBundleProduct => !p.isSubscription,
);
const rotation = PRODUCTS.find((p) => p.isSubscription)!;

const bundleProductImage: Record<Exclude<BundleId, "rotation">, string> = {
  single: "/frontpage-single.png",
  triple: "/frontpage-triple.png",
  six: "/frontpage-six.png",
};

const chips = [
  "Thin crew · silver yarn",
  "Boot shifts",
  "Bacteria on fiber",
  "1 · 3 · 6 · sub",
];

/** Bump this when you replace the hero image in `public/` so browsers/CDNs fetch the new file. */
const HERO_IMAGE_VERSION = 5;

const heroSrc = `/header.png?v=${HERO_IMAGE_VERSION}`;

function BundlePriceRow({
  priceCents,
  featured,
  pct,
  showDiscount,
  currency,
}: {
  priceCents: number;
  featured: boolean;
  pct: number;
  showDiscount: boolean;
  currency: string;
}) {
  const after = applyPromoToCents(priceCents, pct);
  const inv = featured;
  const strike = inv ? "text-background/50" : "text-muted-foreground";
  const main = inv ? "text-background" : "text-foreground";
  const chip = inv
    ? "border-background/45 text-background"
    : "border-foreground text-foreground";

  const priceClass = cn(
    "font-heading font-extrabold tabular-nums tracking-tight",
    "text-[clamp(1.35rem,2.8vw+0.4rem,2.75rem)] md:text-[clamp(1.5rem,2.2vw+0.75rem,3.25rem)]",
    "min-w-0 max-w-full shrink leading-none",
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-2">
      {showDiscount ? (
        <>
          <span className={cn(priceClass, "line-through decoration-2", strike)}>
            {formatMoney(priceCents, currency)}
          </span>
          <span className={cn(priceClass, main)}>{formatMoney(after, currency)}</span>
          <span
            className={cn(
              "font-mono-label shrink-0 rounded-sm border px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
              chip,
            )}
          >
            −{pct}%
          </span>
        </>
      ) : (
        <p className={cn(priceClass, main)}>{formatMoney(priceCents, currency)}</p>
      )}
    </div>
  );
}

function BundleUnitNote({
  p,
  priceCents,
  currency,
  showDiscount,
  pct,
  featured,
}: {
  p: OneTimeBundleProduct;
  priceCents: number;
  currency: string;
  showDiscount: boolean;
  pct: number;
  featured: boolean;
}) {
  const base = cn(
    "mt-2 text-sm leading-snug md:text-base",
    featured ? "text-background/90" : "text-muted-foreground",
  );
  if (p.id === "single") {
    return <p className={base}>{p.unitNote}</p>;
  }
  if (p.id === "triple") {
    return (
      <p className={base}>
        Save $6 and get free shipping vs 3 singles.
      </p>
    );
  }
  const pairs = 6;
  const bundleTotal =
    showDiscount && pct > 0 ? applyPromoToCents(priceCents, pct) : priceCents;
  const per = Math.round(bundleTotal / pairs);
  return (
    <p className={base}>
      {formatMoney(per, currency)} / pair — best per-shift cost.
    </p>
  );
}

export function Pricing() {
  const region = useSiteRegion();
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const { state: promoState } = usePromoEligibility();
  const showDiscount =
    !!promoState && promoState.claimedOnThisDevice && promoState.pct > 0;
  const pct = promoState?.pct ?? 15;
  const rotationCents = unitAmountCentsByBundle[rotation.id];

  return (
    <section
      id="loadouts"
      className="scroll-mt-24 border-b-4 border-foreground bg-background px-0 pb-10 pt-0 md:pb-14"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed hero — public/header.png */}
      <div className="relative w-full border-b-4 border-foreground">
        <div className="relative min-h-[min(72vh,820px)] w-full md:min-h-[min(78vh,900px)]">
          <Image
            src={heroSrc}
            alt="Worker in boots — SILVARA silver-infused thin crew work socks for long shifts"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="border-0 object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-black/45 md:bg-black/40"
            aria-hidden
          />
          <div className="absolute inset-0 flex min-w-0 flex-col justify-end px-5 pb-12 pt-28 md:px-10 md:pb-16 md:pt-32 lg:px-14 lg:pb-20">
            {/* Flow column: eyebrow + white title only — height stable so the line does not jump when the typewriter wraps. */}
            <div className="relative z-10 w-full min-w-0 max-w-[min(100%,36rem)] shrink-0 pb-[min(24vh,9rem)] sm:max-w-[42rem] sm:pb-[min(36vh,13rem)] lg:max-w-[48rem] lg:pb-[min(38vh,14rem)]">
              <p className="font-mono-label text-on-hero-eyebrow text-xs font-bold uppercase tracking-[0.2em] md:text-sm">
                Thin silver crew socks
              </p>
              <h1
                id="hero-heading"
                className="font-heading mt-3 w-full text-pretty text-3xl font-extrabold uppercase leading-[0.98] tracking-tighter sm:tracking-tight sm:mt-4 sm:text-5xl md:text-6xl lg:text-7xl"
              >
                <span className="block text-background">Thin crew for work boots.</span>
                <span className="sr-only">
                  Silver yarn, not perfume: targets bacteria on the fiber, not a scent mask.
                </span>
              </h1>
            </div>
            {/* Typewriter + subcopy: out of document flow below the title so longer lines do not push the white headline up. */}
            <div className="pointer-events-none absolute inset-x-5 bottom-12 z-10 flex max-h-[min(24vh,9rem)] w-full min-w-0 flex-col justify-end gap-3 overflow-hidden sm:max-h-[min(36vh,13rem)] md:inset-x-10 md:bottom-16 lg:max-h-[min(38vh,14rem)] lg:inset-x-14 lg:bottom-20">
              <div className="w-full min-w-0 max-w-[min(100%,36rem)] font-heading text-3xl font-extrabold uppercase leading-[0.98] tracking-tighter sm:max-w-[42rem] sm:text-5xl md:text-6xl lg:max-w-[48rem] lg:text-7xl">
                <HeroTypewriter className="text-on-hero-accent" />
              </div>
              <p className="max-w-md text-base font-medium leading-snug text-background/88 md:text-lg">
                Black or white marl · 1, 3, 6 pairs, or 3/month subscribed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop block */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between md:gap-8 md:py-8">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            {chips.map((c) => (
              <span
                key={c}
                className="border-2 border-foreground bg-muted px-3 py-1.5 font-mono-label text-xs font-semibold uppercase tracking-wide text-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            <a
              href="#system"
              className="font-mono-label text-sm font-semibold uppercase tracking-wide text-accent underline decoration-2 underline-offset-4 hover:text-foreground"
            >
              Sock story →
            </a>
            <a
              href="#rotation"
              className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground underline decoration-2 underline-offset-4 hover:text-accent"
            >
              Fresh rotation →
            </a>
          </div>
        </div>

        <div className="border-t-4 border-foreground pt-6 md:pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-center lg:text-left">
              <p className="font-mono-label text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Shop
              </p>
              <h2
                id="pricing-heading"
                className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl"
              >
                Packs & subscription
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-foreground/85 md:mx-0 md:text-lg">
                Same thin crew sock—1, 3, or 6 pairs—or 3 pairs/month subscribed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-3 md:gap-6 lg:gap-8 xl:gap-10">
          {bundles.map((p) => {
            const displayCents = unitAmountCentsByBundle[p.id];
            return (
            <Link
              key={p.id}
              href={withSiteRegion(region, `/product/${p.id}`)}
              aria-label={`SILVARA ${p.name} — view product details and add to cart`}
              className={cn(
                "group flex min-h-0 min-w-0 flex-col overflow-hidden border-4 border-foreground bg-background text-left no-underline outline-none transition-[transform,box-shadow] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !p.featured &&
                  "hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0] hover:shadow-foreground/15",
                p.featured &&
                  "bg-surface-inverse text-background md:relative md:z-10 md:-translate-y-1 md:border-b-[10px] md:border-background md:shadow-[6px_6px_0_0] md:shadow-surface-inverse/35 md:hover:-translate-y-1.5 md:hover:shadow-[8px_8px_0_0] md:hover:shadow-black/25",
              )}
            >
            <article className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                className={cn(
                  "relative aspect-square w-full overflow-hidden border-b-4 border-foreground",
                  p.featured && "border-background",
                )}
              >
                <Image
                  src={bundleProductImage[p.id]}
                  alt={`SILVARA ${p.shortName} — ${p.name.toLowerCase()} product photo`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                  className="object-cover"
                />
              </div>
              <div
                className={cn(
                  "border-b-4 border-foreground px-5 py-4 md:px-6 md:py-5",
                  p.featured
                    ? "border-background bg-background text-foreground"
                    : "bg-muted",
                )}
              >
                {p.badge ? (
                  <span className="font-mono-label text-sm font-bold uppercase tracking-wide text-accent">
                    {p.badge}
                  </span>
                ) : (
                  <span className="font-mono-label text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Anchor
                  </span>
                )}
                <h3 className="font-heading mt-2 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
                  {p.name}
                </h3>
              </div>
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col p-5 md:p-6",
                  p.featured && "pb-6 md:pb-8",
                )}
              >
                <BundlePriceRow
                  priceCents={displayCents}
                  featured={!!p.featured}
                  pct={pct}
                  showDiscount={showDiscount}
                  currency={currency}
                />
                <BundleUnitNote
                  p={p}
                  priceCents={displayCents}
                  currency={currency}
                  showDiscount={showDiscount}
                  pct={pct}
                  featured={!!p.featured}
                />
                <p
                  className={cn(
                    "mt-4 flex-1 text-base leading-relaxed md:text-lg",
                    p.featured
                      ? "text-background/95"
                      : "text-foreground/90",
                  )}
                >
                  {p.description}
                </p>
                <p
                  className={cn(
                    "mt-auto pt-6 font-mono-label text-[0.6rem] uppercase tracking-[0.22em] md:pt-8",
                    p.featured ? "text-background/50" : "text-muted-foreground",
                  )}
                >
                  View product →
                </p>
              </div>
            </article>
            </Link>
            );
          })}
        </div>

        {/* Fresh rotation — full band links to product page (listing-style, no cart on grid) */}
        <Link
          id="rotation"
          href={withSiteRegion(region, `/product/${rotation.id}`)}
          aria-label="SILVARA — 3 pairs monthly, subscribe"
          className="group relative mt-16 block scroll-mt-24 overflow-hidden border-4 border-foreground bg-surface-inverse text-left text-background no-underline outline-none transition-[transform,box-shadow] focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse hover:shadow-[6px_6px_0_0] hover:shadow-black/30 md:mt-20 md:hover:-translate-y-0.5"
        >
          <div className="grid lg:grid-cols-[minmax(0,42%)_1fr]">
            <div className="relative min-h-48 w-full border-b-4 border-background sm:min-h-56 lg:min-h-[300px] lg:h-full lg:border-r-4 lg:border-b-0">
              <Image
                src="/shipping.jpg"
                alt="SILVARA — 3-pair monthly sock shipment"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-inverse/85 to-transparent lg:bg-gradient-to-r" />
            </div>

            <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-10 lg:py-12">
              <div className="inline-flex w-fit border-2 border-background bg-accent px-3 py-1 font-mono-label text-xs font-bold uppercase tracking-wide text-accent-foreground">
                {rotation.badge}
              </div>
              <h3 className="font-heading mt-4 text-2xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-3xl lg:text-4xl">
                Fresh
                <br />
                rotation
              </h3>
              <p className="mt-3 max-w-md text-sm leading-snug text-background/90 md:text-base">
                Same socks as the packs—3 pairs, monthly. Pause in Stripe before the next bill.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
                {[
                  { k: "Cadence", v: "Monthly" },
                  { k: "Ships", v: "3 pairs" },
                  { k: "Terms", v: "Pause anytime" },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="border-2 border-background/40 bg-background/5 px-3 py-2 md:px-4 md:py-3"
                  >
                    <p className="font-mono-label text-xs font-bold uppercase tracking-wide text-background/65">
                      {item.k}
                    </p>
                    <p className="mt-0.5 font-heading text-sm font-extrabold uppercase">
                      {item.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex min-w-0 flex-col gap-5 border-t-2 border-background/25 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-background/60">
                    Per shipment
                  </p>
                  {showDiscount ? (
                    <div className="mt-0.5 flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-2">
                      <span className="font-heading text-[clamp(1.35rem,2.5vw+0.35rem,2.5rem)] font-extrabold tabular-nums leading-none tracking-tight line-through decoration-2 text-background/45 md:text-[clamp(1.5rem,2vw+0.5rem,2.75rem)]">
                        {formatMoney(rotationCents, currency)}
                      </span>
                      <span className="font-heading text-[clamp(1.35rem,2.5vw+0.35rem,2.5rem)] font-extrabold tabular-nums leading-none tracking-tight text-background md:text-[clamp(1.5rem,2vw+0.5rem,2.75rem)]">
                        {formatMoney(applyPromoToCents(rotationCents, pct), currency)}
                      </span>
                      <span className="font-mono-label shrink-0 rounded-sm border border-background/45 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-background">
                        −{pct}%
                      </span>
                    </div>
                  ) : (
                    <p className="font-heading mt-0.5 text-[clamp(1.35rem,2.5vw+0.35rem,2.5rem)] font-extrabold tabular-nums leading-none tracking-tight text-background md:text-[clamp(1.5rem,2vw+0.5rem,2.75rem)]">
                      {formatMoney(rotationCents, currency)}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-background/75">
                    {rotation.unitNote}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:max-w-xs sm:flex-1">
                  <span className="inline-flex h-14 w-full cursor-pointer items-center justify-center border-2 border-background bg-accent px-4 font-heading text-base font-extrabold uppercase tracking-wide text-accent-foreground transition-opacity group-hover:opacity-90 md:h-16 md:text-lg">
                    View rotation
                  </span>
                  <p className="font-mono-label text-[0.6rem] uppercase tracking-[0.2em] text-background/55">
                    Full details & subscribe on next screen →
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
