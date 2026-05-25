"use client";

type HealthMetric = {
  label: string;
  value: string | number;
  status: "ok" | "warning" | "critical" | "neutral";
  detail?: string;
};

const STATUS_STYLES = {
  ok:       "text-emerald-400",
  warning:  "text-amber-400",
  critical: "text-red-400",
  neutral:  "text-white/50",
};

export function FoundryHealthPanel({ metrics }: { metrics: HealthMetric[] }) {
  const criticalCount = metrics.filter((m) => m.status === "critical").length;
  const warningCount = metrics.filter((m) => m.status === "warning").length;

  const overallStatus =
    criticalCount > 0 ? "critical" :
    warningCount > 0 ? "warning" : "ok";

  const overallLabel =
    overallStatus === "critical" ? "Action Required" :
    overallStatus === "warning" ? "Monitor" : "Healthy";

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Foundry Health</h3>
        <span className={`text-xs font-mono font-semibold ${STATUS_STYLES[overallStatus]}`}>
          {overallLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">{metric.label}</p>
            <p className={`text-xl font-semibold ${STATUS_STYLES[metric.status]}`}>
              {metric.value}
            </p>
            {metric.detail && (
              <p className="text-[11px] text-white/30">{metric.detail}</p>
            )}
          </div>
        ))}
      </div>

      {criticalCount > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5">
          <p className="text-xs text-red-400/80">
            {criticalCount} metric{criticalCount > 1 ? "s" : ""} require immediate attention.
          </p>
        </div>
      )}
    </div>
  );
}
