"use client";

import Image from "next/image";
import Link from "next/link";

import type { BundleId, Product } from "@/lib/products";
import { PRODUCTS, formatMoney } from "@/lib/products";
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

/** Bump this when you replace the hero image in `public/` so browsers/CDNs fetch the new file. */
const HERO_IMAGE_VERSION = 5;

const heroSrc = `/header.png?v=${HERO_IMAGE_VERSION}`;

function packNote(p: OneTimeBundleProduct, priceCents: number, currency: string) {
  if (p.id === "single") return p.unitNote;
  if (p.id === "triple") {
    return "Free shipping · $16 a pair.";
  }
  const per = Math.round(priceCents / 6);
  return `${formatMoney(per, currency)} a pair.`;
}

export function Pricing() {
  const region = useSiteRegion();
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const rotationCents = unitAmountCentsByBundle[rotation.id];
  const triple = bundles.find((b) => b.id === "triple")!;

  return (
    <section
      id="loadouts"
      className="scroll-mt-24 border-b-4 border-foreground bg-background px-0 pb-12 pt-0 md:pb-16"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed hero */}
      <div className="relative w-full border-b-4 border-foreground">
        <div className="relative min-h-[min(78vh,880px)] w-full md:min-h-[min(85vh,960px)]">
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20"
            aria-hidden
          />
          <div className="absolute inset-0 flex min-w-0 flex-col justify-end px-5 pb-14 pt-28 md:px-10 md:pb-20 md:pt-32 lg:px-14 lg:pb-24">
            <div className="relative z-10 w-full min-w-0 max-w-[min(100%,34rem)] sm:max-w-[40rem] lg:max-w-[44rem]">
              <p className="font-heading text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-tighter text-background">
                SILVARA
              </p>
              <h1
                id="hero-heading"
                className="font-heading mt-4 text-pretty text-2xl font-extrabold uppercase leading-[1.05] tracking-tight text-background/95 sm:text-3xl md:mt-5 md:text-4xl"
              >
                Thin crew for work boots.
              </h1>
              <p className="mt-4 max-w-md text-base font-medium leading-snug text-background/80 md:text-lg">
                Silver yarn that targets bacteria on the fiber—not a scent mask.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-4">
                <a
                  href="#shop"
                  className="inline-flex h-12 items-center justify-center border-2 border-background bg-accent px-5 font-heading text-sm font-extrabold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90 md:h-14 md:px-6 md:text-base"
                >
                  Shop the 3-pack
                </a>
                <a
                  href="#failure-mode"
                  className="inline-flex h-12 items-center justify-center border-2 border-background/70 bg-transparent px-5 font-mono-label text-xs font-semibold uppercase tracking-wide text-background transition-colors hover:border-background hover:bg-background/10 md:h-14 md:text-sm"
                >
                  Why silver →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop */}
      <div id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-2xl text-center md:mx-0 md:max-w-xl md:text-left">
          <p className="font-mono-label text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            The packs
          </p>
          <h2
            id="pricing-heading"
            className="font-heading mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl"
          >
            Same sock. Three ways in.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/80 md:text-lg">
            Start with one pair, or take the workweek pack with free shipping.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-3 md:gap-6 lg:gap-8">
          {bundles.map((p) => {
            const displayCents = unitAmountCentsByBundle[p.id];
            const isFeatured = p.id === "triple";
            return (
              <Link
                key={p.id}
                href={withSiteRegion(region, `/product/${p.id}`)}
                aria-label={`SILVARA ${p.name} — view product details and add to cart`}
                className={cn(
                  "group flex min-h-0 min-w-0 flex-col overflow-hidden border-4 border-foreground bg-background text-left no-underline outline-none transition-transform duration-300 ease-out focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isFeatured
                    ? "md:scale-[1.02] md:shadow-[0_0_0_1px] md:shadow-foreground"
                    : "hover:-translate-y-0.5",
                )}
              >
                <article className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="relative aspect-square w-full overflow-hidden border-b-4 border-foreground">
                    <Image
                      src={bundleProductImage[p.id]}
                      alt={`SILVARA ${p.shortName} — ${p.name.toLowerCase()} product photo`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                    <h3 className="font-heading text-xl font-extrabold uppercase tracking-tight md:text-2xl">
                      {p.name}
                    </h3>
                    <p className="font-heading mt-3 text-[clamp(1.75rem,2vw+1rem,2.5rem)] font-extrabold tabular-nums leading-none tracking-tight text-foreground">
                      {formatMoney(displayCents, currency)}
                    </p>
                    <p className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">
                      {packNote(p, displayCents, currency)}
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85 md:text-base">
                      {p.description}
                    </p>
                    <p className="mt-auto pt-6 font-mono-label text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                      View →
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground md:text-left">
          Most people start with the{" "}
          <Link
            href={withSiteRegion(region, `/product/${triple.id}`)}
            className="font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4"
          >
            3-pack
          </Link>
          .
        </p>

        {/* Fresh rotation — quieter band */}
        <Link
          id="rotation"
          href={withSiteRegion(region, `/product/${rotation.id}`)}
          aria-label="SILVARA — 3 pairs monthly, subscribe"
          className="group mt-16 block scroll-mt-24 overflow-hidden border-4 border-foreground bg-surface-inverse text-left text-background no-underline outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse md:mt-20 md:hover:-translate-y-0.5"
        >
          <div className="grid lg:grid-cols-[minmax(0,40%)_1fr]">
            <div className="relative min-h-44 w-full border-b-4 border-background sm:min-h-52 lg:min-h-full lg:border-r-4 lg:border-b-0">
              <Image
                src="/shipping.jpg"
                alt="SILVARA — 3-pair monthly sock shipment"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-inverse/80 to-transparent lg:bg-gradient-to-r" />
            </div>

            <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-12">
              <p className="font-mono-label text-xs font-semibold uppercase tracking-[0.22em] text-background/55">
                Subscription
              </p>
              <h3 className="font-heading mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-3xl">
                Fresh rotation
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-background/80 md:text-base">
                Three pairs a month. Same sock. Pause anytime before the next bill.
              </p>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-background/20 pt-6">
                <div>
                  <p className="font-heading text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl">
                    {formatMoney(rotationCents, currency)}
                  </p>
                  <p className="mt-1 text-sm text-background/60">per shipment</p>
                </div>
                <span className="inline-flex h-12 items-center justify-center border-2 border-background bg-background px-5 font-heading text-sm font-extrabold uppercase tracking-wide text-foreground transition-opacity group-hover:opacity-90 md:h-14">
                  View rotation →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
