import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OdorLanding } from "@/components/odor/odor-landing";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
};

export const metadata: Metadata = {
  title: "SILVARA — Your socks smell. Let us fix it.",
  description:
    "Thin low-calf socks with silver fiber in the yarn. Eliminates odor in the sock. 1 pair or 3 pairs. Free shipping on 3.",
  openGraph: {
    title: "Your socks smell. Let us fix it.",
    description:
      "Thin silver-infused low-calf socks for work boots and long days. Eliminates odor. 1 pair or 3 pairs.",
    images: ["/black1pair-1.png"],
  },
};

export default async function OdorPage({ params }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  return <OdorLanding />;
}
