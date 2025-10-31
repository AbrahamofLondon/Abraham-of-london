import * as React from "react";
import Image, { ImageProps } from "next/image";

type Effect = "emboss" | "deboss" | "none";

export type EmbossedBrandMarkProps = {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  effect?: Effect;
  plateColor?: string;
  plateRadius?: number;
  platePadding?: number;
  decorative?: boolean;
  priority?: boolean;
  loading?: ImageProps["loading"];
  sizes?: ImageProps["sizes"];
};

const DEFAULTS = {
  width: 160,
  height: 40,
  effect: "emboss" as Effect,
  plateColor: "transparent",
  plateRadius: 8,
  platePadding: 0,
};

export default function EmbossedBrandMark({
  src,
  alt = "Brand Mark",
  className,
  width = DEFAULTS.width,
  height = DEFAULTS.height,
  effect = DEFAULTS.effect,
  plateColor = DEFAULTS.plateColor,
  plateRadius = DEFAULTS.plateRadius,
  platePadding = DEFAULTS.platePadding,
  decorative = false,
  priority,
  loading,
  sizes = "(max-width: 768px) 40vw, 200px",
}: EmbossedBrandMarkProps) {
  const isEmboss = effect === "emboss";
  const isDeboss = effect === "deboss";

  const imgFilter =
    isEmboss
      ? "drop-shadow(0.75px 0.75px 0 rgba(255,255,255,.45)) drop-shadow(-0.75px -0.75px 0 rgba(0,0,0,.25))"
      : isDeboss
      ? "drop-shadow(0.75px 0.75px 0 rgba(0,0,0,.25)) drop-shadow(-0.75px -0.75px 0 rgba(255,255,255,.45))"
      : "none";

  const plateShadow =
    plateColor === "transparent"
      ? "none"
      : "inset 1px 1px 2px rgba(0,0,0,.15), inset -1px -1px 2px rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.08)";

  return (
    <>
      <span
        className={`embossed-brand-mark ${className ?? ""}`}
        style={{
          display: "inline-block",
          position: "relative",
          width,
          height,
        }}
        aria-hidden={decorative || undefined}
      >
        {plateColor !== "transparent" && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: plateColor,
              borderRadius: plateRadius,
              boxShadow: plateShadow,
            }}
          />
        )}

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: platePadding,
            borderRadius: Math.max(0, plateRadius - platePadding),
          }}
        />

        <Image
          src={src}
          alt={decorative ? "" : alt}
          width={width - platePadding * 2}
          height={height - platePadding * 2}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading ?? "lazy"}
          style={{
            position: "relative",
            filter: imgFilter,
            imageRendering: "auto",
          }}
        />
      </span>

      <style jsx>{`
        @media print {
          .embossed-brand-mark :global(img) {
            filter: none !important;
          }
        }
      `}</style>
    </>
  );
}
