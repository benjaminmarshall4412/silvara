"use client";

import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { BundleId } from "@/lib/products";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";
import { cn } from "@/lib/utils";

type Props = {
  id: BundleId;
  /** Selected crew size from the product page (defaults if omitted). */
  sockSize?: SockSize;
  /** Selected colorway (defaults if omitted). */
  sockColor?: SockColor;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
};

export function AddToCartButton({
  id,
  sockSize = DEFAULT_SOCK_SIZE,
  sockColor = DEFAULT_SOCK_COLOR,
  label = "Add to cart",
  className,
  variant = "primary",
}: Props) {
  const { add } = useCart();

  return (
    <Button
      type="button"
      variant={variant === "outline" ? "outline" : "default"}
      size="lg"
      className={cn(
        "h-12 w-full rounded-none border-2 font-heading text-sm font-extrabold uppercase tracking-wide md:h-14 md:text-base",
        variant === "primary" &&
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/90",
        variant === "outline" &&
          "border-foreground bg-background hover:bg-muted",
        className,
      )}
      onClick={() => {
        add(id, 1, sockSize, sockColor);
        posthog.capture("product_added_to_cart", {
          bundle_id: id,
          label,
          sock_size: sockSize,
          sock_color: sockColor,
        });
      }}
    >
      {label}
    </Button>
  );
}
