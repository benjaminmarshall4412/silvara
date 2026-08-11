import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Syne } from "next/font/google";

import { GoogleAdsGtag } from "@/components/google-ads-gtag";
import { MetaPixel } from "@/components/meta-pixel";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.silvara.org"),
  title: "SILVARA — Silver thin low-calf work socks",
  description:
    "Thin low-calf socks with silver in the yarn—boots, long shifts. 1, 3, 6 pairs or 3/month subscribed. Bacteria on the fiber, not perfume.",
  icons: {
    icon: "/silvarafavicon.jpg",
    shortcut: "/silvarafavicon.jpg",
    apple: "/silvarafavicon.jpg",
  },
  openGraph: {
    title: "SILVARA — Silver thin low-calf work socks",
    description: "Work-boot thin low-calf socks—packs or 3 pairs/month. Not a perfume mask.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${syne.variable} ${spaceGrotesk.variable} ${ibmMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GoogleAdsGtag />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
