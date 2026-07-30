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
  title: "SILVARA 3-Pack Gift Set — Thin silver crew socks",
  description:
    "Three pairs of thin silver-infused crew socks for long shifts and work boots. Free shipping. Black or white. One size.",
  openGraph: {
    title: "SILVARA 3-Pack Gift Set",
    description:
      "A useful gift for long shifts—thin silver crew socks with free shipping.",
  },
};

export default async function GiftPage({ params, searchParams }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  const { angle: angleRaw } = await searchParams;
  const angle = parseGiftAngle(angleRaw);

  return <GiftLanding angle={angle} />;
}
