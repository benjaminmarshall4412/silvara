"use client";

import { useId, useState } from "react";

import {
  ODOR_PRODUCT,
  isFilled,
  isOdorPreviewMode,
} from "@/lib/odor-product-data";
import { cn } from "@/lib/utils";

type FaqItem = {
  id: string;
  q: string;
  a: string | null;
};

const FAQ_SOURCE: FaqItem[] = [
  {
    id: "expect",
    q: "Do these stop sock smell?",
    a: "Yes. Silvara gets rid of odor in the sock, so your feet don’t stink. Clean feet and clean shoes help too.",
  },
  {
    id: "eliminate",
    q: "What if they still smell?",
    a: "Use the First Pair Guarantee. Wear one pair. If you hate them in 30 days, send the other two back unused and get your sock money back.",
  },
  {
    id: "thick",
    q: "Are they thick?",
    a: "No. Thin low-calf socks. They fit normal shoes and work boots.",
  },
  {
    id: "sizes",
    q: "What sizes?",
    a: ODOR_PRODUCT.shoeSizeRange,
  },
  {
    id: "material",
    q: "What are they made of?",
    a: "20% silver fiber, 60% bamboo cotton, and 20% spandex.",
  },
  {
    id: "silver",
    q: "How does the silver work?",
    a: "Silver fiber is in the yarn. It eliminates odor in the sock. No perfume. No spray.",
  },
  {
    id: "wash-out",
    q: "Does the silver wash out?",
    a: "No. It stays in the yarn.",
  },
  {
    id: "wash",
    q: "How do I wash them?",
    a: ODOR_PRODUCT.washInstructions,
  },
  {
    id: "ship",
    q: "How fast do they ship?",
    a: ODOR_PRODUCT.shippingEstimate,
  },
  {
    id: "guarantee",
    q: "How does the guarantee work?",
    a: ODOR_PRODUCT.guaranteeEnabled
      ? "Wear one pair. If you don't like them within 30 days, contact us and send the other two pairs back unused. You get the sock money back. Not shipping. You pay to ship the unused pairs back."
      : null,
  },
];

function visibleFaqs(preview: boolean): FaqItem[] {
  return FAQ_SOURCE.flatMap((item) => {
    if (isFilled(item.a)) return [item];
    if (preview) {
      return [{ ...item, a: `[CONFIRM ANSWER] ${item.q}` }];
    }
    return [];
  });
}

export function OdorFaq() {
  const preview = isOdorPreviewMode();
  const items = visibleFaqs(preview);
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <section id="odor-faq" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-24 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          Questions
        </h2>
        <div className="mt-8 divide-y divide-[#21130e]/15 border-y border-[#21130e]/20">
          {items.map((item) => {
            const panelId = `${baseId}-${item.id}-panel`;
            const buttonId = `${baseId}-${item.id}-button`;
            const open = openId === item.id;
            const unfinished = item.a?.startsWith("[CONFIRM");
            return (
              <div key={item.id} className="py-1">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full cursor-pointer items-start justify-between gap-5 py-4 text-left text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84a2d]"
                  >
                    <span>{item.q}</span>
                    <span aria-hidden className="text-[#b84a2d]">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className={cn(!open && "hidden")}
                >
                  <p
                    className={cn(
                      "pb-5 pr-8 text-base leading-relaxed text-[#5c514a]",
                      unfinished && "italic text-[#8a6a3a]",
                    )}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
