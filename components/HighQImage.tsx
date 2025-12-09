import * as React from "react";
import NextImage, { ImageProps } from "next/image";

type Props = Omit<ImageProps, "quality"> & {
  /** Override default quality (85) if needed */
  quality?: number;
  /** Heuristic: make above-the-fold images high priority */
  aboveTheFold?: boolean;
};

/**
 * Drop-in wrapper for next/image with sane high-quality defaults:
 * - AVIF/WEBP via Next config
 * - quality=85
 * - sensible sizes if not provided
 * - auto priority for above-the-fold
 */
export default function HighQImage({
  quality = 85,
  sizes,
  aboveTheFold,
  priority,
  loading,
  ...rest
}: Props) {
  const finalPriority = priority ?? Boolean(aboveTheFold);
  const finalLoading = finalPriority ? "eager" : (loading ?? "lazy");
  const finalSizes =
    sizes ??
    // Full width on mobile, constrained container on larger screens
    "(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 1200px";

  return (
    <NextImage
      quality={quality}
      sizes={finalSizes}
      priority={finalPriority}
      loading={finalLoading}
      {...rest}
    />
  );
}
