export type GiftAngle = "hard-to-shop" | "long-shift" | "odor";

export type GiftHeroCopy = {
  eyebrow: string;
  headline: string;
  subheadline: string;
};

export const GIFT_ANGLES: Record<GiftAngle, GiftHeroCopy> = {
  "hard-to-shop": {
    eyebrow: "3-pair gift set",
    headline: "A gift he’ll actually wear.",
    subheadline:
      "Thin silver low-calf socks for long shifts and work boots—useful every week, not another drawer item.",
  },
  "long-shift": {
    eyebrow: "3-pair gift set",
    headline: "Built for the long day.",
    subheadline:
      "Three pairs of thin silver low-calf socks for boots, hard floors, and shifts that run long.",
  },
  odor: {
    eyebrow: "3-pair gift set",
    headline: "Silver yarn. Not perfume.",
    subheadline:
      "Three pairs of thin low-calf socks that help manage odor in the fabric—no scent cover-up.",
  },
};

export function parseGiftAngle(raw: string | string[] | undefined): GiftAngle {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "long-shift" || value === "odor" || value === "hard-to-shop") {
    return value;
  }
  return "hard-to-shop";
}
