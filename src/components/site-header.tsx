"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import {
  getConversionLandingKind,
  isCheckoutPath,
} from "@/lib/conversion-landing-paths";
import { useSiteRegion } from "@/lib/site-region-context";
import { odorLandingPath, withSiteRegion } from "@/lib/site-region";
import { cn } from "@/lib/utils";

const navKeys = [
  { href: "/blog", label: "Read" },
  { href: "#failure-mode", label: "Why" },
  { href: "#shop", label: "Shop" },
  { href: "#system", label: "Notes" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const conversionLanding = getConversionLandingKind(pathname);
  const isConversionLanding = conversionLanding !== null;
  const isOdorLanding = conversionLanding === "odor";
  const isCheckout = isCheckoutPath(pathname);
  /** Nav links and the cart button are exits once payment is on screen. */
  const minimalHeader = isConversionLanding || isCheckout;
  const { itemCount, setOpenCart } = useCart();
  const region = useSiteRegion();
  const nav = navKeys.map((n) => ({
    ...n,
    href: n.href.startsWith("/")
      ? withSiteRegion(region, n.href)
      : withSiteRegion(region, `/${n.href}`),
  }));

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        isOdorLanding
          ? "border-b border-white/10 bg-[#21130e] text-white"
          : "border-b-4 border-foreground bg-background",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 px-4 py-3 md:px-6",
          isOdorLanding ? "max-w-[1240px] lg:px-10" : "max-w-6xl",
        )}
      >
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href={withSiteRegion(
              region,
              conversionLanding === "odor"
                ? odorLandingPath(region)
                : conversionLanding
                  ? `/${conversionLanding}`
                  : "/",
            )}
            className="inline-flex items-center"
            aria-label="SILVARA"
          >
            <Image
              src="/silvera_logo_black_page-0001__1_-removebg-preview.png"
              alt="SILVARA"
              width={180}
              height={32}
              priority
              className={cn(
                "h-6 w-auto md:h-8",
                isOdorLanding && "brightness-0 invert",
              )}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          {conversionLanding === "gift" ? (
            <span className="font-mono-label hidden truncate text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline md:text-xs">
              Gift set
            </span>
          ) : null}
        </div>
          {minimalHeader ? null : (
            <nav
              className="hidden max-w-xl flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 md:flex"
              aria-label="Primary"
            >
              {nav.map((n) => (
                <Link
                  key={`${n.label}-${n.href}`}
                  href={n.href}
                  className="font-mono-label text-xs font-medium uppercase tracking-widest text-foreground hover:text-accent"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
          {minimalHeader ? <div className="flex-1" /> : null}
        <div className="flex items-center gap-2">
          {isCheckout ? (
            <span className="font-mono-label text-xs uppercase tracking-wider text-muted-foreground">
              Secure checkout
            </span>
          ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "font-mono-label text-xs uppercase tracking-wider",
              isOdorLanding
                ? "rounded-none border border-white/25 bg-white/5 text-white hover:bg-white/10"
                : "rounded-none border-2 border-foreground",
            )}
            onClick={() => setOpenCart(true)}
          >
            Cart
            <span
              className={cn(
                "ml-2 inline-flex min-w-6 items-center justify-center px-1 text-[0.65rem] font-bold",
                isOdorLanding
                  ? "bg-[#b84a2d] text-white"
                  : "border-2 border-foreground bg-accent text-accent-foreground",
                itemCount === 0 &&
                  (isOdorLanding
                    ? "bg-white/10 text-white/50"
                    : "bg-muted text-muted-foreground"),
              )}
            >
              {itemCount}
            </span>
          </Button>
          )}
        </div>
      </div>
    </header>
  );
}
