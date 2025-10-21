// components/EmbossedSign.tsx

// /components/EmbossedSign.tsx

import * as React from 'react';
import Image from 'next/image';

type EmbossedSignProps = {
  src: string; // Path to the SVG file (logo or signature)
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** 'emboss' (raised) or 'deboss' (pressed in) */
  effect?: 'emboss' | 'deboss';
  /** Base color for the effect (e.g., '#0b2e1f' for your forest color) */
  baseColor?: string;
};

export default function EmbossedSign({
  src,
  alt,
  className,
  width = 150,
  height = 30,
  effect = 'emboss',
  baseColor = 'var(--color-primary, #0b2e1f)', // Uses your brand color as default
}: EmbossedSignProps) {
  const isEmboss = effect === 'emboss';

  // Defines the shadow for the "raised" or "recessed" effect.
  // The key is contrasting light/dark shadows for depth.
  const shadowStyle = {
    // 1. Inset/Outer Shadow (Simulates the raised edge)
    //     Light source from top-left (white highlight)
    //     Shadow cast toward bottom-right (dark shadow)
    filter: isEmboss
      ? `drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.4)) drop-shadow(-1px -1px 0 rgba(0, 0, 0, 0.2))`
      : `drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.2)) drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.4))`,
    
    // 2. Base Color (The color of the material itself). 
    // This color is applied to the SVG via `fill-current`.
    color: baseColor,
  };

  return (
    <div className={className} style={{ width, height }}>
      {/* The SVG image will be rendered, and its paths (if set to fill="currentColor") 
        will inherit the 'color' from the shadowStyle, applying the baseColor. 
      */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        // Tailwind classes for size and ensuring the fill is the 'currentColor'
        className="w-full h-full fill-current"
        style={shadowStyle}
      />
    </div>
  );
}import * as React from "react";
import Image from "next/image";

type EmbossedSignProps = {
  src: string; // Path to the SVG file (logo or signature)
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** 'emboss' (raised) or 'deboss' (pressed in) */
  effect?: 'emboss' | 'deboss';
  /** Base color for the effect (e.g., '#0b2e1f' for your forest color) */
  baseColor?: string;
};

export default function EmbossedSign({
  src,
  alt,
  className,
  width = 150,
  height = 30,
  effect = 'emboss',
  baseColor = 'var(--color-primary, #0b2e1f)', // Uses your brand color as default
}: EmbossedSignProps) {
  const isEmboss = effect === 'emboss';

  // Defines the shadow for the "raised" or "recessed" effect.
  // The key is contrasting light/dark shadows for depth.
  const shadowStyle = {
    // 1. Inset/Outer Shadow (Simulates the raised edge)
    //    Light source from top-left (white highlight)
    //    Shadow cast toward bottom-right (dark shadow)
    filter: isEmboss 
      ? `drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.4)) drop-shadow(-1px -1px 0 rgba(0, 0, 0, 0.2))`
      : `drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.2)) drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.4))`,
    
    // 2. Base Color (The color of the material itself)
    color: baseColor,
  };

  return (
    <div className={className} style={{ width, height }}>
      {/* We use a div wrapper and an <img> tag to apply the styles.
        The SVG inherits the 'color' from the 'style' applied to the wrapper 
        when using 'currentColor' inside the SVG paths.
      */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        // Tailwind classes for size and ensuring the fill is the 'currentColor'
        className="w-full h-full fill-current" 
        style={shadowStyle}
      />
    </div>
  );
}