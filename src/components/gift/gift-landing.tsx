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
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import { trackMetaEvent } from "@/lib/meta/track-client";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Is this only for construction workers?",
    a: "No. Built for hard environments like work boots, but fine for travel, training, warehouse, kitchen, retail, or daily wear.",
  },
  {
    q: "Are these thick work socks?",
    a: "No. Thin crew—more room in the shoe or boot.",
  },
  {
    q: "Does it stop all foot odor?",
    a: "No sock can guarantee that. SILVARA is designed to help manage odor in the fabric through silver-infused yarn.",
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
        className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground"
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
                : "border-foreground/30 bg-background text-foreground hover:border-foreground",
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
  priceLabel,
  ctaLabel,
}: {
  id: string;
  sockColor: SockColor;
  setSockColor: (c: SockColor) => void;
  priceLabel: string;
  ctaLabel: string;
}) {
  return (
    <div id={id} className="space-y-4">
      <div>
        <p className="font-heading text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl">
          {priceLabel}
        </p>
        <p className="mt-1 font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          3 pairs · one size · shipping at checkout
        </p>
      </div>

      <ColorPicker id={id} value={sockColor} onChange={setSockColor} />

      <AddToCartButton
        id="triple"
        sockSize={DEFAULT_SOCK_SIZE}
        sockColor={sockColor}
        label={ctaLabel}
        className="!h-12 !text-sm md:!h-14 md:!text-base"
      />
      <p className="font-mono-label text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        Most people gift black
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
    unitAmountCentsByBundle.triple ?? triple?.priceCents ?? 4200;
  const sixCents = unitAmountCentsByBundle.six ?? six?.priceCents ?? 7200;
  const singleCents =
    unitAmountCentsByBundle.single ?? single?.priceCents ?? 1800;
  const priceLabel = formatMoney(tripleCents, currency);

  const [sockColor, setSockColor] = useState<SockColor>(DEFAULT_SOCK_COLOR);
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
      <p className="border-b border-foreground/20 bg-muted/60 px-4 py-2 text-center font-mono-label text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground md:px-6">
        3-pair gift set · black or white · one size
      </p>

      <section className="mx-auto grid max-w-[1100px] gap-10 px-4 py-10 md:grid-cols-2 md:items-start md:gap-14 md:px-6 md:py-16">
        <div className="order-2 md:order-1">
          <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-accent">
            {hero.eyebrow}
          </p>
          <h1 className="font-heading mt-3 text-4xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-5xl lg:text-[3.4rem]">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/80 md:text-lg">
            {hero.subheadline}
          </p>

          <div className="mt-8 hidden max-w-md md:block">
            <GiftPurchaseBlock
              id="gift-purchase-hero"
              sockColor={sockColor}
              setSockColor={setSockColor}
              priceLabel={priceLabel}
              ctaLabel="Give him the 3-pack"
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
            priceLabel={priceLabel}
            ctaLabel="Give him the 3-pack"
          />
        </div>
        <div ref={firstCtaRef} className="order-4 col-span-full h-px" aria-hidden />
      </section>

      <section className="border-y border-foreground/15 bg-muted/40">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-10 md:grid-cols-3 md:gap-10 md:px-6 md:py-12">
          {[
            ["Useful every week", "Not another drawer item."],
            ["Made for long days", "Thin crew for boots and shoes."],
            ["Silver-infused yarn", "Helps manage odor in the sock."],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-heading text-sm font-extrabold uppercase tracking-tight">
                {title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-4xl">
            More thoughtful than another random gadget.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/80 md:text-lg">
            He may not ask for better socks. He’ll still use them every week—and
            you’ll have noticed the long shifts and the boots by the door.
          </p>
        </div>
        <ul className="mt-10 grid max-w-3xl gap-6 md:grid-cols-3">
          {[
            ["He will use them", "Already in his routine."],
            ["You noticed", "Tied to how he works."],
            ["It solves something", "Silver yarn with a job."],
          ].map(([title, body]) => (
            <li key={title}>
              <p className="font-heading text-sm font-extrabold uppercase">
                {title}
              </p>
              <p className="mt-1 text-sm text-foreground/70">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-muted/50">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:gap-14 md:px-6 md:py-20">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-4xl">
              A quiet fix for the end of the day.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80 md:text-lg">
              Heat and hours in a closed shoe leave odor in the sock. Sprays
              treat the shoe. SILVARA changes the layer on his foot—silver
              fiber, no perfume.
            </p>
          </div>
          <div className="space-y-4 font-mono-label text-xs uppercase tracking-wide">
            <div className="border-l-2 border-foreground/25 pl-4">
              <p className="text-muted-foreground">Regular sock</p>
              <p className="mt-1 normal-case tracking-normal text-foreground/75">
                Standard yarn. Holds moisture and odor after long wear.
              </p>
            </div>
            <div className="border-l-2 border-accent pl-4">
              <p className="text-accent">SILVARA</p>
              <p className="mt-1 normal-case tracking-normal text-foreground/75">
                Silver-infused yarn. Thin crew for boots and everyday wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-14 md:px-6 md:py-20">
        <div className="max-w-lg">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight uppercase md:text-4xl">
            What arrives
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            Three matching pairs of thin crew socks in your selected color. One
            size.
          </p>
          <div className="mt-8">
            <GiftPurchaseBlock
              id="gift-purchase-mid"
              sockColor={sockColor}
              setSockColor={setSockColor}
              priceLabel={priceLabel}
              ctaLabel="Add the 3-pack"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15">
        <div className="mx-auto max-w-[1100px] px-4 py-14 md:px-6 md:py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight md:text-2xl">
                Specs
              </h2>
              <dl className="mt-5 space-y-3">
                {[
                  ["Contents", "3 pairs"],
                  ["Height", "Thin crew"],
                  ["Colors", "Black or white marl"],
                  ["Fit", "One size"],
                  ["Yarn", "Silver-infused blend"],
                  ["Care", "Wash cold · tumble low · no bleach"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-foreground/10 pb-3 text-sm"
                  >
                    <dt className="font-mono-label text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
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
              <div className="mt-4 divide-y divide-foreground/10">
                {FAQ.map((item) => (
                  <details key={item.q} className="group py-3">
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
                    <p className="mt-2 pr-6 text-sm leading-relaxed text-foreground/75">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-muted/30">
        <div className="mx-auto max-w-[1100px] px-4 py-10 md:px-6">
          <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
            Other options
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            {single ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm text-foreground/70">
                  Just want to try one pair?{" "}
                  <span className="font-medium text-foreground">
                    {formatMoney(singleCents, currency)}
                  </span>
                </p>
                <AddToCartButton
                  id="single"
                  sockSize={DEFAULT_SOCK_SIZE}
                  sockColor={sockColor}
                  label="Add 1 pair"
                  variant="outline"
                  className="!h-10 !w-auto !px-4 !text-xs"
                />
              </div>
            ) : null}
            {six ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:border-l sm:border-foreground/15 sm:pl-8">
                <p className="text-sm text-foreground/70">
                  Need more? 6-pack{" "}
                  <span className="font-medium text-foreground">
                    {formatMoney(sixCents, currency)}
                  </span>
                </p>
                <AddToCartButton
                  id="six"
                  sockSize={DEFAULT_SOCK_SIZE}
                  sockColor={sockColor}
                  label="Add 6-pack"
                  variant="outline"
                  className="!h-10 !w-auto !px-4 !text-xs"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="border-t border-foreground/15 px-4 py-5 text-center md:px-6">
        <Link
          href={withSiteRegion(region, "/")}
          className="font-mono-label text-[0.65rem] uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Main SILVARA site
        </Link>
      </div>

      <SiteFooter region={region} />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-foreground/20 bg-background/95 p-3 backdrop-blur-sm transition-transform duration-200 md:hidden",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono-label text-[0.65rem] font-bold uppercase tracking-wide">
              3-pack · {priceLabel}
            </p>
            <p className="truncate font-mono-label text-[0.6rem] uppercase text-muted-foreground">
              {SOCK_COLOR_LABEL[sockColor]}
            </p>
          </div>
          <a
            href="#gift-purchase-mobile"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center bg-accent px-4 font-heading text-xs font-extrabold uppercase tracking-wide text-accent-foreground"
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
