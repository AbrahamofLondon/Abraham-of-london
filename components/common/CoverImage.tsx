import Image from "next/image";
import clsx from "clsx";
import React from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Uniform 16:9 cover renderer for all cards.
 * - next/image (fill) + object-cover
 * - sensible default sizes for responsive lists
 * - rounded, overflow-safe container
 * - no-op if src missing
 */
export default function CoverImage({
  src,
  alt,
  className,
  priority,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw",
}: Props) {
  if (!src) return null;
  return (
    <div className={clsx("relative w-full aspect-[16/9] overflow-hidden rounded-xl", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}