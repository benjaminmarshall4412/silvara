import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics admin · SILVARA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
