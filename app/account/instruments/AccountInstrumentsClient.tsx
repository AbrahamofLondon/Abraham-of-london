"use client";

import * as React from "react";
import { ArrowRight, Download, RefreshCw } from "lucide-react";

type InstrumentRun = {
  runId: string;
  instrumentSlug: string;
  instrumentName: string;
  status: string;
  artifactReady: boolean;
  artifactDownloadUrl: string | null;
  artifactHash: string | null;
  outcomeHypothesisId: string | null;
  nextRouteSlug: string | null;
  score: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
};

type HistoryResponse = {
  ok: boolean;
  error?: string;
  summary?: {
    total: number;
    completed: number;
    failed: number;
    withArtifacts: number;
  };
  runs?: InstrumentRun[];
};

const GOLD = "#C9A96E";
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

function formatDate(value: string | null): string {
  if (!value) return "In progress";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resultSummary(score: Record<string, unknown> | null): string {
  if (!score) return "No result payload recorded.";
  const tier = typeof score.tier === "string" ? score.tier : null;
  const value = typeof score.score === "number" ? `${score.score}/100` : null;
  const recommendation = typeof score.recommendation === "string" ? score.recommendation : null;
  return [tier, value, recommendation].filter(Boolean).join(" · ") || "Result recorded.";
}

export default function AccountInstrumentsClient() {
  const [data, setData] = React.useState<HistoryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instruments/runs/me", { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData({ ok: false, error: "Could not load instrument history." });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const runs = data?.runs ?? [];

  return (
    <main className="min-h-screen bg-[#0b0a09] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>
              Account
            </p>
            <h1 className="text-2xl font-semibold">Decision instrument history</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/65"
            style={mono}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {data?.summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Total", data.summary.total],
              ["Completed", data.summary.completed],
              ["Failed", data.summary.failed],
              ["Artifacts", data.summary.withArtifacts],
            ].map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xl font-semibold" style={{ color: GOLD }}>
                  {value}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35" style={mono}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-sm text-white/45">Loading instrument history...</p>}

        {!loading && (!data?.ok || data.error) && (
          <div className="border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-100/75">
            {data?.error ?? "Authentication required."}
          </div>
        )}

        {!loading && data?.ok && runs.length === 0 && (
          <div className="border border-white/10 bg-white/[0.02] p-8 text-sm text-white/45">
            No paid instrument runs have been recorded for this account.
          </div>
        )}

        <div className="grid gap-3">
          {runs.map((run) => (
            <article key={run.runId} className="border border-white/10 bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/35" style={mono}>
                    {formatDate(run.completedAt ?? run.startedAt)} · {run.status}
                  </p>
                  <h2 className="mt-2 text-lg font-medium">{run.instrumentName}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                    {resultSummary(run.score)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {run.artifactReady && run.artifactDownloadUrl && (
                    <a
                      href={run.artifactDownloadUrl}
                      className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70"
                      style={mono}
                    >
                      <Download size={13} />
                      Artifact
                    </a>
                  )}
                  {run.artifactHash && (
                    <span
                      className="inline-flex items-center gap-2 border border-white/5 px-3 py-2 text-[9px] text-white/35"
                      style={mono}
                      title={`SHA-256: ${run.artifactHash}`}
                    >
                      {run.artifactHash.substring(0, 12)}...
                    </span>
                  )}
                  {run.outcomeHypothesisId && (
                    <span
                      className="inline-flex items-center gap-2 border border-amber-500/20 px-3 py-2 text-[9px] text-amber-400/60"
                      style={mono}
                    >
                      Outcome tracked
                    </span>
                  )}
                  {run.nextRouteSlug && (
                    <a
                      href={run.nextRouteSlug}
                      className="inline-flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.16em]"
                      style={{ ...mono, borderColor: `${GOLD}55`, color: GOLD }}
                    >
                      Next
                      <ArrowRight size={13} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
