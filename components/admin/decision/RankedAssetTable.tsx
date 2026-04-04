// components/admin/decision/RankedAssetTable.tsx
"use client";

import * as React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

type RankedAsset = {
  assetId: string;
  title: string;
  kind: string;
  href?: string | null;
  impressions: number;
  conversions: number;
  conversionRate: number;
  avgRank?: number;
  avgMatchScore?: number;
  contextualLift: number;
  reasons: string[];
};

function reasonTone(reason: string): string {
  const text = reason.toLowerCase();

  if (
    text.includes("governance") ||
    text.includes("board") ||
    text.includes("authority")
  ) {
    return "border-[#C9A96A]/30 bg-[#C9A96A]/10 text-[#8A6A2F]";
  }

  if (
    text.includes("failure") ||
    text.includes("risk") ||
    text.includes("drift")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    text.includes("intervention") ||
    text.includes("execution") ||
    text.includes("clarify")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function RankedAssetTable({
  items,
  title = "Ranked Assets",
}: {
  items: RankedAsset[];
  title?: string;
}) {
  return (
    <section className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-neutral-500" />
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">
          {title}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
          No ranked assets available for this canonical context.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.assetId}-${idx}`}
              className="rounded-[24px] border border-neutral-200 bg-neutral-50/60 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-600">
                      #{idx + 1}
                    </span>
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-600">
                      {item.kind}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-700">
                      Lift {item.contextualLift}
                    </span>
                  </div>

                  <h4 className="mt-3 text-lg font-medium leading-7 text-neutral-900">
                    {item.title}
                  </h4>

                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-neutral-600 hover:text-black"
                    >
                      Open asset
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Impressions
                    </div>
                    <div className="mt-1 text-lg font-light text-neutral-900">
                      {item.impressions}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Conversions
                    </div>
                    <div className="mt-1 text-lg font-light text-neutral-900">
                      {item.conversions}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Conversion Rate
                    </div>
                    <div className="mt-1 text-lg font-light text-neutral-900">
                      {(item.conversionRate * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Avg Match
                    </div>
                    <div className="mt-1 text-lg font-light text-neutral-900">
                      {item.avgMatchScore?.toFixed(1) ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Avg Rank
                    </div>
                    <div className="mt-1 text-lg font-light text-neutral-900">
                      {item.avgRank?.toFixed(2) ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                      Asset ID
                    </div>
                    <div className="mt-1 text-sm font-mono text-neutral-700 break-all">
                      {item.assetId}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                  Recommendation Rationale
                </div>
                {item.reasons?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span
                        key={`${item.assetId}-${reason}`}
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${reasonTone(
                          reason
                        )}`}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No rationale recorded for this recommendation.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}