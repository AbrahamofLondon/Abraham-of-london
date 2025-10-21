// components/EmbossedSign.tsx
import * as React from "react";
import Image from "next/image";

type EmbossedSignProps = {
  src: string; // Path to the SVG file (logo or signature)
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** 'emboss' (raised) or 'deboss' (pressed in) */
  effect?: "emboss" | "deboss";
  /** Base color for the effect (e.g., '#0b2e1f' for your forest color) */
  baseColor?: string;
};

export default function EmbossedSign({
  src,
  alt,
  className,
  width = 150,
  height = 30,
  effect = "emboss",
  baseColor = "var(--color-primary, #0b2e1f)",
}: EmbossedSignProps) {
  const isEmboss = effect === "emboss";
  const shadowStyle = {
    filter: isEmboss
      ? `drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.4)) drop-shadow(-1px -1px 0 rgba(0, 0, 0, 0.2))`
      : `drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.2)) drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.4))`,
    // Applied to SVG via `fill-current` (if the SVG uses currentColor)
    color: baseColor,
  } as React.CSSProperties;

  return (
    <div className={className} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full fill-current"
        style={shadowStyle}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
