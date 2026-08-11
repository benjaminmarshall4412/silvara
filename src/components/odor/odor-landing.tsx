"use client";

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
    title: "Silver in the yarn",
    body: "Eliminates odor in the sock. Not a perfume sprayed on top.",
  },
  {
    title: "Thin, not bulky",
    body: "Fits normal shoes and work boots. No thick padding.",
  },
  {
    title: "No fake smell",
    body: "Nothing scented. Just the sock doing its job.",
  },
] as const;

const NO_EFFORT = [
  "No sprays",
  "No powders",
  "No scent balls",
  "Just wear them",
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
      label: "Shoe size",
      value: ODOR_PRODUCT.shoeSizeRange,
    },
    { label: "Sock height", value: ODOR_PRODUCT.sockHeight },
    {
      label: "Material",
      value: ODOR_PRODUCT.materialComposition,
    },
    { label: "Thickness", value: ODOR_PRODUCT.cushioningLevel },
    {
      label: "Colors",
      value: "Black · White",
    },
    { label: "What’s included", value: ODOR_PRODUCT.packageContents },
    { label: "Maintenance", value: ODOR_PRODUCT.washInstructions },
    {
      label: "Made in",
      value: ODOR_PRODUCT.countryOfManufacture,
    },
  ].filter((row): row is { label: string; value: string } =>
    isFilled(row.value),
  );

  // Fake/sample reviews stay in dev only — monkey brain smells fakes in prod.
  const showReviews =
    (ODOR_PRODUCT.reviews.length > 0 &&
      !ODOR_PRODUCT.reviewsArePlaceholders) ||
    (preview && ODOR_PRODUCT.reviews.length > 0);
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
        content_name: "SILVARA 3-Pack",
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
      {/* 1. Problem + result */}
      <section className="relative isolate overflow-hidden bg-[#21130e] text-white">
        <div
          className="pointer-events-none absolute -top-64 right-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#b84a2d]/30 blur-[120px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
          <h1 className="max-w-[16ch] break-words font-sans text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
            Your socks smell after work.
          </h1>
          <p className="mt-5 max-w-[32rem] text-base font-semibold leading-relaxed text-white sm:text-lg">
            Silvara gets rid of odor, so your feet don’t stink.
          </p>
        </div>
      </section>

      {/* 2. Buy */}
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

      {/* 3. Without effort */}
      <section className="border-y border-[#21130e]/10 bg-[#fffaf2] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto max-w-[1160px]">
          <p className="text-sm font-bold tracking-[0.16em] text-[#b84a2d] uppercase">
            Easy
          </p>
          <h2 className="mt-2 max-w-[16ch] break-words font-sans text-[clamp(1.85rem,3.8vw,2.8rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
            Wear them like normal socks.
          </h2>
          <p className="mt-3 max-w-xl text-base text-[#5c514a] sm:text-lg">
            No sprays. No powders. No scent balls. Just put them on and go.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NO_EFFORT.map((item) => (
              <li
                key={item}
                className="border border-[#21130e]/15 bg-[#f6efe4] px-4 py-4 text-sm font-extrabold uppercase tracking-wide text-[#21130e]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Unique */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-[720px]">
          <p className="text-sm font-bold tracking-[0.16em] text-[#b84a2d] uppercase">
            What’s different
          </p>
          <h2 className="mt-2 max-w-[14ch] break-words font-sans text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
            Silver is in the sock.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#5c514a] sm:text-lg">
            Most socks just get smelly. Sprays hide the smell for a bit. Silvara
            has silver fiber in the yarn. It eliminates odor in the sock.
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
      </section>

      {/* Founder video — keep code, hide until ready */}
      {false && (
        <section className="bg-[#dfe7d6] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto grid max-w-[1160px] gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[0.16em] text-[#4b613d] uppercase">
                The four-day test
              </p>
              <h2 className="mt-3 max-w-[12ch] break-words font-sans text-[clamp(2.2rem,4.2vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
                Why Silvara exists.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#3f4c38] sm:text-lg">
                I wore the same pair for four days to see how far they could go.
                By day four, they still did not smell like a normal worn sock.
                That test is why we launched Silvara.
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
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* 6. Basics */}
      {detailRows.length > 0 || preview ? (
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-[860px]">
            <h2 className="font-sans text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              Size, material, and maintenance
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

      {/* 7. Prove it — real reviews only in production */}
      {showReviews ? (
        <section
          id="odor-reviews"
          className="scroll-mt-24 bg-[#fffaf2] px-4 py-14 sm:px-6 sm:py-20 lg:px-10"
        >
          <div className="mx-auto max-w-[1160px]">
            <h2 className="font-sans text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              How Silvara helped
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
              {ODOR_PRODUCT.reviews.map((review) => (
                <figure
                  key={`${review.name}-${review.date ?? review.quote.slice(0, 24)}`}
                  className="flex gap-4 overflow-hidden rounded-none bg-[#f6efe4] p-4 md:block md:p-0"
                >
                  {review.photoSrc ? (
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden bg-[#e2d4c3] sm:w-32 md:w-full">
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
          </div>
        </section>
      ) : null}

      {/* 8. Guarantee */}
      {showGuarantee ? (
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-[960px] overflow-hidden rounded-none bg-[#21130e] px-5 py-12 text-white sm:px-12 sm:py-16">
            {ODOR_PRODUCT.guaranteeEnabled &&
            isFilled(ODOR_PRODUCT.guaranteeTerms) ? (
              <>
                <p className="text-[0.7rem] font-bold tracking-[0.22em] text-[#e68161] uppercase">
                  Risk free
                </p>
                <h2 className="mt-4 font-sans text-[clamp(3.25rem,14vw,6.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.05em]">
                  <span className="block text-white/35">30-day</span>
                  <span className="block text-[#e68161]">Guarantee.</span>
                </h2>
                <p className="mt-6 max-w-lg text-lg font-semibold leading-snug text-white sm:text-2xl">
                  Try 1 pair. Return 2 unused. Get your sock money back.
                </p>

                <ol className="mt-10 flex flex-col gap-0 border border-white/15 sm:flex-row sm:divide-x sm:divide-white/15">
                  {[
                    ["01", "Wear one pair"],
                    ["02", "Send two back unused"],
                    ["03", "Get your money back"],
                  ].map(([n, label]) => (
                    <li
                      key={n}
                      className="flex items-baseline gap-3 border-b border-white/15 px-4 py-4 last:border-b-0 sm:flex-1 sm:flex-col sm:gap-2 sm:border-b-0 sm:px-5 sm:py-5"
                    >
                      <span className="shrink-0 text-xs font-extrabold tracking-[0.14em] text-[#e68161] tabular-nums">
                        {n}
                      </span>
                      <p className="text-sm font-bold uppercase leading-snug tracking-wide">
                        {label}
                      </p>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/45">
                    30 days from delivery. Sock money only. You pay return
                    shipping.
                  </p>
                  <Link
                    href={withSiteRegion(
                      region,
                      "/contact?topic=first-pair-guarantee",
                    )}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-none bg-[#e68161] px-6 text-sm font-extrabold uppercase tracking-wide text-[#21130e] hover:bg-[#f0906f]"
                  >
                    Start a return
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold tracking-[0.16em] text-[#e68161] uppercase">
                  First Pair Guarantee
                </p>
                <div className="mt-5 rounded-none border border-dashed border-[#e68161]/50 bg-white/5 px-4 py-3 text-sm text-[#f0c9b0]">
                  First Pair Guarantee terms must be approved. [INSERT APPROVED
                  GUARANTEE TERMS]
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      {/* 9. Final buy */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-[1160px] overflow-hidden rounded-none bg-[#b84a2d] text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center">
          <div className="min-w-0 p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-bold tracking-[0.16em] text-white/60 uppercase">
              Ready?
            </p>
            <h2 className="mt-3 max-w-[16ch] break-words font-sans text-[clamp(2.2rem,4.2vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
              Buy three pairs.
            </h2>
            <p className="mt-5 max-w-md text-base text-white/75 sm:text-lg">
              Black or white. Free shipping.
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

      <div ref={faqSentinelRef}>
        <OdorFaq />
      </div>

      <footer className="bg-[#21130e] px-4 py-12 text-[#f6efe4] sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-sans text-2xl font-extrabold uppercase">
              SILVARA
            </p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
              Thin low-calf socks for work boots and long days.
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
            label="Buy 3 pairs"
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
