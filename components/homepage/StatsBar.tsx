"use client";

import * as React from "react";
import clsx from "clsx";

type StatMetric = {
  label: string;
  value: string;
  hint?: string;
};

type StatsBarProps = {
  metrics?: StatMetric[];
  variant?: "dark" | "light";
  className?: string;
  // so your safe() wrapper can pass this without errors
  fallbackContent?: boolean;
};

const DEFAULT_METRICS: StatMetric[] = [
  {
    label: "Canon & structural works",
    value: "Multi-volume",
    hint: "The ideological engine room above the ventures",
  },
  {
    label: "Ventures & operating arms",
    value: "3",
    hint: "Alomarada · EndureLuxe · InnovateHub",
  },
  {
    label: "Writings, tools & sessions",
    value: "Growing",
    hint: "Essays, downloads, events & field frameworks",
  },
];

export default function StatsBar({
  metrics = DEFAULT_METRICS,
  variant = "dark",
  className,
}: StatsBarProps): JSX.Element {
  const surface =
    variant === "dark"
      ? "bg-white/5 border border-white/10 text-cream"
      : "bg-warmWhite border border-black/5 text-deepCharcoal";

  const labelClass =
    variant === "dark"
      ? "text-cream/70"
      : "text-[color:var(--color-on-secondary)]/80";

  const hintClass =
    variant === "dark"
      ? "text-cream/60"
      : "text-[color:var(--color-on-secondary)]/70";

  return (
    <section
      className={clsx(
        "px-4 py-10",
        className
      )}
      aria-label="Abraham of London ecosystem snapshot"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={clsx(
            "flex flex-col gap-6 rounded-3xl px-6 py-5 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between md:px-10 md:py-7",
            surface
          )}
        >
          <div className="max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              The ecosystem at a glance
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Canon at the top, ventures in the middle, tools and writings in
              the field—one structural stack.
            </p>
          </div>

          <div className="flex flex-1 flex-wrap justify-between gap-6 md:gap-10">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-[8rem]">
                <div className="text-2xl font-semibold tracking-tight">
                  {metric.value}
                </div>
                <div className={clsx("mt-1 text-[0.7rem] uppercase tracking-[0.22em] font-semibold", labelClass)}>
                  {metric.label}
                </div>
                {metric.hint && (
                  <p className={clsx("mt-1 text-xs leading-snug", hintClass)}>
                    {metric.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}