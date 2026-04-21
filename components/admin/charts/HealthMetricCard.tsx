/**
 * Reusable admin metric card with trend indicator.
 * Extracted from pages/board/intelligence.tsx (StatCard) and pages/board/c.tsx.
 */

import * as React from "react";

type Trend = "normal" | "high" | "low" | "critical";

const TREND_CONFIG: Record<Trend, { color: string; bg: string; border: string }> = {
  normal:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  high:     { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  low:      { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  critical: { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

export default function HealthMetricCard({
  title,
  value,
  icon: Icon,
  trend = "normal",
  subtitle,
}: {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: Trend;
  subtitle?: string;
}) {
  const cfg = TREND_CONFIG[trend];

  return (
    <div className={`border ${cfg.border} ${cfg.bg} p-4 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        {Icon && <Icon className={`h-4 w-4 ${cfg.color}`} />}
        <span className="text-[8px] font-mono uppercase tracking-wider text-white/25">{title}</span>
      </div>
      <p className={`text-2xl font-light ${cfg.color}`}>{value}</p>
      {subtitle && <p className="mt-1 text-[9px] text-white/30">{subtitle}</p>}
    </div>
  );
}
