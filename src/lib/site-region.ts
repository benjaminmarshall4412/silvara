export const SITE_REGIONS = ["us", "uk"] as const;

export type SiteRegion = (typeof SITE_REGIONS)[number];

export const SITE_REGION_COOKIE = "silvara_site_region";

export const DEFAULT_SITE_REGION: SiteRegion = "us";

export function isSiteRegion(value: unknown): value is SiteRegion {
  return value === "us" || value === "uk";
}

export function validateSiteRegionParam(value: string): SiteRegion | null {
  return isSiteRegion(value) ? value : null;
}

/**
 * Prefix an internal path with the regional segment (`/blog` → `/us/blog`, `/#x` → `/us#x`).
 */
export function withSiteRegion(region: SiteRegion, path: string): string {
  const hashIdx = path.indexOf("#");
  const pathOnly = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
  const hash = hashIdx >= 0 ? path.slice(hashIdx + 1) : "";

  const base =
    pathOnly === "" || pathOnly === "/"
      ? `/${region}`
      : pathOnly.startsWith("/")
        ? `/${region}${pathOnly}`
        : `/${region}/${pathOnly}`;

  return hash ? `${base}#${hash}` : base;
}
