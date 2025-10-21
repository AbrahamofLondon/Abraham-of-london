// /components/print/EmbossedBrandMark.tsx

import * as React from "react";
// Import the base component
import EmbossedSign from "../EmbossedSign"; 

// Define the specific path for your brand mark/logo
const BRAND_MARK_SRC = "/logos/brand-mark-logo.svg"; 

type EmbossedBrandMarkProps = {
  // Allow overriding specific props, while hardcoding the src and alt
  className?: string;
  width?: number;
  height?: number;
  effect?: 'emboss' | 'deboss';
  baseColor?: string;
};

/**
 * A wrapper component that specifically renders the brand's logo 
 * using the EmbossedSign component with default brand settings.
 */
export default function EmbossedBrandMark({
  className,
  width = 80, // Smaller default size, typical for a logo/mark
  height = 80,
  effect = 'deboss', // Often looks better for small logos
  baseColor,
}: EmbossedBrandMarkProps) {
  return (
    <EmbossedSign
      // Hardcoded brand details
      src={BRAND_MARK_SRC}
      alt="Abraham of London Brand Mark"
      
      // Inherited props
      className={className}
      width={width}
      height={height}
      effect={effect}
      baseColor={baseColor}
    />
  );
}