"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { PRODUCT_DETAIL_CONTENT } from "@/lib/product-detail-content";
import type { SockColor } from "@/lib/sock-colors";
import { cn } from "@/lib/utils";

type Props = {
  sockColor: SockColor;
  onColorChange?: (color: SockColor) => void;
  /** Hide color toggles when purchase block already has them. */
  showColorToggles?: boolean;
  className?: string;
  priority?: boolean;
};

const variants = PRODUCT_DETAIL_CONTENT.triple.colorVariants ?? [];

export function GiftProductGallery({
  sockColor,
  onColorChange,
  showColorToggles = false,
  className,
  priority = false,
}: Props) {
  const colorIdx = Math.max(
    0,
    variants.findIndex((v) => v.id === sockColor),
  );
  const images = variants[colorIdx]?.images ?? [];
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setImgIdx(0);
  }, [sockColor]);

  const current = images[imgIdx] ?? images[0];
  if (!current) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-[4/5] overflow-hidden border-4 border-foreground bg-muted md:aspect-[5/6]">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-transform duration-500 ease-out"
        />
      </div>

      {showColorToggles && onColorChange ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
            Color
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onColorChange(v.id as SockColor)}
                className={cn(
                  "cursor-pointer border-2 px-3 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-widest transition-colors",
                  v.id === sockColor
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/30 bg-background text-foreground hover:border-foreground/60",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setImgIdx(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden border-2 transition-colors sm:h-20 sm:w-20",
                i === imgIdx
                  ? "border-foreground"
                  : "border-foreground/20 hover:border-foreground/50",
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === imgIdx}
            >
              <Image
                src={img.src}
                alt=""
                fill
                className="pointer-events-none object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
