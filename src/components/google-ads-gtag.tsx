import Script from "next/script";

import { envPublic } from "@/lib/env.public";

/** Global Google Ads tag — loads on all pages when `NEXT_PUBLIC_GOOGLE_ADS_ID` is set. */
export function GoogleAdsGtag() {
  const id = envPublic.googleAdsId.trim();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
