// components/EmbossedBrandMark.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type EmbossedMarkProps = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  effect?: "emboss" | "deboss";
  baseColor?: string;
};

export default function EmbossedBrandMark({
  src,
  alt,
  className,
  width,
  height,
  effect = "emboss",
  baseColor = "var(--color-warmWhite, #faf7f2)",
}: EmbossedMarkProps) {
  const isEmboss = effect === "emboss";
  const shadowClasses = isEmboss
    ? "shadow-[1px_1px_1px_rgba(255,255,255,0.7),-1px_-1px_1px_rgba(0,0,0,0.2)]"
    : "shadow-[1px_1px_1px_rgba(0,0,0,0.2),-1px_-1px_1px_rgba(255,255,255,0.7)]";

  return (
    <div
      className={clsx("relative flex items-center justify-center p-2 rounded-lg", shadowClasses, className)}
      style={{ width, height, backgroundColor: baseColor }}
    >
      <Image
        src={src}
        alt={alt}
        width={Math.round(width * 0.8)}
        height={Math.round(height * 0.8)}
        className="object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
