// components/media/CoverFrame.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type Aspect = "book" | "square" | "wide";

export interface CoverFrameProps {
  src: string;
  alt: string;
  aspect?: Aspect;
  className?: string;          // extra classes on outer wrapper
}

function getAspectPadding(aspect: Aspect): string {
  switch (aspect) {
    case "square":
      return "pb-[100%]";      // 1:1
    case "wide":
      return "pb-[56.25%]";    // 16:9
    case "book":
    default:
      return "pb-[150%]";      // 2:3 portrait
  }
}

/**
 * Standardised frame for ALL big cover images on the site.
 * Keeps them elegant, centred, and non-monstrous.
 */
export function CoverFrame({
  src,
  alt,
  aspect = "book",
  className,
}: CoverFrameProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[520px]",
        "rounded-2xl border border-[rgba(214,178,106,0.6)] bg-black/40",
        "shadow-[0_18px_40px_rgba(0,0,0,0.7)] overflow-hidden",
        className
      )}
    >
      <div className={clsx("relative w-full", getAspectPadding(aspect))}>
        {/* Next/Image uses its own wrapper span – we pin that span */}
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-contain"
        />
      </div>
    </div>
  );
}