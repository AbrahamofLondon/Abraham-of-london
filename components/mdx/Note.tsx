/* components/mdx/Note.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import clsx from "clsx";

type NoteTone = "key" | "info" | "warn" | "danger" | "success" | "neutral" | "caution" | "tip" | "error";

const TOKENS: Record<
  NoteTone,
  {
    ring: string;
    bg: string;
    title: string;
    body: string;
    accent: string;
    dot: string;
    link: string;
    code: string;
    hr: string;
  }
> = {
  // FIX: readable on parchment (no “white-on-cream” washout)
  key: {
    ring: "border-amber-400/45",
    bg: "bg-[linear-gradient(180deg,rgba(255,252,242,0.98),rgba(255,244,220,0.92))]",
    title: "text-zinc-950",
    body: "text-zinc-900",
    accent: "text-amber-900",
    dot: "bg-amber-700",
    link: "[&_a]:text-amber-900 [&_a:hover]:text-amber-700",
    code: "[&_code]:text-amber-900 [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-black/10",
  },

  info: {
    ring: "border-white/10",
    bg: "bg-gradient-to-b from-white/[0.06] to-black/[0.45]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-[#D6B25E]",
    dot: "bg-[#D6B25E]",
    link: "[&_a]:text-[#E6C77A] [&_a:hover]:text-[#F3D98C]",
    code: "[&_code]:text-[#E6C77A] [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  success: {
    ring: "border-emerald-200/15",
    bg: "bg-gradient-to-b from-emerald-200/[0.06] to-black/[0.50]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-emerald-200",
    dot: "bg-emerald-200",
    link: "[&_a]:text-emerald-200 [&_a:hover]:text-emerald-100",
    code: "[&_code]:text-emerald-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  warn: {
    ring: "border-amber-200/15",
    bg: "bg-gradient-to-b from-amber-200/[0.06] to-black/[0.50]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-amber-200",
    dot: "bg-amber-200",
    link: "[&_a]:text-amber-200 [&_a:hover]:text-amber-100",
    code: "[&_code]:text-amber-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  danger: {
    ring: "border-rose-200/15",
    bg: "bg-gradient-to-b from-rose-200/[0.06] to-black/[0.55]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-rose-200",
    dot: "bg-rose-200",
    link: "[&_a]:text-rose-200 [&_a:hover]:text-rose-100",
    code: "[&_code]:text-rose-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  neutral: {
    ring: "border-white/10",
    bg: "bg-gradient-to-b from-white/[0.05] to-black/[0.45]",
    title: "text-white",
    body: "text-white/85",
    accent: "text-white/70",
    dot: "bg-white/50",
    link: "[&_a]:text-amber-200/80 [&_a:hover]:text-amber-200",
    code: "[&_code]:text-amber-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  // ✅ Add caution (maps to warn styling)
  caution: {
    ring: "border-amber-200/15",
    bg: "bg-gradient-to-b from-amber-200/[0.06] to-black/[0.50]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-amber-200",
    dot: "bg-amber-200",
    link: "[&_a]:text-amber-200 [&_a:hover]:text-amber-100",
    code: "[&_code]:text-amber-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  // ✅ Add tip (maps to success styling)
  tip: {
    ring: "border-emerald-200/15",
    bg: "bg-gradient-to-b from-emerald-200/[0.06] to-black/[0.50]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-emerald-200",
    dot: "bg-emerald-200",
    link: "[&_a]:text-emerald-200 [&_a:hover]:text-emerald-100",
    code: "[&_code]:text-emerald-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },

  // ✅ Add error (maps to danger styling)
  error: {
    ring: "border-rose-200/15",
    bg: "bg-gradient-to-b from-rose-200/[0.06] to-black/[0.55]",
    title: "text-white",
    body: "text-white/90",
    accent: "text-rose-200",
    dot: "bg-rose-200",
    link: "[&_a]:text-rose-200 [&_a:hover]:text-rose-100",
    code: "[&_code]:text-rose-200 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
    hr: "[&_hr]:border-white/10",
  },
};

export default function Note({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: NoteTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const t = TOKENS[tone];

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
      <div
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-0 h-[1px]",
          tone === "key" ? "bg-black/10" : "bg-white/15"
        )}
      />

      <div
        className={clsx(
          "pointer-events-none absolute -top-24 right-[-20%] h-64 w-64 rounded-full blur-3xl",
          tone === "key" ? "bg-amber-400/10" : "bg-white/[0.06]"
        )}
      />

      {tone === "key" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.04) 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.03) 0 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
      ) : null}

      <div className="relative z-10 mb-4 flex items-center gap-3">
        <span className={clsx("h-2.5 w-2.5 rounded-full", t.dot)} />
        <div className={clsx("text-[11px] font-mono font-bold uppercase tracking-[0.28em]", t.accent)}>
          {title ?? "Note"}
        </div>
      </div>

      <div
        className={clsx(
          "relative z-10 text-[15px] leading-[1.9]",
          tone === "key" ? "prose max-w-none" : "prose prose-invert max-w-none",
          t.body,
          t.link,
          "[&_strong]:font-semibold",
          tone === "key"
            ? "[&_strong]:text-zinc-950 [&_em]:text-zinc-900"
            : "[&_strong]:text-white [&_em]:text-white/90",
          t.hr,
          t.code
        )}
      >
        {children}
      </div>
    </aside>
  );
}