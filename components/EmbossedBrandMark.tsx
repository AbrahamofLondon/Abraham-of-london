// components/print/EmbossedBrandMark.tsx
import * as React from "react";
import Image from "next/image";

export type EmbossedBrandMarkProps = {
  /** Path to the SVG/PNG logo */
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** 'emboss' (raised) or 'deboss' (pressed) */
  effect?: "emboss" | "deboss";
  /** Base color for the mark (used via `currentColor`) */
  baseColor?: string;
};

/**
 * Renders a logo/signature with an embossed/debossed look using CSS drop-shadows.
 * Works best with monochrome SVGs that use `fill="currentColor"`.
 */
export default function EmbossedBrandMark({
  src,
  alt,
  className,
  width = 160,
  height = 40,
  effect = "emboss",
  baseColor = "var(--color-primary, #0b2e1f)",
}: EmbossedBrandMarkProps) {
  const isEmboss = effect === "emboss";

  const style: React.CSSProperties = {
    // light from top-left
    filter: isEmboss
      ? "drop-shadow(1px 1px 0 rgba(255,255,255,0.4)) drop-shadow(-1px -1px 0 rgba(0,0,0,0.2))"
      : "drop-shadow(1px 1px 0 rgba(0,0,0,0.25)) drop-shadow(-1px -1px 0 rgba(255,255,255,0.35))",
    color: baseColor,
  };

  return (
    <div className={className} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full fill-current"
        style={style}
        priority
      />
    </div>
  );
}
