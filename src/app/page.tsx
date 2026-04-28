import { FailureMode } from "@/components/sections/failure-mode";
import { LoadoutChecklist } from "@/components/sections/loadout-checklist";
import { Pricing } from "@/components/sections/pricing";
import { Scenarios } from "@/components/sections/scenarios";
import { SiteFooter } from "@/components/sections/site-footer";
import { SystemVsSession } from "@/components/sections/system-vs-session";
import { VsStandard } from "@/components/sections/vs-standard";

export default function Home() {
  return (
    <>
      <Pricing />
      <SystemVsSession />
      <LoadoutChecklist />
      <FailureMode />
      <Scenarios />
      <VsStandard />
      <SiteFooter />
    </>
  );
}
