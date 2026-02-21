import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Props = {
  title?: string;
  level?: "info" | "warn" | "danger" | "success";
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

const T = {
  info: {
    ring: "border-white/10",
    bg: "bg-gradient-to-b from-white/[0.06] to-black/[0.45]",
    label: "text-[#D6B25E]",
    icon: <Info className="h-4 w-4 text-[#D6B25E]" />,
  },
  warn: {
    ring: "border-amber-200/15",
    bg: "bg-gradient-to-b from-amber-200/[0.06] to-black/[0.45]",
    label: "text-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-200" />,
  },
  danger: {
    ring: "border-rose-200/15",
    bg: "bg-gradient-to-b from-rose-200/[0.06] to-black/[0.45]",
    label: "text-rose-200",
    icon: <AlertCircle className="h-4 w-4 text-rose-200" />,
  },
  success: {
    ring: "border-emerald-200/15",
    bg: "bg-gradient-to-b from-emerald-200/[0.06] to-black/[0.45]",
    label: "text-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-200" />,
  },
} as const;

export default function BriefAlert({
  title = "Brief Alert",
  level = "info",
  children,
  className = "",
  icon,
}: Props) {
  const s = T[level] ?? T.info;

  return (
    <div
      className={[
        "not-prose my-8 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl",
        "shadow-[0_26px_70px_-50px_rgba(0,0,0,0.85)]",
        s.ring,
        s.bg,
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/15" />

      <div className="flex items-center gap-3">
        {icon ?? s.icon}
        <div className={["text-[11px] font-mono font-bold uppercase tracking-[0.28em]", s.label].join(" ")}>
          {title}
        </div>
      </div>

      {children ? (
        <div className="mt-4 prose prose-invert max-w-none text-[15px] leading-[1.9] text-white/90">
          {children}
        </div>
      ) : null}
    </div>
  );
}