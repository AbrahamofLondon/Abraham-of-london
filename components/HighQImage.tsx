import * as React from "react";
import NextImage, { ImageProps } from "next/image";
import { shouldUnoptimizeImage } from "@/lib/image-resolver";

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
 * - Automatic unoptimized handling for local images
 */
export default function HighQImage({
  quality = 85,
  sizes,
  aboveTheFold,
  priority,
  loading,
  src,
  ...rest
}: Props) {
  const finalPriority = priority ?? Boolean(aboveTheFold);
  const finalLoading = finalPriority ? "eager" : (loading ?? "lazy");
  const finalSizes =
    sizes ??
    // Full width on mobile, constrained container on larger screens
    "(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 1200px";
  
  // Determine if image should be unoptimized based on src
  const unoptimized = typeof src === 'string' ? shouldUnoptimizeImage(src) : false;

  return (
    <NextImage
      quality={quality}
      sizes={finalSizes}
      priority={finalPriority}
      loading={finalLoading}
      unoptimized={unoptimized}
      src={src}
      {...rest}
    />
  );
}

