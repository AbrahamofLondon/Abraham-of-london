// components/admin/decision/DecisionPerformanceTable.tsx
"use client";

import * as React from "react";

export type DecisionPerformanceRow = {
  assetId: string;
  assetTitle: string;
  assetHref?: string | null;
  assetKind: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  adaptiveWeight: number;
  lastInteractionAt?: string | null;
};

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatWeight(value: number): string {
  return value.toFixed(2);
}

export function DecisionPerformanceTable({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: DecisionPerformanceRow[];
  emptyMessage?: string;
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
          {emptyMessage || "No performance data available."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-neutral-50">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Kind
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Impressions
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Clicks
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Conversions
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  CTR
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  CVR
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Weight
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  Last Interaction
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.assetId}
                  className="border-b border-neutral-100 align-top hover:bg-neutral-50/60"
                >
                  <td className="px-6 py-4">
                    <div className="max-w-[360px]">
                      <div className="font-medium text-neutral-900">
                        {row.assetTitle}
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-neutral-400">
                        {row.assetId}
                      </div>
                      {row.assetHref ? (
                        <a
                          href={row.assetHref}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-[12px] text-amber-700 hover:text-amber-800"
                        >
                          Open asset
                        </a>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-neutral-600">{row.assetKind}</td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.impressions}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.clicks}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {row.conversions}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {formatPercent(row.clickThroughRate)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-neutral-800">
                    {formatPercent(row.conversionRate)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-mono ${
                        row.adaptiveWeight >= 1.2
                          ? "bg-emerald-100 text-emerald-700"
                          : row.adaptiveWeight <= 0.9
                          ? "bg-red-100 text-red-700"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {formatWeight(row.adaptiveWeight)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-500">
                    {row.lastInteractionAt
                      ? new Date(row.lastInteractionAt).toLocaleString()
                      : "—"}
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