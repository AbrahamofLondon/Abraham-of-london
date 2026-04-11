import * as React from "react";
import type { ExecutiveCommandCentreData } from "@/lib/constitution/command-centre-types";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function badgeClass(value: string) {
  if (value === "SOUND") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (value === "WATCH") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (value === "STRAINED") return "border-orange-400/20 bg-orange-500/10 text-orange-300";
  return "border-red-400/20 bg-red-500/10 text-red-300";
}

export default function ConstitutionalHealthStrip({
  data,
}: {
  data: ExecutiveCommandCentreData;
}) {
  const breachMetric = data.metrics.find((x) => x.id === "breaches");
  const tribunalMetric = data.metrics.find((x) => x.id === "tribunals");
  const routeMetric = data.metrics.find((x) => x.id === "route-integrity");

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cx(
            "rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]",
            badgeClass(data.healthBand),
          )}
        >
          {data.healthBand.replace(/_/g, " ")}
        </span>

        {routeMetric ? (
          <span className="text-[11px] text-white/60">
            Route integrity: {routeMetric.value}
          </span>
        ) : null}

        {breachMetric ? (
          <span className="text-[11px] text-white/60">
            Breaches: {breachMetric.value}
          </span>
        ) : null}

        {tribunalMetric ? (
          <span className="text-[11px] text-white/60">
            Open tribunals: {tribunalMetric.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}