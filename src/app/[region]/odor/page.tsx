import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OdorLanding } from "@/components/odor/odor-landing";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
};

export const metadata: Metadata = {
  title: "SILVARA — Long shifts. Less sock odor.",
  description:
    "Thin crew socks with silver fiber woven into the yarn to help control odor in the fabric. Three pairs. Free shipping. No fragrance.",
  openGraph: {
    title: "Long shifts. Less sock odor.",
    description:
      "Thin silver-infused crew socks for long shifts in closed shoes. Three pairs. Free shipping.",
    images: ["/black1pair-1.png"],
  },
};

export default async function OdorPage({ params }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  return <OdorLanding />;
}
