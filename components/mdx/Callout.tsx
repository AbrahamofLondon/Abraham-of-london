// components/mdx/Callout.tsx
import * as React from "react";
import clsx from "clsx";

type CanonicalCalloutType = "info" | "note" | "success" | "warning" | "danger";

type CalloutTone = {
  ring: string;
  bg: string;
  title: string;
  accent: string;
  icon: string;
  body: string;
};

const TOKENS: Record<CanonicalCalloutType, CalloutTone> = {
  info: {
    ring: "border-white/10",
    bg: "bg-gradient-to-b from-white/[0.06] to-black/[0.40]",
    title: "text-white",
    accent: "text-[#D6B25E]",
    icon: "bg-[#D6B25E]",
    body: "text-white/90",
  },
  note: {
    ring: "border-white/10",
    bg: "bg-gradient-to-b from-white/[0.07] to-black/[0.45]",
    title: "text-white",
    accent: "text-[#D6B25E]",
    icon: "bg-[#D6B25E]",
    body: "text-white/90",
  },
  success: {
    ring: "border-emerald-200/15",
    bg: "bg-gradient-to-b from-emerald-200/[0.06] to-black/[0.45]",
    title: "text-white",
    accent: "text-emerald-200",
    icon: "bg-emerald-200",
    body: "text-white/90",
  },
  warning: {
    ring: "border-amber-200/15",
    bg: "bg-gradient-to-b from-amber-200/[0.06] to-black/[0.45]",
    title: "text-white",
    accent: "text-amber-200",
    icon: "bg-amber-200",
    body: "text-white/90",
  },
  danger: {
    ring: "border-rose-200/15",
    bg: "bg-gradient-to-b from-rose-200/[0.06] to-black/[0.45]",
    title: "text-white",
    accent: "text-rose-200",
    icon: "bg-rose-200",
    body: "text-white/90",
  },
};

const TYPE_ALIASES: Record<string, CanonicalCalloutType> = {
  info: "info",
  note: "note",
  success: "success",
  warning: "warning",
  danger: "danger",

  insight: "info",
  scripture: "warning",
  prophetic: "warning",
  framework: "info",
  hope: "success",
  question: "info",
  grace: "success",
  error: "danger",
};

function resolveType(type?: string): CanonicalCalloutType {
  if (!type) return "info";
  return TYPE_ALIASES[type] || "info";
}

export default function Callout({
  type = "info",
  title,
  children,
  className,
}: {
  type?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const safeType = resolveType(type);
  const t = TOKENS[safeType];

  return (
    <aside
      className={clsx(
        "not-prose relative my-10 overflow-hidden rounded-3xl border p-7",
        "shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]",
        "backdrop-blur-xl",
        t.ring,
        t.bg,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/15" />
      <div className="pointer-events-none absolute -top-24 right-[-20%] h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />

      <div className="mb-4 flex items-center gap-3">
        <span className={clsx("h-2.5 w-2.5 rounded-full", t.icon)} />
        <div
          className={clsx(
            "text-[11px] font-mono font-bold uppercase tracking-[0.28em]",
            t.accent
          )}
        >
          {title ?? safeType}
        </div>
      </div>

      <div
        className={clsx(
          "text-[15px] leading-[1.9]",
          t.body,
          "[&_a]:text-[#E6C77A] [&_a:hover]:text-[#F3D98C]",
          "[&_strong]:text-white [&_em]:text-white/90",
          "[&_hr]:border-white/10",
          "[&_code]:text-[#E6C77A] [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
          "[&_p]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
        )}
      >
        {children}
      </div>
    </aside>
  );
}