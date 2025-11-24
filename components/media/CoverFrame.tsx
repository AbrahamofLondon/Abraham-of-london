// components/media/CoverFrame.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

export type CoverAspect = "book" | "wide" | "square";
export type CoverFit = "cover" | "contain";

export interface CoverFrameProps {
  src?: string | null;
  alt?: string;
  aspect?: CoverAspect;
  fit?: CoverFit;
}

/**
 * Normalises a local/remote src into something Next/Image can use.
 */
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const clean = src.replace(/^\/+/, "");
  return `/${clean}`;
}

function getHeightClasses(aspect: CoverAspect): string {
  switch (aspect) {
    case "square":
      return "h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]";
    case "wide":
      return "h-[200px] sm:h-[230px] md:h-[260px] lg:h-[300px]";
    case "book":
    default:
      // Portrait / book style, but capped.
      return "h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]";
  }
}

/**
 * A single, opinionated frame for book / article / download covers.
 * Any place that wants a “big cover” should go through this, so the
 * site never gets random skyscraper images again.
 */
export function CoverFrame({
  src,
  alt,
  aspect = "book",
  fit = "cover",
}: CoverFrameProps): JSX.Element | null {
  const imgSrc =
    normalizeLocal(src) ?? "/assets/images/writing-desk.webp";

  if (!imgSrc) return null;

  const frameClasses = clsx(
    "aol-cover-frame",
    "relative overflow-hidden rounded-2xl",
    "border border-softGold/30 bg-black/40",
    "shadow-soft-elevated",
    "mx-auto w-full max-w-[360px] md:max-w-[420px]",
    getHeightClasses(aspect),
  );

  const imgClasses = clsx(
    "h-full w-full",
    fit === "contain" ? "object-contain" : "object-cover",
  );

  return (
    <div className={frameClasses}>
      <Image
        src={imgSrc}
        alt={alt || "Cover image"}
        fill
        sizes="(max-width: 768px) 70vw, 420px"
        className={imgClasses}
        priority={false}
      />
    </div>
  );
}