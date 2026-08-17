import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OdorLanding } from "@/components/odor/odor-landing";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = validateSiteRegionParam((await params).region);
  if (region === "uk") {
    return {
      title: "SILVARA — Your socks smell. Let us fix it.",
      description:
        "Thin low-calf socks with silver fibre in the yarn. Eliminates odour in the sock. 1 pair or 3 pairs. Free shipping on 3.",
      openGraph: {
        title: "Your socks smell. Let us fix it.",
        description:
          "Thin silver-infused low-calf socks for work boots and long days. Eliminates odour. 1 pair or 3 pairs.",
        images: ["/black1pair-1.png"],
      },
    };
  }
  return {
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
}

export default async function OdourPage({ params }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();
  if (region === "us") redirect("/us/odor");

  return <OdorLanding />;
}
