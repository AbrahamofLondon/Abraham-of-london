import * as React from "react";
import Image, { ImageProps } from "next/image";

type Effect = "emboss" | "deboss" | "none";

export type EmbossedSignProps = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  effect?: Effect;
  plateColor?: string;
  plateRadius?: number;
  platePadding?: number;
  decorative?: boolean;
  className?: string;
  priority?: boolean;
  loading?: ImageProps["loading"];
  sizes?: ImageProps["sizes"];
};

const DEFAULTS = {
  src: "/assets/images/signature/abraham-of-london-cursive.svg",
  alt: "Signature",
  width: 120,
  height: 36,
  effect: "deboss" as Effect,
  plateColor: "transparent",
  plateRadius: 6,
  platePadding: 0,
};

function EmbossedSign({
  src = DEFAULTS.src,
  alt = DEFAULTS.alt,
  width = DEFAULTS.width,
  height = DEFAULTS.height,
  effect = DEFAULTS.effect,
  plateColor = DEFAULTS.plateColor,
  plateRadius = DEFAULTS.plateRadius,
  platePadding = DEFAULTS.platePadding,
  decorative = false,
  className = "",
  priority,
  loading,
  sizes = "(max-width: 768px) 30vw, 160px",
}: EmbossedSignProps) {
  const isEmboss = effect === "emboss";
  const isDeboss = effect === "deboss";

  const plateShadow =
    plateColor === "transparent"
      ? "none"
      : "inset 1px 1px 2px rgba(0,0,0,.15), inset -1px -1px 2px rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.08)";

  const strokeShadow =
    isDeboss
      ? "drop-shadow(0.5px 0.5px 0 rgba(0,0,0,.25)) drop-shadow(-0.5px -0.5px 0 rgba(255,255,255,.35))"
      : isEmboss
      ? "drop-shadow(0.5px 0.5px 0 rgba(255,255,255,.4)) drop-shadow(-0.5px -0.5px 0 rgba(0,0,0,.22))"
      : "none";

  return (
    <>
      <span
        className={`embossed-sign inline-block ${className}`}
        style={{ position: "relative", width, height }}
        aria-hidden={decorative || undefined}
      >
        {plateColor !== "transparent" && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: plateRadius,
              background: plateColor,
              boxShadow: plateShadow,
            }}
          />
        )}

        <Image
          src={src}
          alt={decorative ? "" : alt}
          width={width - platePadding * 2}
          height={height - platePadding * 2}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading ?? "lazy"}
          className="block"
          style={{
            position: "relative",
            margin: platePadding,
            filter: strokeShadow,
          }}
        />
      </span>

      <style jsx>{`
        @media print {
          .embossed-sign :global(img) {
            filter: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default React.memo(EmbossedSign);
export type { Effect };
