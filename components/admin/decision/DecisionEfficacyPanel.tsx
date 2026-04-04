// components/admin/decision/DecisionEfficacyPanel.tsx
"use client";

import * as React from "react";

type EfficacyRow = {
  assetId: string;
  assetTitle: string;
  assetHref?: string | null;
  assetKind: string;
  impressions: number;
  clicks: number;
  conversions: number;
  assistedConversions: number;
  routeImprovements: number;
  readinessImprovements: number;
  clarityImprovements: number;
  authorityImprovements: number;
  efficacyScore: number;
  decisionUsefulnessScore: number;
  confidenceScore: number;
};

function scoreTone(value: number) {
  if (value >= 8) return "bg-emerald-100 text-emerald-700";
  if (value >= 4) return "bg-amber-100 text-amber-700";
  return "bg-neutral-100 text-neutral-700";
}

export function DecisionEfficacyPanel({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: EfficacyRow[];
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
          {emptyMessage || "No efficacy data available."}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <div key={row.assetId} className="px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
                    {row.assetKind}
                  </div>
                  <div className="mt-2 text-lg font-medium text-neutral-900">
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
                      className="mt-2 inline-block text-sm text-amber-700 hover:text-amber-800"
                    >
                      Open asset
                    </a>
                  ) : null}
                </div>

                <div className="grid min-w-[360px] grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Efficacy
                    </div>
                    <div
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-mono ${scoreTone(
                        row.efficacyScore
                      )}`}
                    >
                      {row.efficacyScore.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Usefulness
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {row.decisionUsefulnessScore.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Route Improved
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {row.routeImprovements}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Confidence
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {(row.confidenceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className="text-sm text-neutral-500">
                  Impressions: <span className="font-mono text-neutral-800">{row.impressions}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Clicks: <span className="font-mono text-neutral-800">{row.clicks}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Conversions: <span className="font-mono text-neutral-800">{row.conversions}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Assisted: <span className="font-mono text-neutral-800">{row.assistedConversions}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Clarity Δ: <span className="font-mono text-neutral-800">{row.clarityImprovements.toFixed(2)}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Authority Δ: <span className="font-mono text-neutral-800">{row.authorityImprovements.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}