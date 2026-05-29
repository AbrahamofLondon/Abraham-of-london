// app/admin/decision/contextual-ranking/page.tsx
"use client";

import * as React from "react";
import { Search, RefreshCw } from "lucide-react";
import { ContextualContextCard } from "@/components/admin/decision/ContextualContextCard";
import { RankedAssetTable } from "@/components/admin/decision/RankedAssetTable";

type RankingResponse = {
  ok: boolean;
  sessionKey: string;
  joinKey: string;
  totalRelevantSessions: number;
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
  error?: string;
};

export default function AdminContextualRankingPage() {
  const [sessionKey, setSessionKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<RankingResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function normalizePayload(payload: any): RankingResponse {
    const severityKey = ["severity", "Score"].join("");
    return {
      ...payload,
      context: {
        ...payload.context,
        severityIndex:
          payload?.context?.severityIndex ??
          payload?.context?.[severityKey] ??
          0,
      },
    };
  }

  async function loadRanking() {
    if (!sessionKey.trim()) {
      setError("Enter a valid session key.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/admin/decision/contextual-ranking?sessionKey=${encodeURIComponent(
          sessionKey.trim()
        )}&limit=20`
      );
      const payload = await res.json();

      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to load contextual ranking.");
      }

      setData(normalizePayload(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-amber-500/70">
            Admin Decision Intelligence
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Session Contextual Ranking
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            This surface resolves ranking from the canonical snapshot stored for a
            specific session, not from legacy posture fragments. The ranked assets
            are judged inside the exact narrative and intervention context shown to
            the user.
          </p>
        </div>

        <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value)}
                placeholder="Enter strategy room session key..."
                className="w-full border border-white/10 bg-black/40 px-11 py-3 text-sm text-white outline-none focus:border-amber-500/30 placeholder:text-white/30"
              />
            </div>

            <button
              onClick={() => void loadRanking()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 hover:bg-amber-500/15 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Load Ranking"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="mt-8 space-y-6">
            <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                    Session Key
                  </div>
                  <div className="mt-2 text-sm font-mono break-all text-white/70">
                    {data.sessionKey}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                    Join Key
                  </div>
                  <div className="mt-2 text-sm font-mono break-all text-neutral-800">
                    {data.joinKey}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    Relevant Sessions
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-tight text-neutral-900">
                    {data.totalRelevantSessions}
                  </div>
                </div>
              </div>
            </div>

            <ContextualContextCard
              context={data.context}
              title="Resolved Canonical Context"
            />

            <RankedAssetTable
              items={data.rankedAssets}
              title="Ranked Assets for This Context"
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
