"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
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
import {
  DEFAULT_SOCK_SIZE,
  SOCK_SIZE_DESCRIPTION,
  SOCK_SIZES,
  type SockSize,
} from "@/lib/sock-sizes";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Is this only for construction workers?",
    a: "No. Work boots are one of the harder environments for a sock, but SILVARA can also be worn for travel, training, warehouse shifts, kitchens, retail work, or normal daily use.",
  },
  {
    q: "Are these thick work socks?",
    a: "No. SILVARA is a thin crew sock designed to leave more room inside the shoe or boot.",
  },
  {
    q: "Does it stop all foot odor?",
    a: "No sock can guarantee zero odor for every person and every situation. SILVARA is designed to help manage odor in the fabric through its silver-infused yarn.",
  },
  {
    q: "How should they be washed?",
    a: "Machine wash cold. Tumble dry low. Do not bleach.",
  },
  {
    q: "What size should I choose?",
    a: "Pick the range that includes his normal US men’s shoe size. If he is between two ranges, size up.",
  },
] as const;

const CONFIDENCE = [
  {
    title: "Useful every week",
    body: "Not another item that sits in a drawer.",
  },
  {
    title: "Made for long days",
    body: "Thin crew profile for boots and everyday shoes.",
  },
  {
    title: "Silver-infused yarn",
    body: "Designed to help manage odor in the sock.",
  },
  {
    title: "Easy to buy",
    body: "Choose his normal shoe-size range.",
  },
] as const;

const CARE_CARDS = [
  {
    title: "He will use them",
    body: "Socks are already part of his routine. There is nothing to charge, assemble, learn, or store.",
  },
  {
    title: "You noticed",
    body: "The gift connects directly to how he works, trains, travels, or spends his day.",
  },
  {
    title: "It solves something",
    body: "Silver-infused yarn gives the sock a purpose beyond looking good in the package.",
  },
] as const;

const SPECS = [
  { label: "Contents", value: "3 pairs" },
  { label: "Height", value: "Thin crew" },
  { label: "Colors", value: "Black marl or white marl" },
  { label: "Sizes", value: "Men’s 5–7, 8–10, 11–13, 14+" },
  { label: "Yarn", value: "Silver-infused blend (see care tag)" },
  { label: "Best for", value: "Work boots, long shifts, travel, gym, daily wear" },
  { label: "Care", value: "Machine wash cold, tumble low, no bleach" },
] as const;

function GiftPurchaseBlock({
  id,
  sockSize,
  setSockSize,
  sockColor,
  setSockColor,
  priceLabel,
  ctaLabel,
  compact,
}: {
  id: string;
  sockSize: SockSize;
  setSockSize: (s: SockSize) => void;
  sockColor: SockColor;
  setSockColor: (c: SockColor) => void;
  priceLabel: string;
  ctaLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      id={id}
      className={cn(
        "border-4 border-foreground bg-background",
        compact ? "px-4 py-5" : "px-5 py-6 md:px-6 md:py-7",
      )}
    >
      <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-accent">
        The 3-pair gift set
      </p>
      <p className="mt-2 text-base leading-relaxed text-foreground/90">
        One useful gift. Three pairs he can put into his normal rotation.
      </p>
      <p className="font-heading mt-4 text-3xl font-extrabold tabular-nums md:text-4xl">
        {priceLabel}
      </p>
      <p className="mt-1 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        Shipping calculated at checkout · no subscription
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-color`}
            className="font-mono-label text-xs font-bold uppercase tracking-wide"
          >
            Color
          </label>
          <select
            id={`${id}-color`}
            value={sockColor}
            onChange={(e) => setSockColor(e.target.value as SockColor)}
            className="mt-2 w-full border-2 border-foreground bg-background px-3 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            htmlFor={`${id}-size`}
            className="font-mono-label text-xs font-bold uppercase tracking-wide"
          >
            Size
          </label>
          <select
            id={`${id}-size`}
            value={sockSize}
            onChange={(e) => setSockSize(e.target.value as SockSize)}
            className="mt-2 w-full border-2 border-foreground bg-background px-3 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SOCK_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} — {SOCK_SIZE_DESCRIPTION[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <AddToCartButton
          id="triple"
          sockSize={sockSize}
          sockColor={sockColor}
          label={ctaLabel}
          className="!h-[52px] !text-sm md:!h-14 md:!text-base"
        />
      </div>
      <p className="mt-3 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        Secure checkout · no account required · no subscription
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
  const tripleCents =
    unitAmountCentsByBundle.triple ?? triple?.priceCents ?? 4200;
  const sixCents = unitAmountCentsByBundle.six ?? six?.priceCents ?? 7200;
  const priceLabel = formatMoney(tripleCents, currency);

  const [sockSize, setSockSize] = useState<SockSize>(DEFAULT_SOCK_SIZE);
  const [sockColor, setSockColor] = useState<SockColor>(DEFAULT_SOCK_COLOR);
  const [stickyVisible, setStickyVisible] = useState(false);
  const firstCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    posthog.capture("gift_landing_viewed", {
      angle,
      region,
      bundle_id: "triple",
    });
  }, [angle, region]);

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

  const heroSrc =
    sockColor === "white" ? "/white1pair-1.png" : "/frontpage-triple.png";

  return (
    <div className="pb-24 md:pb-0">
      <div className="border-b-2 border-foreground bg-muted">
        <p className="mx-auto max-w-[1200px] px-4 py-2.5 text-center font-mono-label text-[0.65rem] font-bold uppercase tracking-[0.14em] text-foreground md:px-6 md:text-xs">
          3 pairs · black or white · men’s sizes 5–14+
        </p>
      </div>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] md:items-start md:gap-10 md:px-6 md:py-14">
        <div className="order-1 md:order-1">
          <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-accent md:text-xs">
            {hero.eyebrow}
          </p>
          <h1 className="font-heading mt-3 text-[2.35rem] leading-[0.95] font-extrabold tracking-tight uppercase md:text-[3.5rem] lg:text-[4rem]">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-foreground/90 md:text-xl">
            {hero.subheadline}
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground md:text-xs">
            <li>3 pairs</li>
            <li>Black or white</li>
            <li>Men’s sizes 5–14+</li>
            <li>Machine washable</li>
          </ul>

          <div className="mt-8 hidden md:block">
            <GiftPurchaseBlock
              id="gift-purchase-hero"
              sockSize={sockSize}
              setSockSize={setSockSize}
              sockColor={sockColor}
              setSockColor={setSockColor}
              priceLabel={priceLabel}
              ctaLabel="Give him the 3-pack"
            />
          </div>
        </div>

        <div className="order-2 md:order-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden border-4 border-foreground bg-muted md:aspect-square">
            <Image
              src={heroSrc}
              alt="SILVARA 3-pair thin crew socks — gift set"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover object-center"
            />
          </div>
          <p className="mt-3 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Thin crew · silver-infused yarn · no perfume
          </p>
        </div>

        <div className="order-3 md:hidden">
          <GiftPurchaseBlock
            id="gift-purchase-mobile"
            sockSize={sockSize}
            setSockSize={setSockSize}
            sockColor={sockColor}
            setSockColor={setSockColor}
            priceLabel={priceLabel}
            ctaLabel="Give him the 3-pack"
            compact
          />
        </div>
        <div
          ref={firstCtaRef}
          className="order-4 col-span-full h-px w-full"
          aria-hidden
        />
      </section>

      <section className="border-y-4 border-foreground bg-background">
        <div className="mx-auto grid max-w-[1200px] sm:grid-cols-2 lg:grid-cols-4">
          {CONFIDENCE.map((item) => (
            <div
              key={item.title}
              className="border-b-2 border-foreground px-5 py-6 last:border-b-0 sm:border-r-2 sm:odd:border-r-2 sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r-2 lg:[&:nth-child(4n)]:border-r-0"
            >
              <p className="font-heading text-sm font-extrabold uppercase tracking-tight md:text-base">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
        <h2 className="font-heading max-w-3xl text-3xl font-extrabold tracking-tight uppercase md:text-5xl">
          More thoughtful than another random gadget.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/90">
          He may not ask for better socks. He will still use them every week.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85 md:text-lg">
          SILVARA is the kind of gift that shows you noticed the long shifts, the
          work boots by the door, and the small things that make his day more
          comfortable.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {CARE_CARDS.map((card) => (
            <div
              key={card.title}
              className="border-4 border-foreground bg-muted/40 px-5 py-6"
            >
              <h3 className="font-heading text-lg font-extrabold uppercase tracking-tight">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85 md:text-base">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-4 border-foreground bg-muted/50">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
          <h2 className="font-heading max-w-3xl text-3xl font-extrabold tracking-tight uppercase md:text-5xl">
            A quiet fix for the end of the day.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/90">
            Heat, moisture, and hours inside a closed shoe can leave odor behind
            in the sock. Sprays and shoe inserts focus on the shoe. SILVARA
            changes the layer directly against his foot.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85 md:text-lg">
            The yarn includes silver fiber and does not rely on added perfume to
            cover the smell.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="border-4 border-foreground bg-background px-5 py-6">
              <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                Regular sock
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/85 md:text-base">
                <li>Standard yarn</li>
                <li>Holds moisture and odor after long wear</li>
                <li>No odor-control material</li>
              </ul>
            </div>
            <div className="border-4 border-foreground bg-background px-5 py-6">
              <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-accent">
                SILVARA
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/85 md:text-base">
                <li>Silver-infused yarn</li>
                <li>Thin crew construction</li>
                <li>Designed for boots, shifts, travel, and everyday wear</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
        <h2 className="font-heading max-w-3xl text-3xl font-extrabold tracking-tight uppercase md:text-5xl">
          What arrives.
        </h2>
        <div className="mt-8 grid items-start gap-8 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden border-4 border-foreground bg-muted">
            <Image
              src="/3pair.jpg"
              alt="Three pairs of SILVARA thin crew socks"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-lg leading-relaxed text-foreground/90">
              Inside the package:
            </p>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-foreground/85">
              <li>Three matching pairs of SILVARA thin crew socks</li>
              <li>Your selected size and color</li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Same 3-pack as the rest of the store—presented as a complete,
              useful gift for him.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y-4 border-foreground bg-background">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
          <GiftPurchaseBlock
            id="gift-purchase-mid"
            sockSize={sockSize}
            setSockSize={setSockSize}
            sockColor={sockColor}
            setSockColor={setSockColor}
            priceLabel={priceLabel}
            ctaLabel="Add the gift set"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-5xl">
          What he will actually wear
        </h2>
        <div className="mt-8 border-4 border-foreground">
          {SPECS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 border-b-2 border-foreground last:border-b-0 sm:grid-cols-[10rem_1fr]"
            >
              <div className="bg-muted px-4 py-3 font-mono-label text-xs font-bold uppercase tracking-wide sm:border-r-2 sm:border-foreground">
                {row.label}
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed text-foreground/90 md:text-base">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-4 border-foreground bg-muted/40">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-4xl">
            Don’t know his sock size?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/90">
            Choose the range containing his normal shoe size. If you are between
            two ranges, choose the larger size.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SOCK_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSockSize(s)}
                className={cn(
                  "border-4 px-4 py-4 text-left transition-colors",
                  sockSize === s
                    ? "border-accent bg-background"
                    : "border-foreground bg-background hover:bg-muted",
                )}
              >
                <p className="font-heading text-xl font-extrabold uppercase">
                  {s}
                </p>
                <p className="mt-1 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {SOCK_SIZE_DESCRIPTION[s]}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-4xl">
          Questions
        </h2>
        <div className="mt-8 border-4 border-foreground">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group border-b-2 border-foreground last:border-b-0"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-heading text-base font-extrabold uppercase tracking-tight marker:content-none md:text-lg [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span className="font-mono-label text-xs text-muted-foreground group-open:hidden">
                    +
                  </span>
                  <span className="font-mono-label hidden text-xs text-muted-foreground group-open:inline">
                    −
                  </span>
                </span>
              </summary>
              <p className="border-t-2 border-foreground/20 px-5 pb-5 text-base leading-relaxed text-foreground/85">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {six ? (
        <section className="border-t-4 border-foreground bg-background">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                Optional upgrade
              </p>
              <h2 className="font-heading mt-2 text-2xl font-extrabold uppercase md:text-3xl">
                Need more than three?
              </h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-foreground/85">
                The 6-pack is there if he rotates through a heavy week—or you
                want extras on hand. Same sock. Better per-pair value.
              </p>
              <p className="font-heading mt-3 text-xl font-extrabold tabular-nums">
                {formatMoney(sixCents, currency)}
              </p>
            </div>
            <div className="w-full max-w-xs shrink-0">
              <AddToCartButton
                id="six"
                sockSize={sockSize}
                sockColor={sockColor}
                label="Add the 6-pack"
                variant="outline"
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="border-t-4 border-foreground bg-muted/30 px-4 py-6 text-center md:px-6">
        <Link
          href={withSiteRegion(region, "/")}
          className="font-mono-label text-xs uppercase tracking-widest text-foreground underline underline-offset-4 hover:text-accent"
        >
          Visit the main SILVARA site
        </Link>
      </div>

      <SiteFooter region={region} />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t-4 border-foreground bg-background p-3 transition-transform duration-200 md:hidden",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-wide">
              3-pair gift set · {priceLabel}
            </p>
            <p className="truncate font-mono-label text-[0.6rem] uppercase text-muted-foreground">
              {SOCK_COLOR_LABEL[sockColor]} · {sockSize}
            </p>
          </div>
          <a
            href="#gift-purchase-mobile"
            className="inline-flex h-12 shrink-0 items-center justify-center border-2 border-transparent bg-accent px-4 font-heading text-xs font-extrabold uppercase tracking-wide text-accent-foreground"
            onClick={() => {
              posthog.capture("gift_sticky_cta_clicked", { angle, region });
            }}
          >
            Choose size
          </a>
        </div>
      </div>
    </div>
  );
}
