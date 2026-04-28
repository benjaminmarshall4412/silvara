"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

const nav = [
  { href: "#system", label: "Workweek" },
  { href: "#loadout", label: "Kit" },
  { href: "#failure-mode", label: "Why smell" },
  { href: "#loadouts", label: "Shop" },
  { href: "#rotation", label: "Rotation" },
] as const;

export function SiteHeader() {
  const { itemCount, setOpenCart } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b-4 border-foreground bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center"
          aria-label="SILVARA home"
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
        <nav
          className="hidden max-w-xl flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 md:flex"
          aria-label="Primary"
        >
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="font-mono-label text-xs font-medium uppercase tracking-widest text-foreground hover:text-accent"
            >
              {n.label}
            </a>
          ))}
        </nav>
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
