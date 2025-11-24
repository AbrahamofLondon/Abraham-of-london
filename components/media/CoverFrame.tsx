// components/media/CoverFrame.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

export type CoverAspect = "book" | "square" | "wide";

export interface CoverFrameProps {
  src: string;
  alt: string;
  aspect?: CoverAspect;
  className?: string;
  priority?: boolean;
}

/**
 * Reduced padding-bottom values for more reasonable cover sizes
 */
function getAspectPadding(aspect: CoverAspect): string {
  switch (aspect) {
    case "square":
      return "pb-[100%]"; // 1:1
    case "wide":
      return "pb-[56.25%]"; // 16:9
    case "book":
    default:
      return "pb-[133%]"; // Slightly shorter than 2:3 for better proportion
  }
}

/**
 * Shared frame for all large cover images with improved sizing
 */
export function CoverFrame({
  src,
  alt,
  aspect = "book",
  className,
  priority = false,
}: CoverFrameProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full",
        "rounded-lg border border-[rgba(214,178,106,0.6)] bg-black/40",
        "shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden",
        className,
      )}
    >
      <div className={clsx("relative w-full", getAspectPadding(aspect))}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 90vw, (max-width: 1024px) 256px, 288px"
          className="object-contain"
        />
      </div>
    </div>
  );
}