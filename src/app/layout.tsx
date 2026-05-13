import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Syne } from "next/font/google";

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
  title: "SILVARA — Silver thin crew work socks",
  description:
    "Thin crew socks with silver in the yarn—boots, long shifts. 1, 3, 6 pairs or 3/month subscribed. Bacteria on the fiber, not perfume.",
  icons: {
    icon: "/silvarafavicon.jpg",
    shortcut: "/silvarafavicon.jpg",
    apple: "/silvarafavicon.jpg",
  },
  openGraph: {
    title: "SILVARA — Silver thin crew work socks",
    description: "Work-boot thin crews—packs or 3 pairs/month. Not a perfume mask.",
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
