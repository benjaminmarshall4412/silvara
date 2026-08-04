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
    q: "What should I expect?",
    a: "Silvara is designed to help keep worn socks fresher through long days in closed shoes. Clean feet, clean shoes, and rotating a fresh pair each day give you the best result.",
  },
  {
    id: "eliminate",
    q: "Will Silvara eliminate all odor?",
    a: "No sock can guarantee zero odor in every situation. Silvara is designed to help reduce odor buildup in the fabric. Results depend on activity, footwear, temperature and how long the socks are worn.",
  },
  {
    id: "thick",
    q: "Are the socks thick?",
    a: "Silvara is a thin crew sock without bulky cushioning. It is designed for everyday shoes and work boots.",
  },
  {
    id: "sizes",
    q: "What shoe sizes do they fit?",
    a: ODOR_PRODUCT.shoeSizeRange,
  },
  {
    id: "material",
    q: "What are they made from?",
    a: "20% silver fiber, 60% bamboo cotton, and 20% spandex.",
  },
  {
    id: "silver",
    q: "How does the silver-infused yarn work?",
    a: "Silvara uses silver-infused yarn to help control odor where it develops, inside the fabric against your foot. It does not rely on added fragrance or another shoe spray.",
  },
  {
    id: "wash-out",
    q: "Does the silver wash out?",
    a: "No. The silver is woven into the yarn, so it does not wash out.",
  },
  {
    id: "wash",
    q: "How should I wash them?",
    a: ODOR_PRODUCT.washInstructions,
  },
  {
    id: "ship",
    q: "How quickly will my order arrive?",
    a: ODOR_PRODUCT.shippingEstimate,
  },
  {
    id: "guarantee",
    q: "How does the First Pair Guarantee work?",
    a: ODOR_PRODUCT.guaranteeEnabled
      ? "Wear one pair. If Silvara does not perform as expected within 30 days of delivery, contact us through the site form and return the other two pairs unworn for a product refund. Original shipping is not refunded, and you pay return shipping."
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
        <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          Questions before you buy
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
