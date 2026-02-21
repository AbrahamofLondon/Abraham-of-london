// components/mdx/Callout.tsx
import * as React from "react";
import clsx from "clsx";

type CalloutType = "info" | "note" | "success" | "warning" | "danger";

const STYLES: Record<
  CalloutType,
  { rail: string; badge: string; title: string; body: string; glow: string }
> = {
  info: {
    rail: "from-emerald-300/90 via-emerald-400/70 to-amber-300/80",
    badge: "bg-white/10 text-emerald-100 ring-1 ring-white/12",
    title: "text-white",
    body: "text-white/90",
    glow: "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
  },
  note: {
    rail: "from-white/70 via-white/25 to-amber-300/70",
    badge: "bg-white/10 text-white/90 ring-1 ring-white/12",
    title: "text-white",
    body: "text-white/90",
    glow: "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
  },
  success: {
    rail: "from-emerald-300/90 via-emerald-400/70 to-emerald-200/70",
    badge: "bg-emerald-500/10 text-emerald-100 ring-1 ring-emerald-300/15",
    title: "text-white",
    body: "text-white/90",
    glow: "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
  },
  warning: {
    rail: "from-amber-300/90 via-amber-400/60 to-amber-200/70",
    badge: "bg-amber-500/10 text-amber-100 ring-1 ring-amber-300/15",
    title: "text-white",
    body: "text-white/90",
    glow: "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
  },
  danger: {
    rail: "from-red-300/90 via-red-400/60 to-amber-300/70",
    badge: "bg-red-500/10 text-red-100 ring-1 ring-red-300/15",
    title: "text-white",
    body: "text-white/90",
    glow: "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
  },
};

export default function Callout({
  type = "info",
  title,
  children,
  className,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const s = STYLES[type];

  return (
    <aside
      className={clsx(
        "not-prose relative my-8 overflow-hidden rounded-2xl",
        // Premium frame (Harrods: black lacquer + quiet border)
        "bg-gradient-to-b from-[#0B0B0C] to-[#070707]",
        "ring-1 ring-white/10",
        "px-6 py-5 md:px-7 md:py-6",
        s.glow,
        className
      )}
    >
      {/* Gold/green rail */}
      <div
        className={clsx(
          "absolute left-0 top-0 h-full w-[3px] md:w-[4px]",
          "bg-gradient-to-b",
          s.rail
        )}
      />

      {/* Subtle inner sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="relative flex items-start gap-3">
        <span
          className={clsx(
            "mt-0.5 inline-flex select-none items-center rounded-full px-2.5 py-1",
            "text-[11px] font-semibold tracking-[0.16em] uppercase",
            s.badge
          )}
        >
          {type}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className={clsx(
              "text-[15px] md:text-[16px] font-semibold",
              "tracking-tight",
              s.title
            )}
          >
            {title ?? toTitle(type)}
          </div>

          {/* Critical: no wrapper opacity that kills contrast */}
          <div
            className={clsx(
              "mt-2 text-[15px] leading-[1.75]",
              s.body,
              // Links: Harrods gold
              "[&_a]:text-amber-200 [&_a]:underline [&_a]:underline-offset-4",
              "[&_a:hover]:text-amber-100",
              // Lists + emphasis
              "[&_strong]:text-white [&_em]:text-white/90",
              "[&_code]:rounded [&_code]:bg-white/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-white"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

function toTitle(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}