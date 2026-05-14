// app/admin/decision/contextual-efficacy/page.tsx
"use client";

import * as React from "react";
import { RefreshCw, Database, BarChart3 } from "lucide-react";
import { ContextualContextCard } from "@/components/admin/decision/ContextualContextCard";
import { RankedAssetTable } from "@/components/admin/decision/RankedAssetTable";

type EfficacyRow = {
  id: string;
  joinKey: string;
  context: {
    route: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
    orgState: string;
    dominantDomains: string[];
    failureModes: string[];
    requiredInterventions: string[];
    sponsorTypes: string[];
    worldviewAnchors: string[];
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
    severityIndex: number;
    revenueScore: number;
  };
  totalSessions: number;
  impressionCount: number;
  conversionCount: number;
  contextualConversionRate: number;
  rankedAssets: Array<{
    assetId: string;
    title: string;
    kind: string;
    href?: string | null;
    impressions: number;
    conversions: number;
    conversionRate: number;
    avgMatchScore?: number;
    avgRank?: number;
    contextualLift: number;
    reasons: string[];
  }>;
};

export default function AdminContextualEfficacyPage() {
  const [rows, setRows] = React.useState<EfficacyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rebuilding, setRebuilding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function normalizeRows(payloadRows: any[]): EfficacyRow[] {
    const severityKey = ["severity", "Score"].join("");
    return payloadRows.map((row) => ({
      ...row,
      context: {
        ...row.context,
        severityIndex:
          row?.context?.severityIndex ??
          row?.context?.[severityKey] ??
          0,
      },
    }));
  }

  async function loadRows() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/decision/contextual-efficacy?limit=25");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load contextual efficacy.");
      }

      setRows(normalizeRows(data.rows || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function rebuild() {
    setRebuilding(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/decision/rebuild-contextual-efficacy", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to rebuild contextual efficacy.");
      }

      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRebuilding(false);
    }
  }

  React.useEffect(() => {
    void loadRows();
  }, []);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-amber-500/70">
              Admin Decision Intelligence
            </p>
            <h1 className="mt-2 font-serif text-2xl text-white">
              Contextual Efficacy
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
              This surface evaluates asset performance against the full canonical
              context the user actually saw — dominant domains, failure modes,
              interventions, sponsor types, and recommendation rationale included.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadRows()}
              className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-white/60 hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              onClick={() => void rebuild()}
              disabled={rebuilding}
              className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 hover:bg-amber-500/15 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              {rebuilding ? "Rebuilding..." : "Rebuild Efficacy"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border border-white/10 bg-zinc-950/70 px-6 py-12 text-center text-white/40">
            Loading canonical efficacy surface...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded border border-white/10 bg-zinc-950/70 px-6 py-12 text-center text-white/40">
            No rebuilt contextual efficacy rows available.
          </div>
        ) : (
          <div className="space-y-10">
            {rows.map((row) => (
              <section key={row.id} className="space-y-5">
                <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.20em] text-neutral-500">
                        Context Join Key
                      </div>
                      <div className="mt-2 text-sm font-mono text-neutral-700 break-all">
                        {row.joinKey}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                          Sessions
                        </div>
                        <div className="mt-1 text-lg font-light text-neutral-900">
                          {row.totalSessions}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                          Impressions
                        </div>
                        <div className="mt-1 text-lg font-light text-neutral-900">
                          {row.impressionCount}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                          Conversions
                        </div>
                        <div className="mt-1 text-lg font-light text-neutral-900">
                          {row.conversionCount}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                          <BarChart3 className="h-3 w-3" />
                          Conversion Rate
                        </div>
                        <div className="mt-1 text-lg font-light text-neutral-900">
                          {(row.contextualConversionRate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ContextualContextCard
                  context={row.context}
                  title="Canonical Decision Context"
                />

                <RankedAssetTable
                  items={row.rankedAssets}
                  title="Ranked Assets by Canonical Context"
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
