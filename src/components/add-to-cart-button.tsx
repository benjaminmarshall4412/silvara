"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { BundleId } from "@/lib/products";
import { cn } from "@/lib/utils";

type Props = {
  id: BundleId;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
};

export function AddToCartButton({
  id,
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
      onClick={() => add(id, 1)}
    >
      {label}
    </Button>
  );
}
