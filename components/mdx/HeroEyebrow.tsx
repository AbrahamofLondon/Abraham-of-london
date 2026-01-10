// components/mdx/HeroEyebrow.tsx
import * as React from "react";

export type HeroEyebrowProps = React.PropsWithChildren<{
  className?: string;
  as?: "p" | "div" | "span";
  tone?: "gold" | "neutral";
}>;

export default function HeroEyebrow({
  children,
  className = "",
  as = "p",
  tone = "gold",
}: HeroEyebrowProps) {
  const Tag = as as any;

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
    >
      <span className="h-[1px] w-6 bg-current opacity-60" />
      <span>{children}</span>
    </Tag>
  );
}

