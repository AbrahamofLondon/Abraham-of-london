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
 * Height via padding-bottom so we get a stable, elegant box
 * without letting the image grow into a billboard.
 */
function getAspectPadding(aspect: CoverAspect): string {
  switch (aspect) {
    case "square":
      return "pb-[100%]"; // 1:1
    case "wide":
      return "pb-[56.25%]"; // 16:9
    case "book":
    default:
      return "pb-[150%]"; // 2:3 portrait
  }
}

/**
 * Shared frame for all large cover images (articles, books etc.)
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
        "mx-auto w-full max-w-[520px]",
        "rounded-2xl border border-[rgba(214,178,106,0.7)] bg-black/40",
        "shadow-[0_18px_40px_rgba(0,0,0,0.75)] overflow-hidden",
        className,
      )}
    >
      <div className={clsx("relative w-full", getAspectPadding(aspect))}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-contain"
        />
      </div>
    </div>
  );
}