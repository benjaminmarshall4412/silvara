import type { BundleId } from "@/lib/products";

export type ProductSpecRow = { label: string; value: string };

export type ProductGalleryImage = {
  src: string;
  alt: string;
};

/** When set, product page shows color label + thumbnail gallery (client). */
export type ProductColorVariant = {
  id: string;
  label: string;
  images: ProductGalleryImage[];
};

export type ProductDetailContent = {
  heroImage: string;
  heroAlt: string;
  highlights: string[];
  specs: ProductSpecRow[];
  /** Short factual paragraphs below specs */
  details: string[];
  /** Optional colorways with multiple product shots (e.g. black marl pack). */
  colorVariants?: ProductColorVariant[];
};

/**
 * Studio shots are single-pair framing; yarn and spec match 3- and 6-packs on the line.
 */
function blackWhiteMarlGalleries(packName: string): ProductColorVariant[] {
  const nshots = [1, 2, 3, 4, 5] as const;
  return [
    {
      id: "black",
      label: "Black",
      images: nshots.map((n) => ({
        src: `/black1pair-${n}.png`,
        alt: `SILVARA ${packName} black marl thin crew — product photo ${n}`,
      })),
    },
    {
      id: "white",
      label: "White",
      images: nshots.map((n) => ({
        src: `/white1pair-${n}.png`,
        alt: `SILVARA ${packName} white marl thin crew — product photo ${n}`,
      })),
    },
  ];
}

export const PRODUCT_DETAIL_CONTENT: Record<BundleId, ProductDetailContent> = {
  single: {
    heroImage: "/black1pair-1.png",
    heroAlt:
      "SILVARA single pair — black or white marl thin crew sock for work boots",
    colorVariants: blackWhiteMarlGalleries("single pair"),
    highlights: [
      "Silver-infused yarn — odor bacteria on the fiber, not a perfume cover-up",
      "Thin crew height — boot-friendly toe box and calf",
      "Built for long shifts, hard floors, and laundry you can keep up with",
    ],
    specs: [
      { label: "Contents", value: "1 pair" },
      { label: "Style", value: "Thin crew" },
      { label: "Yarn", value: "Silver-infused blend (see care tag)" },
      { label: "Best for", value: "Trial fit, first wash cycle, toe-box check" },
      { label: "Care", value: "Machine wash cold · tumble low · no bleach" },
    ],
    details: [
      "Use the single pair to confirm fit and feel in your actual work boots before you stock a full rotation. Same construction as multi-packs — just one pair so you are not guessing on sizing.",
    ],
  },
  triple: {
    heroImage: "/black1pair-1.png",
    heroAlt:
      "SILVARA 3-pack — black or white marl thin crew socks, workweek rotation",
    colorVariants: blackWhiteMarlGalleries("3-pack"),
    highlights: [
      "Enough pairs to rotate a full workweek without re-wearing damp socks",
      "Same silver yarn system as the rest of the line — shift-grade, not lounge-grade",
      "Primary loadout for trades, warehouse, and retail floors",
    ],
    specs: [
      { label: "Contents", value: "3 pairs" },
      { label: "Style", value: "Thin crew" },
      { label: "Yarn", value: "Silver-infused blend (see care tag)" },
      { label: "Best for", value: "5-day rotation · main workweek kit" },
      { label: "Care", value: "Machine wash cold · tumble low · no bleach" },
    ],
    details: [
      "The 3-pack is the practical minimum if you want a clean pair each workday and a buffer for wash day. Pairs are identical to the single and 6-pack — only the bundle size changes.",
    ],
  },
  six: {
    heroImage: "/black1pair-1.png",
    heroAlt:
      "SILVARA 6-pack — black or white marl thin crew socks, best per-shift value",
    colorVariants: blackWhiteMarlGalleries("6-pack"),
    highlights: [
      "Best per-pair value in the line for people who live in their boots",
      "Overtime, six-day weeks, or two people splitting laundry day",
      "Same spec as 3-pack — more pairs on the shelf when you need them",
    ],
    specs: [
      { label: "Contents", value: "6 pairs" },
      { label: "Style", value: "Thin crew" },
      { label: "Yarn", value: "Silver-infused blend (see care tag)" },
      { label: "Best for", value: "Heavy rotation · overtime · two-person households" },
      { label: "Care", value: "Machine wash cold · tumble low · no bleach" },
    ],
    details: [
      "If you already know your size and wash cadence, the 6-pack keeps you out of the “whatever was dry” trap. Stock once and run a predictable rotation.",
    ],
  },
  rotation: {
    heroImage: "/shipping.jpg",
    heroAlt: "SILVARA fresh rotation — scheduled resupply shipment",
    highlights: [
      "Same thin crew as packs—subscription is delivery only",
      "3 pairs/month · pause in Stripe before the next bill",
      "Silver yarn vs bacteria on the fiber—not perfume",
    ],
    specs: [
      { label: "Contents", value: "3 pairs per shipment" },
      { label: "Cadence", value: "Monthly (Stripe portal)" },
      { label: "Style", value: "Thin crew" },
      { label: "Yarn", value: "Silver-infused blend (see care tag)" },
      { label: "Care", value: "Machine wash cold · tumble low · no bleach" },
    ],
    details: [
      "Same sock as 1-, 3-, and 6-pair bundles—3 pairs per monthly bill. Manage it in Stripe after checkout.",
    ],
  },
};
