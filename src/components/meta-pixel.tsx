import Script from "next/script";

import type { SiteRegion } from "@/lib/site-region";

/** Hardcoded storefront pixels — one Facebook Ads account per region. */
const META_PIXEL_IDS = {
  us: "1402048504697789",
  uk: "1595476105693549",
} as const satisfies Record<SiteRegion, string>;

/** Meta Pixel base code — fires PageView on storefront pages. */
export function MetaPixel({ region }: { region: SiteRegion }) {
  const id = META_PIXEL_IDS[region];

  return (
    <>
      <Script id={`meta-pixel-${region}`} strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          window.fbq('init', '${id}');
          window.fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
