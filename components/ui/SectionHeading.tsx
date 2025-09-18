"use client";

import * as React from "react";
import clsx from "clsx";

type Align = "left" | "center" | "right";
type Tone = "default" | "subtle" | "brand";
type EyebrowTone = "gold" | "forest" | "charcoal";

interface Props {
  eyebrow?: string;          // small label above the title
  title: string;             // main heading text
  subtitle?: string | React.ReactNode; // optional supporting copy
  as?: keyof JSX.IntrinsicElements;    // h1|h2|h3...
  align?: Align;             // text alignment
  tone?: Tone;               // color intensity for title/subtitle
  eyebrowTone?: EyebrowTone; // eyebrow color
  className?: string;        // wrapper overrides
  withDivider?: boolean;     // thin rule under subtitle
  kicker?: React.ReactNode;  // optional right-side node (CTA, badge)
}

const alignMap: Record<Align, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const titleToneMap: Record<Tone, string> = {
  default: "text-deepCharcoal dark:text-cream",
  subtle: "text-deepCharcoal/80 dark:text-cream/90",
  brand: "text-forest dark:text-cream",
};

const subtitleToneMap: Record<Tone, string> = {
  default: "text-deepCharcoal/70 dark:text-cream/70",
  subtle: "text-deepCharcoal/60 dark:text-cream/60",
  brand: "text-deepCharcoal/70 dark:text-cream/70",
};

const eyebrowToneMap: Record<EyebrowTone, string> = {
  gold: "text-softGold",
  forest: "text-forest",
  charcoal: "text-deepCharcoal/70 dark:text-cream/70",
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = "h2",
  align = "left",
  tone = "default",
  eyebrowTone = "gold",
  className,
  withDivider = false,
  kicker,
}: Props) {
  return (
    <header className={clsx("w-full", className)}>
      {/* Top row: eyebrow + optional kicker */}
      <div className={clsx("flex w-full gap-4", align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start")}>
        {eyebrow ? (
          <p
            className={clsx(
              "uppercase tracking-brand text-xs font-semibold",
              eyebrowToneMap[eyebrowTone]
            )}
          >
            {eyebrow}
          </p>
        ) : (
          <span aria-hidden className="sr-only" />
        )}
        {kicker ? <div className="ml-auto">{kicker}</div> : null}
      </div>

      {/* Title */}
      <Tag
        className={clsx(
          "mt-2 font-serif font-bold leading-tight",
          // size scale: h1 larger, else standard
          Tag === "h1"
            ? "text-4xl sm:text-5xl md:text-6xl"
            : "text-3xl sm:text-4xl",
          titleToneMap[tone],
          alignMap[align]
        )}
      >
        {title}
      </Tag>

      {/* Subtitle */}
      {subtitle ? (
        <p
          className={clsx(
            "mt-3 max-w-3xl",
            subtitleToneMap[tone],
            align === "center"
              ? "mx-auto"
              : align === "right"
              ? "ml-auto"
              : "mr-auto",
            "text-base sm:text-lg"
          )}
        >
          {subtitle}
        </p>
      ) : null}

      {/* Divider */}
      {withDivider ? (
        <hr
          className={clsx(
            "mt-5 h-px border-0",
            align === "center"
              ? "mx-auto"
              : align === "right"
              ? "ml-auto"
              : "mr-auto",
            "w-24 bg-lightGrey dark:bg-white/10"
          )}
        />
      ) : null}
    </header>
  );
}
