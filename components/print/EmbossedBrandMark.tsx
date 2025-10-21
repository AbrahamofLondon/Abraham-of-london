<<<<<<< HEAD
import * as React from "react";import Image from "next/image";const DEFAULT_LOGO = "/assets/images/logo/abraham-of-london-logo.svg";interface EmbossedBrandMarkProps {  logoSrc?: string;  size?: number; // width and height in pixels  opacity?: number; // 0.0 to 1.0}/** * Renders a subtle, embossed-style logo or brand mark, often used on cover pages or chapter breaks. */export default function EmbossedBrandMark({  logoSrc = DEFAULT_LOGO,  size = 150,  opacity = 0.2, // Subtle opacity for 'embossed' effect}: EmbossedBrandMarkProps) {  return (    <div      className="flex justify-center items-center w-full h-full p-10"      aria-hidden="true"    >      <Image        src={logoSrc}        alt="Brand Watermark"        width={size}        height={size}        className="object-contain"        style={{          width: `${size}px`,          height: `${size}px`,          opacity: opacity,          filter: 'grayscale(100%)', // Ensure it is grayscale for a clean print background          userSelect: 'none',          pointerEvents: 'none',        }}      />    </div>  );}
=======
import * as React from "react";
import Image from "next/image";

const DEFAULT_LOGO = "/assets/images/logo/abraham-of-london-logo.svg";

interface EmbossedBrandMarkProps {
  logoSrc?: string;
  size?: number; // width and height in pixels
  opacity?: number; // 0.0 to 1.0
}

/**
 * Renders a subtle, embossed-style logo or brand mark, often used on cover pages or chapter breaks.
 */
export default function EmbossedBrandMark({
  logoSrc = DEFAULT_LOGO,
  size = 150,
  opacity = 0.2, // Subtle opacity for 'embossed' effect
}: EmbossedBrandMarkProps) {
  return (
    <div
      className="flex justify-center items-center w-full h-full p-10"
      aria-hidden="true"
    >
      <Image
        src={logoSrc}
        alt="Brand Watermark"
        width={size}
        height={size}
        className="object-contain"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          filter: 'grayscale(100%)', // Ensure it is grayscale for a clean print background
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
>>>>>>> ccf6052f (fix: remove stray header and normalize EmbossedBrandMark)
