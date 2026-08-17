import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/sections/site-footer";
import { ODOR_PRODUCT } from "@/lib/odor-product-data";
import { odorLandingPath, validateSiteRegionParam, withSiteRegion } from "@/lib/site-region";

type Props = {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ topic?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Contact SILVARA",
  description:
    "Contact SILVARA for First Pair Guarantee requests, order help, or questions.",
};

export default async function ContactPage({ params, searchParams }: Props) {
  const region = validateSiteRegionParam((await params).region);
  if (!region) notFound();

  const topicRaw = (await searchParams).topic;
  const topicValue = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw;
  const defaultTopic =
    topicValue === "order-help" || topicValue === "other"
      ? topicValue
      : "first-pair-guarantee";

  return (
    <div className="min-h-screen bg-[#f6efe4] text-[#21130e]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b84a2d]">
          Contact
        </p>
        <h1 className="mt-3 font-heading text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          How can we help?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#5c514a] sm:text-lg">
          First Pair Guarantee, order questions, or anything else — send a
          message and we’ll reply by email.
        </p>

        {ODOR_PRODUCT.guaranteeEnabled ? (
          <div className="mt-8 rounded-none bg-[#21130e] px-5 py-5 text-white sm:px-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#e68161]">
              First Pair Guarantee
            </p>
            <p className="mt-2 text-base leading-relaxed text-white/75">
              {ODOR_PRODUCT.guaranteeTerms}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <ContactForm defaultTopic={defaultTopic} />
        </div>

        <Link
          href={withSiteRegion(region, odorLandingPath(region))}
          className="mt-8 inline-block text-sm font-semibold text-[#5c514a] underline-offset-2 hover:underline"
        >
          ← Back to Silvara
        </Link>
      </div>
      <SiteFooter region={region} />
    </div>
  );
}
