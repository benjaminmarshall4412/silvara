import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GiftLanding } from "@/components/gift/gift-landing";
import { parseGiftAngle } from "@/lib/gift-angles";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ angle?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "SILVARA 3-Pair Gift Set — A gift he’ll actually use",
  description:
    "Three pairs of thin, silver-infused crew socks for the man who works long shifts. Black or white. One size. No subscription.",
  openGraph: {
    title: "SILVARA 3-Pair Gift Set",
    description:
      "A useful gift for husbands, dads, and hard-to-shop-for men who work long days.",
  },
};

export default async function GiftPage({ params, searchParams }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  const { angle: angleRaw } = await searchParams;
  const angle = parseGiftAngle(angleRaw);

  return <GiftLanding angle={angle} />;
}
