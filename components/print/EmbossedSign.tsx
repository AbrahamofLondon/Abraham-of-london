import * as React from "react";
import Image from "next/image";

type Effect = "emboss" | "deboss" | "none";

export type EmbossedSignProps = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  effect?: Effect;
  baseColor?: string;
  className?: string;
};

function EmbossedSign({
  src = "/assets/images/signature/abraham-of-london-cursive.svg",
  alt = "Abraham of London Signature",
  width = 120,
  height = 36,
  effect = "deboss",
  baseColor = "transparent",
  className = "",
}: EmbossedSignProps) {
  const plateShadow =
    effect === "deboss"
      ? "inset 1.5px 1.5px 3px rgba(0,0,0,.25), inset -1.5px -1.5px 3px rgba(255,255,255,.35)"
      : effect === "emboss"
      ? "1.5px 1.5px 2.5px rgba(0,0,0,.18), -1.5px -1.5px 2.5px rgba(255,255,255,.4)"
      : "none";

  return (
    <span className={`inline-block ${className}`} style={{ position: "relative" }}>
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
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="block"
        style={{ position: "relative", filter: "drop-shadow(0 0 .25px rgba(0,0,0,.25))" }}
        priority
      />
    </span>
  );
}

export default React.memo(EmbossedSign);
export type { Effect };
