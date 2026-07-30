import { notFound } from "next/navigation";

import { FailureMode } from "@/components/sections/failure-mode";
import { Pricing } from "@/components/sections/pricing";
import { Scenarios } from "@/components/sections/scenarios";
import { SiteFooter } from "@/components/sections/site-footer";
import { SystemVsSession } from "@/components/sections/system-vs-session";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
};

export default async function Home({ params }: Props) {
  const r = validateSiteRegionParam((await params).region);
  if (!r) notFound();

  return (
    <>
      <Pricing />
      <FailureMode />
      <Scenarios />
      <SystemVsSession region={r} />
      <SiteFooter region={r} />
    </>
  );
}
