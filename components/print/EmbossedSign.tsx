<<<<<<< HEAD
=======
// components/print/EmbossedSign.tsx
"use client";

import * as React from "react";
>>>>>>> test-netlify-fix
import Image from "next/image";
import clsx from "clsx";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */

type Props = {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
<<<<<<< HEAD
  baseColor?: string;
};

export default function EmbossedSign({
  src,
  width = 140,
  height = 40,
  alt = "Signature",
  className = "",
}: Props) {
  return (
    <div className={`inline-block opacity-80 ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} />
    </div>
=======
  children?: React.ReactNode;
  text?: string;
  variant?: "image" | "text" | "hybrid";
};

export function EmbossedSign({
  src = "/assets/images/signature/abraham-of-london-cursive.svg",
  alt = "Abraham of London Signature",
  width = 120,
  height = 36,
  effect = "deboss",
  baseColor = "transparent",
  className = "",
  children,
  text,
  variant = "image",
}: EmbossedSignProps) {
  const plateShadow =
    effect === "deboss"
      ? "inset 1.5px 1.5px 3px rgba(0,0,0,.25), inset -1.5px -1.5px 3px rgba(255,255,255,.35)"
      : effect === "emboss"
      ? "1.5px 1.5px 2.5px rgba(0,0,0,.18), -1.5px -1.5px 2.5px rgba(255,255,255,.4)"
      : "none";

  const containerClasses = clsx(
    "inline-block relative",
    {
      "cursor-pointer transition-transform hover:scale-105": effect !== "none",
    },
    className
  );

  const renderContent = () => {
    if (children) {
      return children;
    }

    switch (variant) {
      case "text":
        return (
          <span 
            className="font-serif font-bold text-deepCharcoal tracking-wide"
            style={{ fontSize: `${height * 0.6}px` }}
          >
            {text || "Abraham of London"}
          </span>
        );
      
      case "hybrid":
        return (
          <div className="flex flex-col items-center">
            <Image
              src={src}
              alt={alt}
              width={width * 0.8}
              height={height * 0.6}
              className="block mb-1"
              style={{ filter: "drop-shadow(0 0 .25px rgba(0,0,0,.25))" }}
              priority
            />
            <span className="text-xs text-[color:var(--color-on-secondary)/0.7] font-sans">
              {text || "Leadership & Fatherhood"}
            </span>
          </div>
        );
      
      case "image":
      default:
        return (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="block"
            style={{ filter: "drop-shadow(0 0 .25px rgba(0,0,0,.25))" }}
            priority
          />
        );
    }
  };

  return (
    <span className={containerClasses} style={{ position: "relative" }}>
      {effect !== "none" && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 4,
            background: baseColor,
            boxShadow: plateShadow,
          }}
        />
      )}
      <span style={{ position: "relative", display: "block" }}>
        {renderContent()}
      </span>
    </span>
>>>>>>> test-netlify-fix
  );
}

// Default export for backward compatibility
export default EmbossedSign;