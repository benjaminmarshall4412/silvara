export type GiftAngle = "hard-to-shop" | "long-shift" | "odor";

export type GiftHeroCopy = {
  eyebrow: string;
  headline: string;
  subheadline: string;
};

export const GIFT_ANGLES: Record<GiftAngle, GiftHeroCopy> = {
  "hard-to-shop": {
    eyebrow: "For the man who says he doesn’t need anything",
    headline: "A gift he’ll actually use.",
    subheadline:
      "Three pairs of thin, silver-infused crew socks for long shifts and work boots.",
  },
  "long-shift": {
    eyebrow: "Made for the long days",
    headline: "A gift he’ll use after every shift.",
    subheadline:
      "Three pairs of thin, silver-infused crew socks for work boots and long days on his feet.",
  },
  odor: {
    eyebrow: "The quiet fix for the end of the day",
    headline: "Better socks. Less awkwardness.",
    subheadline:
      "Three pairs of thin, silver-infused crew socks—designed to help manage odor, no perfume.",
  },
};

export function parseGiftAngle(raw: string | string[] | undefined): GiftAngle {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "long-shift" || value === "odor" || value === "hard-to-shop") {
    return value;
  }
  return "hard-to-shop";
}
