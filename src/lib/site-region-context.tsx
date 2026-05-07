"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { SiteRegion } from "@/lib/site-region";

const SiteRegionContext = createContext<SiteRegion | null>(null);

export function SiteRegionProvider({
  region,
  children,
}: {
  region: SiteRegion;
  children: ReactNode;
}) {
  return (
    <SiteRegionContext.Provider value={region}>
      {children}
    </SiteRegionContext.Provider>
  );
}

export function useSiteRegion(): SiteRegion {
  const v = useContext(SiteRegionContext);
  if (!v) {
    throw new Error("useSiteRegion must be used inside SiteRegionProvider");
  }
  return v;
}
