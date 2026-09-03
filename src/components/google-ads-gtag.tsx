import Script from "next/script";

import { getGoogleAdsIdForRegion } from "@/lib/env.public";
import type { SiteRegion } from "@/lib/site-region";

/** Google Ads tag for the current storefront region. */
export function GoogleAdsGtag({ region }: { region: SiteRegion }) {
  const id = getGoogleAdsIdForRegion(region);
  if (!id) return null;

  return (
    <>
      {/* Stub must exist before React conversion events, or they are dropped. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}`,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id={`google-ads-gtag-init-${region}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { allow_enhanced_conversions: true });
        `}
      </Script>
    </>
  );
}
