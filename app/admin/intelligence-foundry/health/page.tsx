// app/admin/intelligence-foundry/health/page.tsx
"use client";

import * as React from "react";
import { FoundryHealthPanel } from "@/components/research/FoundryHealthPanel";
import Link from "next/link";

type HealthData = {
  runsThisWeek: number;
  runsThisMonth: number;
  distinctActors: number;
  actionConversionRate: number;
  avgTimeToImplementDays: number;
  dormantModules: string[];
  redTeamConversionRate: number;
  outboundBlockedCount: number;
  overallStatus: "ok" | "warning" | "critical";
};

export default function FoundryHealthPage() {
  const [data, setData] = React.useState<HealthData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d.health);
        else setError(d.error ?? "Failed to load health");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Foundry Health</h1>
        <p className="text-sm text-white/35">Real ResearchRun data — no placeholder metrics.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}

      {loading && (
        <div className="text-xs text-white/25 animate-pulse">Loading health data…</div>
      )}

      {data && (
        <>
          <FoundryHealthPanel
            metrics={[
              {
                label: "Runs this week",
                value: data.runsThisWeek,
                status: data.runsThisWeek === 0 ? "warning" : "ok",
              },
              {
                label: "Runs this month",
                value: data.runsThisMonth,
                status: data.runsThisMonth < 5 ? "warning" : "ok",
              },
              {
                label: "Active actors",
                value: data.distinctActors,
                status: "neutral",
              },
              {
                label: "Action conversion",
                value: `${Math.round(data.actionConversionRate * 100)}%`,
                status: data.actionConversionRate < 0.15 ? "warning" : "ok",
                detail: "ACTION_REQUIRED → IMPLEMENTED",
              },
              {
                label: "Avg to implement",
                value: `${data.avgTimeToImplementDays.toFixed(1)}d`,
                status: data.avgTimeToImplementDays > 14 ? "warning" : "ok",
              },
              {
                label: "Red team conversion",
                value: `${Math.round(data.redTeamConversionRate * 100)}%`,
                status: data.redTeamConversionRate < 0.1 ? "warning" : "ok",
                detail: "Red team → production action",
              },
              {
                label: "Outbound blocked",
                value: data.outboundBlockedCount,
                status: "neutral",
                detail: "Posts blocked before publish",
              },
            ]}
          />

          {data.dormantModules.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60 mb-3">
                Dormant Modules (no runs in 14+ days)
              </p>
              <div className="space-y-1">
                {data.dormantModules.map((mod) => (
                  <p key={mod} className="text-xs text-amber-300/60 font-mono">— {mod}</p>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/8 bg-white/2 p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25 mb-3">Thresholds</p>
            <div className="space-y-1 text-xs text-white/35">
              <p>14 days no runs → yellow warning</p>
              <p>21 days no runs → red owner warning</p>
              <p>60 days unused module → module review flag</p>
              <p>90 days &lt;15% action conversion → effectiveness review</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
