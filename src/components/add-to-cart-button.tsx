"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { BundleId } from "@/lib/products";
import { getProduct } from "@/lib/products";
import { trackMetaEvent } from "@/lib/meta/track-client";
import { withSiteRegion } from "@/lib/site-region";
import { useSiteRegion } from "@/lib/site-region-context";
import {
  DEFAULT_SOCK_COLOR,
  type SockColor,
} from "@/lib/sock-colors";
import { DEFAULT_SOCK_SIZE } from "@/lib/sock-sizes";
import type { SockSize } from "@/lib/sock-sizes";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
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
  /** "buy-now" skips the cart drawer and goes straight to checkout. */
  flow?: "cart" | "buy-now";
  onAdd?: () => void;
};

export function AddToCartButton({
  id,
  sockSize = DEFAULT_SOCK_SIZE,
  sockColor = DEFAULT_SOCK_COLOR,
  label = "Add to cart",
  className,
  variant = "primary",
  flow = "cart",
  onAdd,
}: Props) {
  const { add } = useCart();
  const router = useRouter();
  const region = useSiteRegion();
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const product = getProduct(id);
  const unitCents = unitAmountCentsByBundle[id] ?? product?.priceCents ?? 0;
  const buyNow = flow === "buy-now";

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
        onAdd?.();
        add(id, 1, sockSize, sockColor, { openDrawer: !buyNow });
        posthog.capture("product_added_to_cart", {
          bundle_id: id,
          label,
          sock_size: sockSize,
          sock_color: sockColor,
          flow,
        });
        if (buyNow) {
          posthog.capture("checkout_started", {
            bundle_id: id,
            flow,
            region,
          });
          // Buy-now goes straight to checkout — fire InitiateCheckout here.
          // Checkout page skips a second IC when this flag is set.
          try {
            sessionStorage.setItem("silvara_meta_ic_sent", "1");
          } catch {
            /* private mode / blocked storage */
          }
          void trackMetaEvent({
            eventName: "InitiateCheckout",
            customData: {
              content_ids: [id],
              content_type: "product",
              content_name: product?.name,
              value: unitCents / 100,
              currency: currency.toUpperCase(),
              num_items: 1,
            },
          });
          router.push(withSiteRegion(region, "/checkout"));
        } else {
          void trackMetaEvent({
            eventName: "AddToCart",
            customData: {
              content_ids: [id],
              content_type: "product",
              content_name: product?.name,
              value: unitCents / 100,
              currency: currency.toUpperCase(),
              num_items: 1,
            },
          });
        }
      }}
    >
      {label}
    </Button>
  );
}
