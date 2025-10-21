import Image from "next/image";
import * as React from "react";

type Effect = "emboss" | "deboss" | "none";

export default function EmbossedSign({
  src = "/assets/images/signature/abraham-of-london-cursive.svg",
  alt = "Abraham of London Signature",
  width = 120,
  height = 36,
  effect = "deboss",
  baseColor = "transparent",
  className = "",
}: {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  effect?: Effect;
  baseColor?: string;
  className?: string;
}) {
  return (
    <span className={`inline-block ${className}`} style={{ position: "relative" }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          background: baseColor,
          boxShadow:
            effect === "deboss"
              ? "inset 1.5px 1.5px 3px rgba(0,0,0,.25), inset -1.5px -1.5px 3px rgba(255,255,255,.35)"
              : effect === "emboss"
              ? "1.5px 1.5px 2.5px rgba(0,0,0,.18), -1.5px -1.5px 2.5px rgba(255,255,255,.4)"
              : "none",
        }}
      />
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{
          position: "relative",
          display: "block",
          filter: "drop-shadow(0 0 .25px rgba(0,0,0,.25))",
        }}
        priority
      />
    </span>
  );
}
