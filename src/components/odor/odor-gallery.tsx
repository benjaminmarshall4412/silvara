"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { SOCK_COLOR_LABEL, type SockColor } from "@/lib/sock-colors";
import { cn } from "@/lib/utils";

export function OdorGallery({
  images,
  sockColor,
}: {
  images: readonly string[];
  sockColor: SockColor;
}) {
  const [active, setActive] = useState(0);

  // Reset to the primary shot whenever the colorway changes.
  useEffect(() => {
    setActive(0);
  }, [sockColor]);

  const colorLabel = SOCK_COLOR_LABEL[sockColor];
  const safeIndex = Math.min(active, Math.max(0, images.length - 1));
  const mainSrc = images[safeIndex] ?? images[0];

  if (!mainSrc) return null;

  return (
    <div>
      <div className="overflow-hidden rounded-none bg-[#e7dccd]">
        {/* key forces a remount so the main shot always matches the selected thumb */}
        <Image
          key={mainSrc}
          src={mainSrc}
          alt={`SILVARA ${colorLabel} thin low-calf sock`}
          width={1254}
          height={1254}
          priority={safeIndex === 0}
          unoptimized
          className="aspect-square h-auto w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View ${colorLabel} photo ${i + 1}`}
              aria-current={i === safeIndex}
              className={cn(
                "relative aspect-square cursor-pointer overflow-hidden rounded-none bg-[#e7dccd] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e68161]",
                i === safeIndex
                  ? "ring-2 ring-[#e68161]"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
