"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { OdorFaq } from "@/components/odor/odor-faq";
import { OdorGallery } from "@/components/odor/odor-gallery";
import { OdorBuyStrip } from "@/components/odor/odor-offer-card";
import { trackMetaEvent } from "@/lib/meta/track-client";
import {
  ODOR_PRODUCT,
  isFilled,
  isOdorPreviewMode,
} from "@/lib/odor-product-data";
import { formatMoney, getProduct } from "@/lib/products";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import {
  DEFAULT_SOCK_COLOR,
  SOCK_COLOR_LABEL,
  type SockColor,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { cn } from "@/lib/utils";

const MECHANISM = [
  {
    title: "Silver-infused yarn",
    body: "Odor control is built into the sock’s yarn.",
  },
  {
    title: "Thin crew profile",
    body: "Designed to fit inside everyday shoes and work boots without bulky cushioning.",
  },
  {
    title: "No added fragrance",
    body: "Controls odor without covering it with perfume.",
  },
] as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#21130e]/12 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="text-sm font-semibold text-[#5c514a]">{label}</dt>
      <dd className="text-base text-[#21130e]">{value}</dd>
    </div>
  );
}

function PreviewBanner({ children }: { children: string }) {
  return (
    <div className="border border-dashed border-[#8a6a3a]/50 bg-[#fff6e8] px-4 py-3 text-sm text-[#6a5228]">
      {children}
    </div>
  );
}

export function OdorLanding() {
  const region = useSiteRegion();
  const preview = isOdorPreviewMode();
  const { unitAmountCentsByBundle, currency, ready } =
    useStripeCatalogPrices();
  const triple = getProduct(ODOR_PRODUCT.bundleId);
  const tripleCents =
    unitAmountCentsByBundle.triple ??
    triple?.priceCents ??
    ODOR_PRODUCT.priceCents;
  const priceLabel = formatMoney(tripleCents, currency);

  const [sockColor, setSockColor] = useState<SockColor>(DEFAULT_SOCK_COLOR);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroOfferRef = useRef<HTMLDivElement>(null);
  const faqSentinelRef = useRef<HTMLDivElement>(null);
  const viewTrackedRef = useRef(false);

  const colorMeta =
    ODOR_PRODUCT.colors.find((c) => c.value === sockColor) ??
    ODOR_PRODUCT.colors[0];

  const detailRows = [
    {
      label: "Fit",
      value: ODOR_PRODUCT.shoeSizeRange,
    },
    { label: "Sock height", value: ODOR_PRODUCT.sockHeight },
    {
      label: "Material",
      value: ODOR_PRODUCT.materialComposition,
    },
    { label: "Cushioning", value: ODOR_PRODUCT.cushioningLevel },
    {
      label: "Colors",
      value: ODOR_PRODUCT.colors.map((c) => c.name).join(" · "),
    },
    { label: "Package", value: ODOR_PRODUCT.packageContents },
    { label: "Care", value: ODOR_PRODUCT.washInstructions },
    {
      label: "Made in",
      value: ODOR_PRODUCT.countryOfManufacture,
    },
  ].filter((row): row is { label: string; value: string } =>
    isFilled(row.value),
  );

  const gallerySlots = ODOR_PRODUCT.gallery.filter(
    (slot) => isFilled(slot.src) || preview,
  );

  const showReviews =
    ODOR_PRODUCT.reviews.length > 0 || preview;
  const showGuarantee =
    (ODOR_PRODUCT.guaranteeEnabled &&
      isFilled(ODOR_PRODUCT.guaranteeTerms)) ||
    preview;

  const footerLinks = ODOR_PRODUCT.footerLinks
    .map((link) => {
      if (!link.href) return null;
      const href = link.href.startsWith("#")
        ? link.href
        : withSiteRegion(region, link.href);
      return { ...link, href };
    })
    .filter((link): link is { label: string; href: string } => Boolean(link));

  // Analytics: fire ViewContent once when catalog prices are ready.
  // InitiateCheckout fires from buy-now CTAs; Purchase fires on success.
  useEffect(() => {
    if (!ready || viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    posthog.capture("odor_landing_viewed", {
      region,
      bundle_id: ODOR_PRODUCT.bundleId,
      landing_path: "odor-focused",
    });
    void trackMetaEvent({
      eventName: "ViewContent",
      customData: {
        content_ids: [ODOR_PRODUCT.bundleId],
        content_type: "product",
        content_name: "SILVARA 3-Pack — Fresher Socks",
        value: tripleCents / 100,
        currency: currency.toUpperCase(),
      },
    });
  }, [currency, ready, region, tripleCents]);

  useEffect(() => {
    const offer = heroOfferRef.current;
    const faq = faqSentinelRef.current;
    if (!offer) return;

    let offerVisible = true;
    let faqVisible = false;

    const sync = () => {
      setStickyVisible(!offerVisible && !faqVisible);
    };

    const offerObs = new IntersectionObserver(
      ([entry]) => {
        offerVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" },
    );
    offerObs.observe(offer);

    let faqObs: IntersectionObserver | null = null;
    if (faq) {
      faqObs = new IntersectionObserver(
        ([entry]) => {
          faqVisible = entry.isIntersecting;
          sync();
        },
        { threshold: 0, rootMargin: "0px 0px -20% 0px" },
      );
      faqObs.observe(faq);
    }

    return () => {
      offerObs.disconnect();
      faqObs?.disconnect();
    };
  }, []);

  return (
    <div className="overflow-x-hidden bg-[#f6efe4] text-[#21130e]">
      {/* 2. Message-match band */}
      <section className="relative isolate overflow-hidden bg-[#21130e] text-white">
        <div
          className="pointer-events-none absolute -top-64 right-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#b84a2d]/30 blur-[120px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
          <p className="text-sm font-bold tracking-[0.18em] text-[#e68161] uppercase">
            For long shifts in closed shoes
          </p>
          <h1 className="mt-3 max-w-[16ch] break-words font-heading text-[clamp(2.3rem,5vw,4rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
            Long shifts. Less sock odor.
          </h1>
          <p className="mt-4 max-w-[36rem] text-base leading-relaxed text-white/75 sm:text-lg">
            Thin crew socks with silver fiber woven into the yarn to help
            control odor in the fabric. No fragrance. No bulky cushioning.
          </p>
        </div>
      </section>

      {/* 2b. Product page: gallery + buy panel */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto grid max-w-[1160px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <OdorGallery images={colorMeta.gallery} sockColor={sockColor} />

          <div
            ref={heroOfferRef}
            id="odor-hero-offer"
            className="min-w-0 rounded-none border border-[#21130e]/20 bg-[#fffaf2] p-5 sm:p-6 lg:sticky lg:top-24"
          >
            <OdorBuyStrip
              id="odor-offer-card"
              priceLabel={priceLabel}
              sockColor={sockColor}
              setSockColor={setSockColor}
              placement="hero"
            />
          </div>
        </div>
      </section>

      {/* 3. Founder four-day test — hidden until video is ready (mint block was off-brand without it) */}
      {false && (
      <section className="bg-[#dfe7d6] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-[1160px] gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[0.16em] text-[#4b613d] uppercase">
              The four-day test
            </p>
            <h2 className="mt-3 max-w-[12ch] break-words font-heading text-[clamp(2.2rem,4.2vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
              Why Silvara exists.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#3f4c38] sm:text-lg">
              I wore the same pair for four days to see how far they could go.
              By day four, they still did not smell like a normal worn sock.
              That test is why we launched Silvara.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#556348]">
              Personal wear test. Results vary based on activity, footwear and
              use.
            </p>
          </div>

          <div className="min-w-0">
            {isFilled(ODOR_PRODUCT.founderVideoSrc) ? (
              <div className="overflow-hidden rounded-none bg-[#21130e]">
                <video
                  className="aspect-video w-full"
                  controls
                  playsInline
                  preload="none"
                  poster={ODOR_PRODUCT.founderVideoPoster ?? undefined}
                >
                  <source src={ODOR_PRODUCT.founderVideoSrc ?? undefined} />
                  <track kind="captions" srcLang="en" label="English" />
                </video>
              </div>
            ) : preview ? (
              <div className="flex aspect-video items-center justify-center rounded-none border border-dashed border-[#4b613d]/40 bg-[#f6efe4] px-6 text-center">
                <div>
                  <p className="font-heading text-xl font-extrabold uppercase">
                    Founder four-day test video
                  </p>
                  <p className="mt-2 text-sm text-[#5c514a]">
                    [FOUNDER VIDEO PLACEHOLDER]
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video overflow-hidden rounded-none">
                <Image
                  src={ODOR_PRODUCT.founderFallbackImage}
                  alt="Silvara socks after real wear next to work gear"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* 4. Product mechanism */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="relative w-full">
            <div className="relative aspect-[4/3] bg-[#e2d4c3]">
              <Image
                src="/silvaraknitfacts.png"
                alt="Silvara knit fabric with silver fiber for odor control"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="max-w-[14ch] break-words font-heading text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
              Control odor in the sock.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#5c514a] sm:text-lg">
              Silvara uses silver-infused yarn to help control odor where it
              develops, inside the fabric against your foot. It does not rely on
              added fragrance or another shoe spray.
            </p>
            <ul className="mt-8 grid gap-3">
              {MECHANISM.map((item) => (
                <li
                  key={item.title}
                  className="rounded-none bg-white/70 px-5 py-4"
                >
                  <h3 className="text-base font-extrabold uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-base text-[#5c514a]">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Field plate — 2×2 use graphics */}
      {gallerySlots.length > 0 ? (
        <section className="relative overflow-hidden bg-[#e7dccd] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#21130e]/15"
            aria-hidden
          />
          <div className="mx-auto grid max-w-[1160px] items-end gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold tracking-[0.22em] text-[#8a5a3a] uppercase">
                01 — Field use
              </p>
              <h2 className="mt-3 font-heading text-[clamp(1.85rem,3.8vw,3rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.035em]">
                Built for
                <br />
                real days.
              </h2>
              <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-[#5c514a]">
                Same thin crew. Different day.
              </p>
              <ol className="mt-6 hidden space-y-2 text-[0.7rem] font-bold tracking-[0.18em] text-[#21130e]/55 uppercase lg:block">
                {[
                  ["01", "Shift"],
                  ["02", "Train"],
                  ["03", "Travel"],
                  ["04", "Black / White"],
                ].map(([n, label]) => (
                  <li key={n} className="flex items-center gap-3">
                    <span className="tabular-nums text-[#b84a2d]">{n}</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative mx-auto w-full max-w-none sm:max-w-[36rem] lg:max-w-none">
              {/* Outer registration frame */}
              <div className="relative p-3 sm:p-5">
                {/* Corner brackets */}
                <span
                  aria-hidden
                  className="absolute top-0 left-0 h-4 w-4 border-t border-l border-[#21130e]/55 sm:h-5 sm:w-5"
                />
                <span
                  aria-hidden
                  className="absolute top-0 right-0 h-4 w-4 border-t border-r border-[#21130e]/55 sm:h-5 sm:w-5"
                />
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-[#21130e]/55 sm:h-5 sm:w-5"
                />
                <span
                  aria-hidden
                  className="absolute right-0 bottom-0 h-4 w-4 border-r border-b border-[#21130e]/55 sm:h-5 sm:w-5"
                />

                <div className="relative">
                  <div className="grid grid-cols-2 gap-px bg-[#21130e]/30 shadow-[0_24px_60px_rgba(33,19,14,0.14)]">
                    {gallerySlots.map((slot, i) => {
                      if (!isFilled(slot.src)) {
                        return (
                          <div
                            key={slot.id}
                            className="flex aspect-square items-center justify-center bg-[#f6efe4] px-3 text-center text-xs text-[#6a5228]"
                          >
                            Photo slot: {slot.alt}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={slot.id}
                          className="group relative aspect-square overflow-hidden bg-[#d9cbb8]"
                        >
                          <Image
                            src={slot.src}
                            alt={slot.alt}
                            fill
                            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 40vw, 28vw"
                            className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                          />
                          <span className="absolute top-2 left-2 text-[0.6rem] font-bold tracking-[0.16em] text-[#21130e]/35 tabular-nums uppercase mix-blend-multiply sm:top-2.5 sm:left-2.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Crosshair extending past the plate */}
                  <div
                    className="pointer-events-none absolute -inset-3 z-10 sm:-inset-5"
                    aria-hidden
                  >
                    <span className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#21130e]/50" />
                    <span className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-[#21130e]/50" />
                    <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#21130e]/65 bg-[#e7dccd]" />
                    <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b84a2d]" />
                  </div>
                </div>
              </div>

              <p className="mt-1 flex justify-between px-1 text-[0.6rem] font-bold tracking-[0.16em] text-[#21130e]/40 uppercase sm:text-[0.65rem]">
                <span>Silvara field plate</span>
                <span className="tabular-nums">4 / 4</span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* 6. Product details + fit */}
      {detailRows.length > 0 || preview ? (
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-[860px]">
            <h2 className="font-heading text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              Product details
            </h2>
            {preview && !isFilled(ODOR_PRODUCT.shoeSizeRange) ? (
              <div className="mt-4">
                <PreviewBanner>
                  [CONFIRM SHOE SIZE RANGE] — fit row hidden in production until
                  set in odor-product-data.ts
                </PreviewBanner>
              </div>
            ) : null}
            {preview && !isFilled(ODOR_PRODUCT.materialComposition) ? (
              <div className="mt-3">
                <PreviewBanner>
                  [CONFIRM MATERIAL COMPOSITION] — material row hidden in
                  production until set
                </PreviewBanner>
              </div>
            ) : null}
            <dl className="mt-6">
              {detailRows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* 7. Customer evidence */}
      {showReviews ? (
        <section
          id="odor-reviews"
          className="scroll-mt-24 bg-[#fffaf2] px-4 py-14 sm:px-6 sm:py-20 lg:px-10"
        >
          <div className="mx-auto max-w-[1160px]">
            <h2 className="font-heading text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              {ODOR_PRODUCT.reviews.length > 0
                ? "Field notes from real wearers"
                : "Customer evidence"}
            </h2>
            {ODOR_PRODUCT.reviewsArePlaceholders ? (
              <p className="mt-3 text-sm text-[#8a6a3a]">
                Sample reviews for layout — replace with real customer quotes
                before launch.
              </p>
            ) : null}
            {ODOR_PRODUCT.reviews.length === 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-none border border-dashed border-[#21130e]/20 bg-[#f6efe4] p-5"
                  >
                    <p className="text-sm font-semibold text-[#6a5228]">
                      [CUSTOMER REVIEW PLACEHOLDER]
                    </p>
                    <p className="mt-3 text-base text-[#5c514a]">
                      Real customer review will appear here.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
                {ODOR_PRODUCT.reviews.map((review) => (
                  <figure
                    key={`${review.name}-${review.date ?? review.quote.slice(0, 24)}`}
                    className="flex gap-4 overflow-hidden rounded-none bg-[#f6efe4] p-4 md:block md:p-0"
                  >
                    {review.photoSrc ? (
                      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-none bg-[#e2d4c3] sm:w-32 md:w-full md:rounded-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={review.photoSrc}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover object-center"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 md:p-5">
                      {typeof review.rating === "number" ? (
                        <p
                          className="text-sm font-semibold tracking-wide text-[#b84a2d]"
                          aria-label={`${review.rating} out of 5`}
                        >
                          {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                          <span className="text-[#21130e]/20">
                            {"★".repeat(
                              Math.max(0, 5 - Math.min(5, review.rating)),
                            )}
                          </span>
                        </p>
                      ) : null}
                      <blockquote className="mt-2 text-[0.95rem] leading-relaxed text-[#21130e] md:mt-3 md:text-base">
                        “{review.quote}”
                      </blockquote>
                      <figcaption className="mt-3 text-sm leading-snug text-[#5c514a] md:mt-4">
                        <span className="font-semibold text-[#21130e]">
                          {review.name}
                        </span>
                        {review.useCase ? ` · ${review.useCase}` : null}
                        {review.shoeSize ? ` · ${review.shoeSize}` : null}
                        {review.giftedProduct ? (
                          <span className="mt-1 block text-xs">
                            Product gifted for feedback
                          </span>
                        ) : null}
                        {review.verifiedBuyer ? (
                          <span className="mt-1 block text-xs">
                            Verified buyer
                          </span>
                        ) : null}
                      </figcaption>
                    </div>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 8. Guarantee */}
      {showGuarantee ? (
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-[860px] overflow-hidden rounded-none bg-[#21130e] px-5 py-10 text-white sm:px-10">
            <p className="text-sm font-bold tracking-[0.16em] text-[#e68161] uppercase">
              First Pair Guarantee
            </p>
            {ODOR_PRODUCT.guaranteeEnabled &&
            isFilled(ODOR_PRODUCT.guaranteeTerms) ? (
              <>
                <h2 className="mt-3 min-w-0 max-w-full break-words font-heading text-[clamp(1.65rem,6.2vw,3rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.045em]">
                  Try it with
                  <br />
                  confidence.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
                  {ODOR_PRODUCT.guaranteeTerms}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-white/60">
                  <li>30 days from delivery</li>
                  <li>Product refund only — original shipping is not refunded</li>
                  <li>You pay return shipping for the two unworn pairs</li>
                </ul>
                <Link
                  href={withSiteRegion(region, "/contact?topic=first-pair-guarantee")}
                  className="mt-7 inline-flex min-h-12 items-center justify-center rounded-none bg-[#e68161] px-6 text-sm font-extrabold uppercase tracking-wide text-[#21130e] hover:bg-[#f0906f]"
                >
                  Start a guarantee request
                </Link>
              </>
            ) : (
              <div className="mt-5 rounded-none border border-dashed border-[#e68161]/50 bg-white/5 px-4 py-3 text-sm text-[#f0c9b0]">
                First Pair Guarantee terms must be approved. [INSERT APPROVED
                GUARANTEE TERMS]
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 9. Final purchase */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-[1160px] overflow-hidden rounded-none bg-[#b84a2d] text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center">
          <div className="min-w-0 p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-bold tracking-[0.16em] text-white/60 uppercase">
              Ready for tomorrow
            </p>
            <h2 className="mt-3 max-w-[14ch] break-words font-heading text-[clamp(2.2rem,4.2vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
              Try the Silvara 3-pack.
            </h2>
            <p className="mt-5 max-w-md text-base text-white/75 sm:text-lg">
              Three pairs. Black Marl or White Marl. Free US shipping.
            </p>
          </div>
          <div className="min-w-0 bg-[#fffaf2] p-5 text-[#21130e] sm:p-8">
            <OdorBuyStrip
              id="odor-final-offer"
              priceLabel={priceLabel}
              sockColor={sockColor}
              setSockColor={setSockColor}
              placement="final"
              showTitle={false}
            />
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <div ref={faqSentinelRef}>
        <OdorFaq />
      </div>

      {/* 11. Footer */}
      <footer className="bg-[#21130e] px-4 py-12 text-[#f6efe4] sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-heading text-2xl font-extrabold uppercase">
              SILVARA
            </p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
              Thin silver-infused crew socks for long shifts in closed shoes.
            </p>
            {isFilled(ODOR_PRODUCT.contactEmail) ? (
              <a
                href={`mailto:${ODOR_PRODUCT.contactEmail}`}
                className="mt-4 inline-block text-sm font-semibold text-[#e68161] underline-offset-2 hover:underline"
              >
                {ODOR_PRODUCT.contactEmail}
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {ODOR_PRODUCT.socialLinks
              .filter((l) => isFilled(l.href))
              .map((link) => (
                <a
                  key={link.label}
                  href={link.href!}
                  className="text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            <p className="pt-2 text-xs text-white/45">
              © {new Date().getFullYear()} SILVARA
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile purchase bar — uses shared buy-now flow; no duplicate checkout logic */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-[#21130e]/10 bg-[#fffaf2]/96 p-3 shadow-[0_-8px_40px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform duration-300 md:hidden",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold tabular-nums text-[#21130e]">
              {priceLabel}
            </p>
            <p className="truncate text-sm text-[#5c514a]">
              {SOCK_COLOR_LABEL[sockColor]}
            </p>
          </div>
          <AddToCartButton
            id={ODOR_PRODUCT.bundleId}
            sockSize={DEFAULT_SOCK_SIZE}
            sockColor={sockColor}
            label="Try the 3-pack"
            flow="buy-now"
            onAdd={() => {
              posthog.capture("odor_sticky_cta_clicked", {
                region,
                bundle_id: ODOR_PRODUCT.bundleId,
                sock_color: sockColor,
              });
            }}
            className="!h-12 !min-w-[9.5rem] !w-auto shrink-0 !rounded-none !border-0 !bg-[#b84a2d] !px-4 !text-xs !text-white !shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
