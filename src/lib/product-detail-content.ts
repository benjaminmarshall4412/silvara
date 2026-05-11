import type { BundleId } from "@/lib/products";

export type ProductSpecRow = { label: string; value: string };

export type ProductDetailContent = {
  heroImage: string;
  heroAlt: string;
  highlights: string[];
  specs: ProductSpecRow[];
  /** Short factual paragraphs below specs */
  details: string[];
};

export const PRODUCT_DETAIL_CONTENT: Record<BundleId, ProductDetailContent> = {
  single: {
    heroImage: "/1pair.jpg",
    heroAlt: "SILVARA single pair — thin crew sock for work boots",
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
    heroImage: "/3pair.jpg",
    heroAlt: "SILVARA 3-pack — workweek rotation bundle",
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
    heroImage: "/6pair.jpg",
    heroAlt: "SILVARA 6-pack — best per-shift value",
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
      "Scheduled resupply so you do not run out mid pay-period",
      "3 pairs per shipment — pause or cancel before the next bill",
      "Same product as one-time packs — subscription is for convenience only",
    ],
    specs: [
      { label: "Contents", value: "3 pairs per shipment" },
      { label: "Cadence", value: "Every 2 months (adjust in Stripe customer portal)" },
      { label: "Style", value: "Thin crew" },
      { label: "Yarn", value: "Silver-infused blend (see care tag)" },
      { label: "Care", value: "Machine wash cold · tumble low · no bleach" },
    ],
    details: [
      "Rotation is for people who want the loadout on autopilot. Billing and shipment timing are managed in Stripe’s secure customer flow after checkout.",
    ],
  },
};
