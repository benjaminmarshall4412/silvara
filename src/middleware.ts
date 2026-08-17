import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { SiteRegion } from "@/lib/site-region";
import {
  SITE_REGION_COOKIE,
  DEFAULT_SITE_REGION,
  validateSiteRegionParam,
  isSiteRegion,
} from "@/lib/site-region";

function inferRegion(req: NextRequest): SiteRegion {
  const fromCookie = req.cookies.get(SITE_REGION_COOKIE)?.value ?? "";
  const cookieRegion = validateSiteRegionParam(fromCookie);
  if (cookieRegion) return cookieRegion;

  const cc = req.headers.get("x-vercel-ip-country");
  if (cc === "GB") return "uk";

  return DEFAULT_SITE_REGION;
}

function withRegionCookie(response: NextResponse, region: SiteRegion) {
  response.cookies.set(SITE_REGION_COOKIE, region, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

function regionalOdorPath(pathname: string, region: SiteRegion): string {
  if (pathname === "/odor" || pathname.startsWith("/odor/")) {
    const rest = pathname.slice("/odor".length);
    return region === "uk" ? `/odour${rest}` : pathname;
  }
  if (pathname === "/odour" || pathname.startsWith("/odour/")) {
    const rest = pathname.slice("/odour".length);
    return region === "uk" ? pathname : `/odor${rest}`;
  }
  return pathname;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (isSiteRegion(first)) {
    if (first === "uk" && segments[1] === "odor") {
      const url = req.nextUrl.clone();
      url.pathname = `/uk/odour${segments.length > 2 ? `/${segments.slice(2).join("/")}` : ""}`;
      return withRegionCookie(NextResponse.redirect(url), "uk");
    }
    return withRegionCookie(NextResponse.next(), first);
  }

  if (pathname === "/") {
    const region = inferRegion(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${region}`;
    const res = NextResponse.redirect(url);
    return withRegionCookie(res, region);
  }

  /** Legacy URLs without regional prefix → default inferred region (still bookmarkable via /us/... or /uk/...). */
  if (
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/product" ||
    pathname.startsWith("/product/") ||
    pathname === "/gift" ||
    pathname.startsWith("/gift/") ||
    pathname === "/odor" ||
    pathname.startsWith("/odor/") ||
    pathname === "/odour" ||
    pathname.startsWith("/odour/") ||
    pathname === "/contact" ||
    pathname.startsWith("/contact/")
  ) {
    const region = inferRegion(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${region}${regionalOdorPath(pathname, region)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/webpack-hmr).*)",
  ],
};
