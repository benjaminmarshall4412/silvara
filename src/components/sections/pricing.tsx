import Image from "next/image";

import { AddToCartButton } from "@/components/add-to-cart-button";
import type { BundleId, Product } from "@/lib/products";
import { PRODUCTS, formatUsd } from "@/lib/products";
import { cn } from "@/lib/utils";

type OneTimeBundleProduct = Product & { id: Exclude<BundleId, "rotation"> };

const bundles = PRODUCTS.filter(
  (p): p is OneTimeBundleProduct => !p.isSubscription,
);
const rotation = PRODUCTS.find((p) => p.isSubscription)!;

const bundleProductImage: Record<Exclude<BundleId, "rotation">, string> = {
  single: "/1pair.jpg",
  triple: "/3pair.jpg",
  six: "/6pair.jpg",
};

const chips = [
  "Thin crew · boot-friendly",
  "Silver yarn",
  "Bacterial odor",
  "Long shifts",
];

/** Bump this when you replace the hero image in `public/` so browsers/CDNs fetch the new file. */
const HERO_IMAGE_VERSION = 3;

const heroSrc = `/169_dimension__GPT_Image_2_23872.jpg?v=${HERO_IMAGE_VERSION}`;

export function Pricing() {
  return (
    <section
      id="loadouts"
      className="scroll-mt-24 border-b-4 border-foreground bg-background px-0 pb-10 pt-0 md:pb-14"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed hero — public/169_dimension__GPT_Image_2_23872.jpg */}
      <div className="relative w-full border-b-4 border-foreground">
        <div className="relative min-h-[min(72vh,820px)] w-full md:min-h-[min(78vh,900px)]">
          <Image
            src={heroSrc}
            alt="On-the-job wear in SILVARA — silver-infused thin crew socks for long shifts and work boots"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="scale-x-[-1] border-0 object-cover object-[center_25%] md:object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-black/45 md:bg-black/40"
            aria-hidden
          />
          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-12 pt-28 md:px-10 md:pb-16 md:pt-32 lg:px-14 lg:pb-20">
            <p className="font-mono-label text-on-hero-eyebrow text-xs font-bold uppercase tracking-[0.2em] md:text-sm">
              Built for the floor
            </p>
            <h1
              id="hero-heading"
              className="font-heading mt-4 max-w-[92vw] text-4xl font-extrabold uppercase leading-[0.92] tracking-tight sm:max-w-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="block text-background">Odor is bacteria.</span>
              <span className="text-on-hero-accent mt-[0.08em] block">
                Cut the signal.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-snug text-background/88 md:max-w-xl md:text-lg">
              Thin crew sock · silver-infused yarn · for people who live in work boots and safety shoes.
            </p>
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
              Junk drawer vs workweek system →
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
                Shop · shift math
              </p>
              <h2
                id="pricing-heading"
                className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl"
              >
                Add to cart
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-foreground/85 md:mx-0 md:text-lg">
                1 = try in your boot · 3 = workweek rotation · 6 = overtime / best per shift.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-3 md:gap-6 lg:gap-8 xl:gap-10">
          {bundles.map((p) => (
            <article
              key={p.id}
              className={cn(
                "flex min-h-0 flex-col border-4 border-foreground bg-background",
                p.featured &&
                  "bg-surface-inverse text-background md:relative md:z-10 md:-translate-y-1 md:border-b-[10px] md:border-background md:shadow-[6px_6px_0_0] md:shadow-surface-inverse/35",
              )}
            >
              <div
                className={cn(
                  "relative aspect-[8/5] w-full min-h-[180px] border-b-4 border-foreground sm:min-h-[200px] md:min-h-[220px]",
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
                  "flex flex-1 flex-col p-5 md:p-6",
                  p.featured && "pb-6 md:pb-8",
                )}
              >
                <p className="font-heading text-4xl font-extrabold tabular-nums md:text-5xl">
                  {formatUsd(p.priceCents)}
                </p>
                <p
                  className={cn(
                    "mt-2 text-sm leading-snug md:text-base",
                    p.featured
                      ? "text-background/90"
                      : "text-muted-foreground",
                  )}
                >
                  {p.unitNote}
                </p>
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
                <div className="mt-6 md:mt-8">
                  <AddToCartButton
                    id={p.id}
                    label="Add to cart"
                    variant={p.featured ? "primary" : "outline"}
                    className={
                      p.featured
                        ? "!h-14 !border-transparent !bg-accent !text-base !font-extrabold !text-accent-foreground md:!h-16 md:!text-lg"
                        : "!h-14 !text-base md:!h-16 md:!text-lg"
                    }
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Fresh rotation */}
        <div
          id="rotation"
          className="relative mt-16 scroll-mt-24 overflow-hidden border-4 border-foreground bg-surface-inverse text-background md:mt-20"
        >
          <div className="grid lg:grid-cols-[minmax(0,42%)_1fr]">
            <div className="relative min-h-48 w-full border-b-4 border-background sm:min-h-56 lg:min-h-[300px] lg:h-full lg:border-r-4 lg:border-b-0">
              <Image
                src="/shipping.jpg"
                alt={`SILVARA ${rotation.shortName} — scheduled resupply for workweek rotation`}
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
                Fresh pairs on the calendar so you are not stuck in yesterday&apos;s
                socks halfway through the week. Cancel or pause before the next ship.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
                {[
                  { k: "Cadence", v: "Every 2–3 mo" },
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

              <div className="mt-8 flex flex-col gap-5 border-t-2 border-background/25 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono-label text-xs font-semibold uppercase tracking-wide text-background/60">
                    Per shipment
                  </p>
                  <p className="font-heading mt-0.5 text-3xl font-extrabold md:text-4xl">
                    {formatUsd(rotation.priceCents)}
                  </p>
                  <p className="mt-1 text-sm text-background/75">
                    {rotation.unitNote}
                  </p>
                </div>
                <div className="w-full sm:max-w-xs sm:flex-1">
                  <AddToCartButton
                    id={rotation.id}
                    label="Start rotation"
                    className="!h-14 !bg-accent !text-base !text-accent-foreground md:!h-16 md:!text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
