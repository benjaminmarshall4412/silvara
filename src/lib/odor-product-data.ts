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

import type { SockColor } from "@/lib/sock-colors";

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

export const ODOR_PRODUCT = {
  name: "Silvara socks · 3 pairs",
  bundleId: "triple" as const,
  priceCents: 4800,
  unitPriceCents: 1600,
  quantity: 3,
  colors: [
    {
      name: "Black",
      value: "black" as SockColor,
      image: "/3pack.png",
      gallery: [
        "/3pack.png", // 3-pack hero
        "/smellysock.png", // normal vs Silvara odor comparison
        "/silverinyarn.png", // silver in the yarn
        "/odor-black-4.png", // up to 4 days
        "/odor-black-5.png", // wear like normal socks
        "/odor-black-6.png", // try 1 / return 2
      ],
    },
    {
      name: "White",
      value: "white" as SockColor,
      image: "/white-pdp-4.png",
      gallery: [
        "/white-pdp-4.png",
        "/white-pdp-1.png",
        "/white-pdp-2.png",
        "/white-pdp-5.png",
        "/white-pdp-3.png",
      ],
    },
  ],

  /** Confirmed storefront facts */
  freeShippingOnThisOffer: true,
  noAccountRequired: true,
  cushioningLevel: "Thin. No thick padding.",
  sockHeight: "Low calf",
  packageContents: "3 pairs of socks",
  washInstructions: "Wash like any other sock.",
  shoeSizeRange: "US men’s 7–13 · women’s 5–10",
  materialComposition: "20% silver fiber · 60% bamboo cotton · 20% spandex",

  // TODO: confirm before launch — hidden in production while null
  shippingEstimate: "Orders typically arrive in 4–5 business days",
  countryOfManufacture: null as string | null,

  /**
   * First Pair Guarantee — approved business terms:
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
      alt: "Black Marl and White Marl Silvara socks",
      aspect: "square",
    },
  ] satisfies OdorGallerySlot[],

  /**
   * SAMPLE ONLY — fake reviews for layout preview.
   * Set reviewsArePlaceholders to false and replace with real quotes
   * (with permission) before treating these as customer evidence.
   */
  reviewsArePlaceholders: true,
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
