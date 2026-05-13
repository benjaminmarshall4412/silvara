"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import type { ProductColorVariant } from "@/lib/product-detail-content";

type Props = {
  variants: ProductColorVariant[];
};

export function ProductMediaGallery({ variants }: Props) {
  const [colorIdx, setColorIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);

  const active = variants[colorIdx];
  const images = active?.images ?? [];
  const current = images[imgIdx];

  const selectColor = useCallback((next: number) => {
    setColorIdx(next);
    setImgIdx(0);
  }, []);

  if (!current) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full cursor-zoom-in overflow-hidden border-4 border-foreground bg-muted">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="pointer-events-none object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority={colorIdx === 0 && imgIdx === 0}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono-label text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
          Color
        </span>
        <div className="flex flex-wrap gap-2">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => selectColor(i)}
              className={`cursor-pointer border-2 px-3 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-widest transition-colors ${
                i === colorIdx
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/30 bg-background text-foreground hover:border-foreground/60"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setImgIdx(i)}
              className={`relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden border-2 transition-colors ${
                i === imgIdx
                  ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "border-foreground/25 hover:border-foreground/50"
              }`}
              aria-label={`View image ${i + 1}`}
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
