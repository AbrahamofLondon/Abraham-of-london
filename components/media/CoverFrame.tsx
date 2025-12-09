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
 * MUCH smaller aspect ratios
 */
function getAspectPadding(aspect: CoverAspect): string {
  switch (aspect) {
    case "square":
      return "pb-[100%]"; // 1:1
    case "wide":
      return "pb-[56.25%]"; // 16:9
    case "book":
    default:
      return "pb-[140%]"; // Reduced from 150%
  }
}

/**
 * Simplified frame - no more giant covers
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
        "relative w-full overflow-hidden",
        "rounded-md border border-[#D6B26A]/50",
        "bg-black/30 shadow-lg",
        className
      )}
    >
      <div className={clsx("relative w-full", getAspectPadding(aspect))}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 192px, 224px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
