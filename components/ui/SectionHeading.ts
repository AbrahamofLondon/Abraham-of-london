import * as React from "react";
import clsx from "clsx";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  withDivider?: boolean;
  kicker?: React.ReactNode; // right-aligned action (e.g., a Button)
  tone?: "default" | "muted";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  withDivider = false,
  kicker,
  tone = "default",
  className,
}: Props) {
  const wrapCls = clsx(
    "flex w-full items-start justify-between gap-3",
    align === "center" ? "flex-col text-center md:flex-row md:text-left" : "flex-col",
    className
  );

  return (
    <header className={wrapCls}>
      <div className={clsx("max-w-3xl", align === "center" ? "mx-auto md:mx-0" : "")}>
        {eyebrow && (
          <p className={clsx("text-xs tracking-widest uppercase", tone === "muted" ? "text-deepCharcoal/60" : "text-deepCharcoal/70")}>
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-deepCharcoal/70">
            {subtitle}
          </p>
        )}
        {withDivider && <div className="mt-4 h-px w-16 bg-lightGrey" aria-hidden="true" />}
      </div>

      {kicker ? <div className={clsx(align === "center" ? "md:ml-auto" : "")}>{kicker}</div> : null}
    </header>
  );
}
