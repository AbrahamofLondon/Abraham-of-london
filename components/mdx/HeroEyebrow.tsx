import * as React from "react";

type AsTag = "p" | "div" | "span";

export type HeroEyebrowProps<T extends AsTag = "p"> =
  React.PropsWithChildren<{
    className?: string;
    as?: T;
    tone?: "gold" | "neutral";
  }> &
    Omit<
      React.ComponentPropsWithoutRef<T>,
      "as" | "children" | "className" | "color"
    >;

export default function HeroEyebrow<T extends AsTag = "p">({
  children,
  className = "",
  as,
  tone = "gold",
  ...rest
}: HeroEyebrowProps<T>) {
  const Tag = (as ?? "p") as T;

  const toneClass = tone === "neutral" ? "text-slate-300/80" : "text-softGold/80";

  return (
    <Tag
      className={[
        "mb-3 inline-flex items-center gap-2",
        "text-[0.72rem] font-semibold uppercase tracking-[0.28em]",
        "select-none",
        toneClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span aria-hidden className="h-[1px] w-6 bg-current opacity-60" />
      <span>{children}</span>
    </Tag>
  );
}