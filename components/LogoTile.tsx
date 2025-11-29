"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type LogoTileProps = {
  /** Local (recommended) or allowed remote URL */
  src: string;
  alt: string;
  /** Square size in px for the tile (container + image render size) */
  size?: number;
  /** When provided, wraps the logo in a link */
  href?: string;
  /** Pass true for above-the-fold logos */
  priority?: boolean;
  /** "contain" (default) keeps full logo visible; "cover" fills the tile */
  fit?: "contain" | "cover";
  /** Next/Image quality 1–100 (default 85) */
  quality?: number;
  className?: string;
  /** Custom fallback (must be a local /public path) */
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/assets/images/default-brand.svg"; // ensure this exists in /public

export default function LogoTile({
  src,
  alt,
  size = 140,
  href,
  priority = false,
  fit = "contain",
  quality = 85,
  className = "",
  fallbackSrc = DEFAULT_FALLBACK,
}: LogoTileProps) {
  const [actualSrc, setActualSrc] = React.useState(src);

  const Img = (
    <div
      className={`relative mx-auto overflow-hidden rounded-xl ring-1 ring-black/5 bg-white ${className}`}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      <Image
        src={actualSrc}
        alt={alt}
        fill
        sizes={`${size}px`}
        quality={quality}
        priority={priority}
        className={fit === "cover" ? "object-cover" : "object-contain"}
        onError={() => {
          if (actualSrc !== fallbackSrc) setActualSrc(fallbackSrc);
        }}
      />
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="inline-block"
      prefetch={false}
      aria-label={alt}
    >
      {Img}
    </Link>
  ) : (
    Img
  );
}
