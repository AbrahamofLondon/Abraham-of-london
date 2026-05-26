// app/admin/intelligence-foundry/product-health/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthStatus = "GREEN" | "AMBER" | "RED" | "GREY";

type SurfaceHealth = {
  productSurfaceId: string;
  label: string;
  route: string;
  publicStatus: string;
  productRouteStatus: HealthStatus;
  canonicalRecordStatus: HealthStatus;
  adminOwnerStatus: HealthStatus;
  foundryCoverageStatus: HealthStatus;
  lineageCoverageStatus: HealthStatus;
  governanceEventStatus: HealthStatus;
  entitlementStatus: HealthStatus;
  outboundStatus: HealthStatus;
  openFindings: number;
  criticalFindings: number;
  actionRequiredCount: number;
  releaseBlockers: string[];
  overallStatus: HealthStatus;
  explanation: string;
};

type Summary = {
  green: number;
  amber: number;
  red: number;
  grey: number;
  total: number;
  releaseBlockers: number;
};

// ─── Styling ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<HealthStatus, string> = {
  GREEN: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  AMBER: "bg-amber-400/12 text-amber-300 border-amber-400/20",
  RED: "bg-red-500/15 text-red-300 border-red-500/20",
  GREY: "bg-white/5 text-white/40 border-white/10",
};

const STATUS_DOT: Record<HealthStatus, string> = {
  GREEN: "bg-emerald-400",
  AMBER: "bg-amber-400",
  RED: "bg-red-500",
  GREY: "bg-white/20",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  GREEN: "Governed",
  AMBER: "Partial",
  RED: "Exposed",
  GREY: "N/A",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductHealthPage() {
  const [surfaces, setSurfaces] = React.useState<SurfaceHealth[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [filter, setFilter] = React.useState<HealthStatus | "ALL">("ALL");
  const [selectedSurface, setSelectedSurface] = React.useState<SurfaceHealth | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/product-health")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSurfaces(data.surfaces);
          setSummary(data.summary);
        } else {
          setError(data.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  const filteredSurfaces = filter === "ALL" ? surfaces : surfaces.filter((s) => s.overallStatus === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-white/30 font-mono">Loading product health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400 m-6">{error}</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Product Health Dashboard</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Live integration status for the product ladder, admin ownership, canonical records,
          lineage, governance events, Foundry coverage, and release blockers.
        </p>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-5 gap-3">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-center">
            <p className="text-2xl font-mono font-semibold text-emerald-300">{summary.green}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/60 mt-1">Governed</p>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-center">
            <p className="text-2xl font-mono font-semibold text-amber-300">{summary.amber}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60 mt-1">Partial</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-2xl font-mono font-semibold text-red-300">{summary.red}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-red-400/60 mt-1">Exposed</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/2 p-3 text-center">
            <p className="text-2xl font-mono font-semibold text-white/40">{summary.grey}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mt-1">N/A</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-2xl font-mono font-semibold text-red-300">{summary.releaseBlockers}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-red-400/60 mt-1">Blockers</p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "RED", "AMBER", "GREEN", "GREY"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "rounded-lg border px-3 py-1.5 text-[11px] font-mono transition-all",
              filter === f
                ? f === "ALL" ? "border-white/20 bg-white/5 text-white/70"
                  : `${STATUS_STYLE[f]}`
                : "border-white/8 bg-white/2 text-white/40 hover:border-white/15",
            ].join(" ")}
          >
            {f === "ALL" ? `All (${surfaces.length})` : `${STATUS_LABEL[f]} (${surfaces.filter((s) => s.overallStatus === f).length})`}
          </button>
        ))}
      </div>

      {/* Product ladder table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="text-white/20 border-b border-white/8">
              <th className="text-left py-2 pr-3">Product</th>
              <th className="text-left py-2 pr-3">Route</th>
              <th className="text-left py-2 pr-3">Record</th>
              <th className="text-left py-2 pr-3">Admin</th>
              <th className="text-left py-2 pr-3">Foundry</th>
              <th className="text-left py-2 pr-3">Lineage</th>
              <th className="text-left py-2 pr-3">Events</th>
              <th className="text-left py-2 pr-3">Entitle</th>
              <th className="text-left py-2 pr-3">Outbound</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSurfaces.map((surface) => (
              <tr
                key={surface.productSurfaceId}
                onClick={() => setSelectedSurface(selectedSurface?.productSurfaceId === surface.productSurfaceId ? null : surface)}
                className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[surface.overallStatus]}`} />
                    <span className="text-white/70">{surface.label}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.productRouteStatus]}`}>
                    {surface.productRouteStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.canonicalRecordStatus]}`}>
                    {surface.canonicalRecordStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.adminOwnerStatus]}`}>
                    {surface.adminOwnerStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.foundryCoverageStatus]}`}>
                    {surface.foundryCoverageStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.lineageCoverageStatus]}`}>
                    {surface.lineageCoverageStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.governanceEventStatus]}`}>
                    {surface.governanceEventStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.entitlementStatus]}`}>
                    {surface.entitlementStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[surface.outboundStatus]}`}>
                    {surface.outboundStatus}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${STATUS_STYLE[surface.overallStatus]}`}>
                    {surface.overallStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Surface detail panel */}
      {selectedSurface && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selectedSurface.overallStatus]}`} />
              <h2 className="text-sm font-medium text-white/70">{selectedSurface.label}</h2>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest ${STATUS_STYLE[selectedSurface.overallStatus]}`}>
                {selectedSurface.overallStatus}
              </span>
            </div>
            <button onClick={() => setSelectedSurface(null)} className="text-white/20 hover:text-white/40 text-xs">✕</button>
          </div>

          <p className="text-xs text-white/40">{selectedSurface.explanation}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Route</p>
              <p className="text-[11px] font-mono text-white/50">{selectedSurface.route}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Access</p>
              <p className="text-[11px] font-mono text-white/50">{selectedSurface.publicStatus}</p>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: "canonicalRecordStatus", label: "Record" },
              { key: "productRouteStatus", label: "Route" },
              { key: "adminOwnerStatus", label: "Admin" },
              { key: "foundryCoverageStatus", label: "Foundry" },
              { key: "lineageCoverageStatus", label: "Lineage" },
              { key: "governanceEventStatus", label: "Events" },
              { key: "entitlementStatus", label: "Entitle" },
              { key: "outboundStatus", label: "Outbound" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="rounded border border-white/8 bg-white/2 p-2 text-center">
                <p className={`text-[10px] font-mono font-semibold ${
                  selectedSurface[key] === "GREEN" ? "text-emerald-400/70"
                  : selectedSurface[key] === "AMBER" ? "text-amber-400/70"
                  : selectedSurface[key] === "RED" ? "text-red-400/70"
                  : "text-white/30"
                }`}>{selectedSurface[key]}</p>
                <p className="text-[8px] font-mono uppercase tracking-wider text-white/20 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Findings */}
          {(selectedSurface.openFindings > 0 || selectedSurface.criticalFindings > 0) && (
            <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-red-400/60">Open Findings</p>
              <div className="flex gap-4">
                <p className="text-xs text-red-300/80">{selectedSurface.openFindings} total</p>
                <p className="text-xs text-red-300/80">{selectedSurface.criticalFindings} critical</p>
                <p className="text-xs text-red-300/80">{selectedSurface.actionRequiredCount} action required</p>
              </div>
            </div>
          )}

          {/* Release blockers */}
          {selectedSurface.releaseBlockers.length > 0 && (
            <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-red-400/60">Release Blockers</p>
              {selectedSurface.releaseBlockers.map((b, i) => (
                <p key={i} className="text-[11px] text-red-300/70">· {b}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredSurfaces.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-8 text-center">
          <p className="text-sm text-white/30">No surfaces match the selected filter.</p>
        </div>
      )}
    </div>
  );
}
