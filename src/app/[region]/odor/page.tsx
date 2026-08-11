import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OdorLanding } from "@/components/odor/odor-landing";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
};

export const metadata: Metadata = {
  title: "SILVARA — Socks that smell less after work",
  description:
    "Thin low-calf socks with silver fiber in the yarn. Eliminates odor in the sock. Buy 3 pairs. Free shipping. No fragrance.",
  openGraph: {
    title: "Socks that smell less after work",
    description:
      "Thin silver-infused low-calf socks for work boots and long days. Eliminates odor. Buy 3 pairs. Free shipping.",
    images: ["/black1pair-1.png"],
  },
};

export default async function OdorPage({ params }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  return <OdorLanding />;
}
