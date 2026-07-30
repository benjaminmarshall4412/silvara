"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useSiteRegion } from "@/lib/site-region-context";
import { withSiteRegion } from "@/lib/site-region";
import { cn } from "@/lib/utils";

const navKeys = [
  { href: "/blog", label: "Read" },
  { href: "#failure-mode", label: "Why" },
  { href: "#shop", label: "Shop" },
  { href: "#system", label: "Notes" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isGift = /\/(us|uk)\/gift\/?$/.test(pathname ?? "");
  const { itemCount, setOpenCart } = useCart();
  const region = useSiteRegion();
  const nav = navKeys.map((n) => ({
    ...n,
    href: n.href.startsWith("/")
      ? withSiteRegion(region, n.href)
      : withSiteRegion(region, `/${n.href}`),
  }));

  return (
    <header className="sticky top-0 z-30 border-b-4 border-foreground bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href={withSiteRegion(region, isGift ? "/gift" : "/")}
            className="inline-flex items-center"
            aria-label="SILVARA"
          >
            <Image
              src="/silvera_logo_black_page-0001__1_-removebg-preview.png"
              alt="SILVARA"
              width={180}
              height={32}
              priority
              className="h-7 w-auto md:h-8"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          {isGift ? (
            <span className="font-mono-label truncate text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
              3-Pair Gift Set
            </span>
          ) : null}
        </div>
        {!isGift ? (
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
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none border-2 border-foreground font-mono-label text-xs uppercase tracking-wider"
            onClick={() => setOpenCart(true)}
          >
            Cart
            <span
              className={cn(
                "ml-2 inline-flex min-w-6 items-center justify-center border-2 border-foreground bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground",
                itemCount === 0 && "bg-muted text-muted-foreground",
              )}
            >
              {itemCount}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
