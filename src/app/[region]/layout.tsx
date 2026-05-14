import { notFound } from "next/navigation";

import { CartDrawer } from "@/components/cart-drawer";
import { EmailPromoModal } from "@/components/email-promo-modal";
import { PosthogPageEngagement } from "@/components/posthog-page-engagement";
import { ResendCartAbandonTracker } from "@/components/resend-cart-abandon-tracker";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/lib/cart-context";
import { PromoEligibilityProvider } from "@/lib/promo-eligibility-context";
import { StripeCatalogPricesProvider } from "@/lib/stripe-catalog-prices-context";
import { SiteRegionProvider } from "@/lib/site-region-context";
import { validateSiteRegionParam } from "@/lib/site-region";

type Props = {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
};

export default async function RegionLayout({ children, params }: Props) {
  const { region: raw } = await params;
  const region = validateSiteRegionParam(raw);
  if (!region) notFound();

  return (
    <PromoEligibilityProvider region={region}>
      <SiteRegionProvider region={region}>
        <StripeCatalogPricesProvider>
          <CartProvider>
            <PosthogPageEngagement />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <ResendCartAbandonTracker />
            <EmailPromoModal />
          </CartProvider>
        </StripeCatalogPricesProvider>
      </SiteRegionProvider>
    </PromoEligibilityProvider>
  );
}
