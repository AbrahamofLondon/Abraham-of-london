// components/admin/decision/SignalRegistryTable.tsx

"use client";

import * as React from "react";

type DecisionSignalSeverity =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type DecisionSignalStatus =
  | "HEALTHY"
  | "WATCH"
  | "ELEVATED"
  | "CRITICAL";

type RegistryItem = {
  registryKey: string;
  assetId: string;
  assetTitle: string;
  assetKind: string;
  contextType: string;
  contextValue: string;
  status: DecisionSignalStatus;
  highestSeverity: DecisionSignalSeverity;
  healthScore: number;
  driftScore: number;
  resonanceScore: number;
  confidenceScore: number | null;
  resonanceBand: string | null;
  alertCount: number;
  generatedAt: string;
};

type Props = {
  items: RegistryItem[];
};

function severityTone(severity: DecisionSignalSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "HIGH":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    case "MEDIUM":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "LOW":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "NONE":
    default:
      return "bg-white/5 text-white/65 border-white/10";
  }
}

function statusTone(status: DecisionSignalStatus): string {
  switch (status) {
    case "CRITICAL":
      return "text-rose-300";
    case "ELEVATED":
      return "text-orange-300";
    case "WATCH":
      return "text-amber-300";
    case "HEALTHY":
    default:
      return "text-emerald-300";
  }
}

function fmt(value: number | null | undefined, places = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toFixed(places);
}

export default function SignalRegistryTable({ items }: Props) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md">
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="font-serif text-2xl text-white">Decision Signal Registry</h2>
        <p className="mt-1 text-xs font-mono uppercase tracking-[0.16em] text-white/45">
          Unified drift, resonance, and governance health surface
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm text-white/80">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4">Context</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Health</th>
              <th className="px-6 py-4">Drift</th>
              <th className="px-6 py-4">Resonance</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4">Band</th>
              <th className="px-6 py-4">Alerts</th>
              <th className="px-6 py-4">Generated</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr
                key={item.registryKey}
                className="transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{item.assetTitle}</div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.12em] text-white/35">
                    {item.assetKind} · {item.assetId}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-white/80">{item.contextValue}</div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.12em] text-white/35">
                    {item.contextType}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${severityTone(item.highestSeverity)}`}
                  >
                    {item.highestSeverity}
                  </span>
                </td>

                <td className="px-6 py-4 font-mono">{fmt(item.healthScore)}</td>
                <td className="px-6 py-4 font-mono">{fmt(item.driftScore)}</td>
                <td className="px-6 py-4 font-mono">{fmt(item.resonanceScore)}</td>
                <td className="px-6 py-4 font-mono">{fmt(item.confidenceScore)}</td>
                <td className="px-6 py-4 font-mono">{item.resonanceBand || "—"}</td>
                <td className="px-6 py-4 font-mono">{item.alertCount}</td>
                <td className="px-6 py-4 font-mono text-white/45">
                  {new Date(item.generatedAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-12 text-center text-sm text-white/40"
                >
                  No registry entries available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}