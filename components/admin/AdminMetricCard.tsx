// components/admin/AdminMetricCard.tsx
// Shared metric/stat card for admin surfaces.

import type { AdminBadgeTone } from "./AdminStatusBadge";

export type AdminMetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: AdminBadgeTone;
  /** "primary" — standalone bordered card (bg-zinc-950/70, p-4, text-2xl).
      "inner"   — nested metric within a parent card (bg-black/20, p-3, text-lg). */
  variant?: "primary" | "inner";
};

const VALUE_COLOR: Record<AdminBadgeTone, string> = {
  success:  "text-emerald-300",
  warning:  "text-amber-300",
  danger:   "text-rose-300",
  critical: "text-rose-300",
  info:     "text-blue-300",
  neutral:  "text-white",
  muted:    "text-white/40",
};

export function AdminMetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  variant = "primary",
}: AdminMetricCardProps) {
  if (variant === "inner") {
    return (
      <div className="border border-white/5 bg-black/20 p-3">
        <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">{label}</p>
        <p className={`mt-2 text-lg font-light ${VALUE_COLOR[tone]}`}>{value}</p>
        {detail ? <p className="mt-1 text-[10px] text-white/30">{detail}</p> : null}
      </div>
    );
  }

  return (
    <section className="border border-white/10 bg-zinc-950/70 p-4">
      <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className={`mt-3 text-2xl font-light ${VALUE_COLOR[tone]}`}>{value}</p>
      {detail ? <p className="mt-1 text-[10px] text-white/35">{detail}</p> : null}
    </section>
  );
}
