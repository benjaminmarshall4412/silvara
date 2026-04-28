import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Syne } from "next/font/google";

import { CartDrawer } from "@/components/cart-drawer";
import { PaletteLab } from "@/components/palette-lab";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/lib/cart-context";

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
  title: "SILVARA — Socks for long shifts & work boots",
  description:
    "Thin crew socks with silver-infused yarn for trades, warehouse, retail floors, and anyone on their feet all day. Bundles and rotation resupply. Bacteria-driven odor control—not perfume.",
  icons: {
    icon: "/silvarafavicon.jpg",
    shortcut: "/silvarafavicon.jpg",
    apple: "/silvarafavicon.jpg",
  },
  openGraph: {
    title: "SILVARA — Socks for long shifts & work boots",
    description:
      "Silver-infused socks for work boots and hard floors—odor bacteria on the fiber, not a cosmetic cover-up.",
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
      className={`${syne.variable} ${spaceGrotesk.variable} ${ibmMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <CartDrawer />
          {process.env.NEXT_PUBLIC_PALETTE_LAB !== "0" ? <PaletteLab /> : null}
        </CartProvider>
      </body>
    </html>
  );
}
