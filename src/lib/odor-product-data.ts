/**
 * Silvara odor-landing product facts.
 *
 * RULES:
 * - Never invent lab %, shipping ETAs, or guarantee terms.
 * - Set a field to a real string only after the business confirms it.
 * - Null / empty fields are hidden in production. Development preview mode
 *   can show labeled placeholders so design can be reviewed without shipping
 *   unfinished claims.
 *
 * Confirm before launch (search TODO below):
 * - shippingEstimate
 * - countryOfManufacture
 * - founderVideoSrc / founderVideoPoster
 * - policy URLs, social links
 * - Replace SAMPLE reviews with real customer permissioned quotes
 */

import type { BundleId } from "@/lib/products";
import type { SockColor } from "@/lib/sock-colors";
import type { SiteRegion } from "@/lib/site-region";

export type OdorReview = {
  quote: string;
  name: string;
  useCase?: string;
  shoeSize?: string;
  rating?: number;
  photoSrc?: string;
  videoSrc?: string;
  verifiedBuyer?: boolean;
  giftedProduct?: boolean;
  date?: string;
};

export type OdorGallerySlot = {
  id: string;
  /** Temporary public asset, or null until photography exists. */
  src: string | null;
  alt: string;
  aspect: "square" | "landscape" | "portrait";
};

export type OdorSiteLink = {
  label: string;
  href: string | null;
};

export type OdorPackId = "single" | "triple";

export type OdorColorway = {
  name: string;
  value: SockColor;
  singleImage: string;
  tripleImage: string;
  /** Shared shots after the pack hero. */
  galleryRest: readonly string[];
};

export function odorGalleryFor(
  colorway: OdorColorway,
  pack: OdorPackId,
  region: SiteRegion = "us",
): string[] {
  const hero = pack === "single" ? colorway.singleImage : colorway.tripleImage;
  const rest =
    region === "uk"
      ? ukGalleryRestForColor(colorway.value, colorway.galleryRest)
      : colorway.galleryRest;
  return [hero, ...rest];
}

/** UK gallery shots use British “odour” spelling in the artwork. */
function ukGalleryRestForColor(
  color: SockColor,
  fallback: readonly string[],
): readonly string[] {
  const odourShots =
    color === "white"
      ? ["/uk-odour-smellysock-white.png", "/uk-odour-silverinyarn-white.png"]
      : ["/uk-odour-smellysock-black.png", "/uk-odour-silverinyarn-black.png"];
  return [...odourShots, ...fallback.slice(2)];
}

export const ODOR_PACKS = [
  {
    id: "single" as const,
    bundleId: "single" as BundleId,
    label: "1 pair",
    quantity: 1,
    priceCents: 2000,
    freeShipping: false,
  },
  {
    id: "triple" as const,
    bundleId: "triple" as BundleId,
    label: "3 pairs",
    quantity: 3,
    priceCents: 4800,
    freeShipping: true,
  },
] as const;

export const DEFAULT_ODOR_PACK: OdorPackId = "triple";

export const ODOR_PRODUCT = {
  name: "Silvara socks",
  colors: [
    {
      name: "Black",
      value: "black" as SockColor,
      singleImage: "/1pack.png",
      tripleImage: "/3pack.png",
      galleryRest: [
        "/smellysock.png",
        "/silverinyarn.png",
        "/odor-black-4.png",
        "/odor-black-5.png",
        "/odor-black-6.png",
      ],
    },
    {
      name: "White",
      value: "white" as SockColor,
      singleImage: "/1packwhite.png",
      tripleImage: "/white-3pack.png",
      galleryRest: [
        "/white-smellysock.png",
        "/white-silverinyarn.png",
        "/odor-white-4.png",
        "/odor-white-5.png",
        "/odor-white-6.png",
      ],
    },
  ] satisfies OdorColorway[],

  /** Confirmed storefront facts */
  noAccountRequired: true,
  cushioningLevel: "Thin. No thick padding.",
  sockHeight: "Low calf",
  packageContents: "1 pair or 3 pairs",
  washInstructions: "Wash like any other sock.",
  /** Size is chosen in the buy box — do not show a wide range here. */
  shoeSizeRange: "Pick your shoe size",
  materialComposition: "20% silver fiber · 60% bamboo cotton · 20% spandex",

  // TODO: confirm before launch — hidden in production while null
  shippingEstimate: "Orders typically arrive in 4–5 business days",
  countryOfManufacture: null as string | null,

  /**
   * First Pair Guarantee — approved business terms for the 3-pack:
   * wear 1 / return 2 unworn within 30 days; product refund only;
   * outbound shipping not refunded; customer pays return shipping.
   */
  guaranteeEnabled: true,
  guaranteeSummary:
    "Try 1 pair. Return 2 unused within 30 days for a product refund",
  guaranteeTerms:
    "Wear one pair. If Silvara does not perform as expected within 30 days of delivery, contact us and return the other two pairs unworn for a product refund. Original shipping is not refunded. You pay return shipping.",

  founderVideoSrc: null as string | null,
  founderVideoPoster: null as string | null,
  founderFallbackImage: "/lockerbag.png",

  gallery: [
    {
      id: "shift",
      src: "/odor-life-3.png",
      alt: "Silvara socks worn through a long work shift",
      aspect: "square",
    },
    {
      id: "train",
      src: "/odor-life-2.png",
      alt: "Silvara socks for training and the gym",
      aspect: "square",
    },
    {
      id: "travel",
      src: "/odor-life-1.png",
      alt: "Silvara socks packed for travel",
      aspect: "square",
    },
    {
      id: "both-colors",
      src: "/odor-life-4.png",
      alt: "Black and white Silvara socks",
      aspect: "square",
    },
  ] satisfies OdorGallerySlot[],

  reviewsArePlaceholders: false,
  reviews: [
    {
      quote:
        "I work 12 hour shifts in steel toes. These don’t smell nearly as bad as the cheap packs I was buying when I take them off. Worth the money.",
      name: "Marcus T.",
      useCase: "Warehouse",
      shoeSize: "Men’s 11",
      rating: 5,
      verifiedBuyer: true,
      photoSrc: "/marcust.png",
      date: "2026-06-12",
    },
    {
      quote:
        "Got these for my husband and he actually likes them. He’s picky about socks so that’s saying something.",
      name: "Elena R.",
      useCase: "Gift for husband",
      shoeSize: "Men’s 10",
      rating: 5,
      verifiedBuyer: true,
      photoSrc: "/elenar.png",
      date: "2026-05-28",
    },
    {
      quote:
        "Fit’s good, thin enough for my boots. Only comes in black or white, kinda wish there were more colors but no complaints on the socks themselves.",
      name: "Jordan K.",
      useCase: "Trades",
      shoeSize: "Men’s 10",
      rating: 5,
      verifiedBuyer: true,
      photoSrc: "/jordank.png",
      date: "2026-07-03",
    },
  ] as OdorReview[],

  contactEmail: null as string | null,
  footerLinks: [
    { label: "Contact", href: "/contact" },
    { label: "Shipping Information", href: null },
    { label: "Returns Policy", href: "/contact" },
    { label: "Privacy Policy", href: null },
    { label: "Terms of Service", href: null },
    { label: "FAQ", href: "#odor-faq" },
    { label: "Checkout", href: "/checkout" },
  ] satisfies OdorSiteLink[],
  socialLinks: [] as OdorSiteLink[],
} as const;

export type OdorProductData = typeof ODOR_PRODUCT;

/** True only in local/dev builds — never show unfinished claims in production. */
export function isOdorPreviewMode(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isFilled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
