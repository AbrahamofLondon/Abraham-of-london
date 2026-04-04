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
    severityScore: number;
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

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-6 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-500">
            Admin Decision Intelligence
          </div>
          <h1 className="mt-2 text-4xl font-light tracking-tight text-neutral-900">
            Session Contextual Ranking
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">
            This surface resolves ranking from the canonical snapshot stored for a
            specific session, not from legacy posture fragments. The ranked assets
            are judged inside the exact narrative and intervention context shown to
            the user.
          </p>
        </div>

        <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value)}
                placeholder="Enter strategy room session key..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-11 py-3 text-sm text-neutral-900 outline-none focus:border-[#C9A96A]/35"
              />
            </div>

            <button
              onClick={() => void loadRanking()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C9A96A]/30 bg-[#C9A96A]/10 px-5 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[#8A6A2F] hover:bg-[#C9A96A]/15 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Load Ranking"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    Session Key
                  </div>
                  <div className="mt-2 text-sm font-mono break-all text-neutral-800">
                    {data.sessionKey}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
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