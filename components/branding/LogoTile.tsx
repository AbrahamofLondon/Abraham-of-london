// components/branding/LogoTile.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

export type LogoTileProps = {
  src: string;
  alt: string;
  /** Max logo height in px (applied inline). Defaults to 40. */
  size?: number;
  /** If true, hides alt text (purely decorative). */
  decorative?: boolean;
  className?: string;
};

export default function LogoTile({
  src,
  alt,
  size = 40,
  decorative = false,
  className,
}: LogoTileProps) {
  const maxH = Math.max(24, Math.min(96, size));

  return (
    <div
      className={clsx(
        "group flex items-center justify-center rounded-xl border border-white/10",
        "bg-white/[0.02] px-6 py-5 transition-all",
        "hover:border-amber-500/30 hover:bg-white/[0.04]",
        className
      )}
    >
      <Image
        src={src}
        alt={decorative ? "" : alt}
        aria-hidden={decorative ? true : undefined}
        width={240}
        height={120}
        sizes="240px"
        className={clsx(
          "w-auto object-contain",
          "opacity-70 grayscale transition-all duration-300",
          "group-hover:opacity-100 group-hover:grayscale-0"
        )}
        style={{ maxHeight: maxH }}
        priority={false}
      />
    </div>
  );
}
