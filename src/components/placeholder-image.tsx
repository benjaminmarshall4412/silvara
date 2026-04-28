import Image from "next/image";

import { cn } from "@/lib/utils";

/** Matches placehold.co palette to site theme (navy field, coral label). */
const BG = "1a2744";
const FG = "ff6b35";

type PlaceholderImageProps = {
  label: string;
  className?: string;
  priority?: boolean;
  alt?: string;
  sizes?: string;
  /** Cover parent; parent must be `position: relative` with defined size. */
  fill?: boolean;
  /** Intrinsic size for `placehold.co` URL (and for layout when not fill). */
  width?: number;
  height?: number;
};

export function PlaceholderImage({
  label,
  className,
  priority,
  alt,
  sizes,
  fill = false,
  width = 800,
  height = 600,
}: PlaceholderImageProps) {
  const text = encodeURIComponent(label);
  const src = `https://placehold.co/${width}x${height}/${BG}/${FG}?text=${text}`;
  const resolvedSizes =
    sizes ?? (fill ? "100vw" : "(max-width: 768px) 100vw, 50vw");

  const baseClass = cn(
    "border-4 border-foreground bg-muted object-cover",
    className,
  );

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt ?? `${label} placeholder`}
        fill
        sizes={resolvedSizes}
        priority={priority}
        className={baseClass}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? `${label} placeholder`}
      width={width}
      height={height}
      sizes={resolvedSizes}
      priority={priority}
      className={baseClass}
    />
  );
}
