import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailPanel } from "@/components/product-detail-panel";
import { PRODUCT_DETAIL_CONTENT } from "@/lib/product-detail-content";
import {
  BUNDLE_IDS,
  getProduct,
  isBundleId,
} from "@/lib/products";
import { SITE_REGIONS, validateSiteRegionParam, withSiteRegion } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string; bundleId: string }>;
};

export function generateStaticParams() {
  return SITE_REGIONS.flatMap((region) =>
    BUNDLE_IDS.map((bundleId) => ({ region, bundleId })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: rawRegion, bundleId: rawId } = await params;
  const region = validateSiteRegionParam(rawRegion);
  if (!region || !isBundleId(rawId)) return {};
  const p = getProduct(rawId);
  if (!p) return {};
  return {
    title: `${p.name} · SILVARA`,
    description: p.description,
    openGraph: {
      title: `${p.name} · SILVARA`,
      description: p.description,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { region: rawRegion, bundleId: rawId } = await params;
  const region = validateSiteRegionParam(rawRegion);
  if (!region) notFound();
  if (!isBundleId(rawId)) notFound();

  const p = getProduct(rawId);
  const detail = PRODUCT_DETAIL_CONTENT[rawId];
  if (!p || !detail) notFound();

  const shop = withSiteRegion(region, "/#loadouts");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <nav className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
        <Link href={shop} className="hover:text-foreground">
          Shop
        </Link>
        <span className="mx-2 text-foreground/40">/</span>
        <span className="text-foreground">{p.shortName}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden border-4 border-foreground bg-muted">
            <Image
              src={detail.heroImage}
              alt={detail.heroAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
            />
          </div>
        </div>

        <ProductDetailPanel bundleId={rawId} />
      </div>

      <section className="mt-14 border-t-4 border-foreground pt-10 md:mt-16 md:pt-12">
        <h2 className="font-heading text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
          Highlights
        </h2>
        <ul className="mt-4 space-y-3 text-base leading-relaxed text-foreground/90 md:text-lg">
          {detail.highlights.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 bg-accent" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 md:mt-14">
        <h2 className="font-heading text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
          Specifications
        </h2>
        <dl className="mt-4 border-4 border-foreground">
          {detail.specs.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 gap-1 border-b-2 border-foreground px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4 md:px-5 md:py-4 ${
                i === detail.specs.length - 1 ? "border-b-0" : ""
              }`}
            >
              <dt className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm leading-snug md:text-base">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 space-y-4 text-base leading-relaxed text-foreground/90 md:mt-12 md:text-lg">
        {detail.details.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>
    </div>
  );
}
