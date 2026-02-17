// components/print/EmbossedBrandMark.tsx
import * as React from "react";
import Image from "next/image";

export type EmbossedBrandMarkProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  effect?: "emboss" | "deboss";
  baseColor?: string;
};

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
  
  // Create filter style based on effect
  const filterStyle = isEmboss
    ? "drop-shadow(1px 1px 0 rgba(255,255,255,0.4)) drop-shadow(-1px -1px 0 rgba(0,0,0,0.2))"
    : "drop-shadow(1px 1px 0 rgba(0,0,0,0.25)) drop-shadow(-1px -1px 0 rgba(255,255,255,0.35))";
  
  // Use separate style objects to avoid TypeScript issues
  const containerStyle: React.CSSProperties = {
    width,
    height,
  };
  
  const imageStyle: React.CSSProperties = {
    filter: filterStyle,
    color: baseColor,
  };

  return (
    <div className={className} style={containerStyle}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full fill-current"
        style={imageStyle}
        priority
      />
    </div>
  );
}