// components/admin/decision/ContextualRankingPanel.tsx
"use client";

import * as React from "react";

type Row = {
  assetId: string;
  assetTitle: string;
  assetHref?: string | null;
  assetKind: string;
  contextType: string;
  contextValue: string;
  contextualWeight: number;
  confidenceScore: number;
  usefulnessScore: number;
  impressions: number;
  clicks: number;
  conversions: number;
  assistedConversions?: number;
  routeImprovements: number;
  readinessImprovements: number;
  clarityGain?: number;
  authorityGain?: number;
  governanceGain?: number;
  constitutionalSource?: boolean;
  updatedAt?: string;
};

export function ContextualRankingPanel({
  title,
  rows,
}: {
  title: string;
  rows: Row[];
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
          No contextual ranking data available.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <div key={`${row.assetId}-${row.contextType}-${row.contextValue}`} className="px-6 py-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
                    <span>
                      {row.contextType} · {row.contextValue}
                    </span>
                    {row.constitutionalSource ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        constitutional
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-lg font-medium text-neutral-900">
                    {row.assetTitle}
                  </div>

                  <div className="mt-1 text-[11px] font-mono text-neutral-400">
                    {row.assetKind} · {row.assetId}
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
                      Context Weight
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {row.contextualWeight.toFixed(2)}
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

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Usefulness
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {row.usefulnessScore.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Route Improve
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {row.routeImprovements}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-8">
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
                  Assisted: <span className="font-mono text-neutral-800">{row.assistedConversions ?? 0}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Readiness +: <span className="font-mono text-neutral-800">{row.readinessImprovements}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Clarity Δ: <span className="font-mono text-neutral-800">{(row.clarityGain ?? 0).toFixed(2)}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Authority Δ: <span className="font-mono text-neutral-800">{(row.authorityGain ?? 0).toFixed(2)}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Governance Δ: <span className="font-mono text-neutral-800">{(row.governanceGain ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}