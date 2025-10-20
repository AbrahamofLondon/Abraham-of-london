// components/EmbossedBrandMark.tsx

import * as React from 'react';
import Image from 'next/image';
import clsx from 'clsx';

type EmbossedMarkProps = {
  /** The path to the image file. We'll use: /assets/images/abraham-logo.jpg */
  src: string; 
  alt: string;
  className?: string;
  width: number;
  height: number;
  /** 'emboss' (raised) or 'deboss' (pressed in) */
  effect?: 'emboss' | 'deboss';
  /** Base color for the effect, usually a soft background color. */
  baseColor?: string;
};

export default function EmbossedBrandMark({
  src,
  alt,
  className,
  width,
  height,
  effect = 'emboss',
  baseColor = 'var(--color-warmWhite, #faf7f2)', // Light background color for contrast
}: EmbossedMarkProps) {
  const isEmboss = effect === 'emboss';
  
  // Defines the shadows for the 'raised' or 'recessed' effect.
  // We apply these to the image or its container.
  const shadowClasses = isEmboss
    // Emboss (Raised): Light highlight top-left, dark shadow bottom-right
    ? 'shadow-[1px_1px_1px_rgba(255,255,255,0.7),-1px_-1px_1px_rgba(0,0,0,0.2)]'
    // Deboss (Pressed): Dark shadow top-left, light highlight bottom-right
    : 'shadow-[1px_1px_1px_rgba(0,0,0,0.2),-1px_-1px_1px_rgba(255,255,255,0.7)]';
  
  // Note: For a JPG image, the effect will be subtle and applied to the Image
  // container. For a true embossed look, using a **PNG with a transparent background**
  // or an **SVG** is highly recommended, as the 'filter' property can be used directly on the non-transparent parts.

  return (
    <div 
      className={clsx(
        "relative flex items-center justify-center p-2 rounded-lg", // Padding helps show the "debossed" background
        shadowClasses, // Apply the core embossed/debossed shadows to the container
        className
      )}
      style={{ 
        width: width, 
        height: height, 
        backgroundColor: baseColor 
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width * 0.8} // Make the image slightly smaller than the container
        height={height * 0.8}
        // This class is essential to ensure the image sits cleanly inside the embossed area
        className="object-contain" 
        priority={false}
      />
    </div>
  );
}