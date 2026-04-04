// components/admin/decision/ConditionalEfficacyPanel.tsx
"use client";

import * as React from "react";

type ConditionalRow = {
  key: string;
  assetCount: number;
  impressions: number;
  clicks: number;
  conversions: number;
  followups: number;
  routeImprovements: number;
  readinessImprovements: number;
  ctr: number;
  routeImproveRate: number;
  readinessImproveRate: number;
  conversionRate: number;
  avgClarityGain: number;
  avgAuthorityGain: number;
};

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function ConditionalEfficacyPanel({
  title,
  rows,
}: {
  title: string;
  rows: ConditionalRow[];
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-600">
          {title}
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-10 text-sm text-neutral-500">
          No conditional efficacy data available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-neutral-50">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Condition
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Assets
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Followups
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  CTR
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Route Improve
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Readiness Improve
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Conversion
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Clarity Δ
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Authority Δ
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-neutral-100 hover:bg-neutral-50/60"
                >
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {row.key}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.assetCount}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.followups}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {pct(row.ctr)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {pct(row.routeImproveRate)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {pct(row.readinessImproveRate)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {pct(row.conversionRate)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.avgClarityGain.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-neutral-800">
                    {row.avgAuthorityGain.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}