import type { SiteRegion } from "@/lib/site-region";
import { isSiteRegion } from "@/lib/site-region";

export function parseSignupRegion(raw: unknown): SiteRegion | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  return isSiteRegion(v) ? v : null;
}

/** Keep pathname aligned with the validated region prefix; cap length for DB. */
export function sanitizeSignupPathname(raw: unknown, region: SiteRegion): string {
  const prefix = `/${region}`;
  if (typeof raw !== "string") return prefix;
  let s = raw.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (s.length === 0) return prefix;
  if (!s.startsWith("/")) s = `/${s}`;
  if (s.length > 1024) s = s.slice(0, 1024);
  if (s === prefix || s.startsWith(`${prefix}/`)) return s;
  return prefix;
}
