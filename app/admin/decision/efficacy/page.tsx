// app/admin/decision/efficacy/page.tsx
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DecisionEfficacyPanel } from "@/components/admin/decision/DecisionEfficacyPanel";
import { RebuildEfficacyButton } from "@/components/admin/decision/RebuildEfficacyButton";
import { ConditionalEfficacyPanel } from "@/components/admin/decision/ConditionalEfficacyPanel";
import { ContextualRankingPanel } from "@/components/admin/decision/ContextualRankingPanel";
import { ShieldCheck, Crown } from "lucide-react";

async function getEfficacyData() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  const [efficacyResponse, contextualResponse] = await Promise.all([
    fetch(`${base}/api/admin/decision/efficacy`, { 
      cache: "no-store",
      next: { revalidate: 0 }
    }),
    fetch(`${base}/api/admin/decision/contextual-ranking`, { 
      cache: "no-store",
      next: { revalidate: 0 }
    }),
  ]);

  if (!efficacyResponse.ok) {
    throw new Error(`Failed to load efficacy data: ${efficacyResponse.status}`);
  }
  if (!contextualResponse.ok) {
    throw new Error(`Failed to load contextual ranking: ${contextualResponse.status}`);
  }

  const [efficacy, contextual] = await Promise.all([
    efficacyResponse.json(),
    contextualResponse.json(),
  ]);

  return { efficacy, contextual };
}

function StatCard({
  label,
  value,
  subtext,
  accent = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-6 transition-all ${accent ? "border-amber-200 bg-amber-50/50" : "border-neutral-200 bg-white"}`}>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">
        {label}
      </div>
      <div className={`mt-3 text-4xl font-light tracking-tighter ${accent ? "text-amber-700" : "text-neutral-950"}`}>
        {value}
      </div>
      {subtext && <div className="mt-2 text-sm text-neutral-500 leading-relaxed">{subtext}</div>}
    </div>
  );
}

export default async function DecisionEfficacyPage() {
  let efficacyData;
  let error: string | null = null;

  try {
    efficacyData = await getEfficacyData();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load efficacy metrics.";
  }

  if (error || !efficacyData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-red-500 mb-6" />
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">Unable to Load Efficacy Data</h2>
          <p className="text-neutral-600">{error}</p>
          <RebuildEfficacyButton className="mt-8" />
        </div>
      </div>
    );
  }

  const { efficacy, contextual } = efficacyData;
  const summary = efficacy.summary || {};
  const contextualSummary = contextual.summary || {
    totalRows: 0,
    constitutionalRows: 0,
    avgContextualWeight: 0,
    avgConfidenceScore: 0,
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-mono tracking-[0.3em] text-amber-700">
              <Crown className="h-3.5 w-3.5" />
              GOVERNED INTELLIGENCE
            </div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">
              Constitutional Decision Efficacy
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-neutral-600">
              All metrics now derive from the constitutional spine. 
              Route improvements, readiness deltas, and decision usefulness are measured against fixed governing principles — not reconstructed heuristics.
            </p>
          </div>

          <div className="flex-shrink-0">
            <RebuildEfficacyButton />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tracked Assets"
            value={summary.totalAssets ?? 0}
            subtext="Assets with computed efficacy records"
          />
          <StatCard
            label="Total Follow-ups"
            value={summary.totalFollowups ?? 0}
            subtext="Observed post-guidance constitutional outcomes"
            accent
          />
          <StatCard
            label="Route Improved"
            value={summary.routeImprovedSessions ?? 0}
            subtext="Sessions that moved upward in constitutional quality"
          />
          <StatCard
            label="Converted After Guidance"
            value={summary.convertedAfterGuidance ?? 0}
            subtext="Follow-ups marked as converted"
          />
        </div>

        <div className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Context Rows"
            value={contextualSummary.totalRows}
            subtext="Contextual performance records"
          />
          <StatCard
            label="Constitutional Rows"
            value={contextualSummary.constitutionalRows}
            subtext="Rows explicitly marked as constitutionally governed"
            accent
          />
          <StatCard
            label="Avg Contextual Lift"
            value={contextualSummary.avgContextualWeight.toFixed(2)}
            subtext="Mean contextual lift"
          />
          <StatCard
            label="Avg Confidence"
            value={`${(contextualSummary.avgConfidenceScore * 100).toFixed(0)}%`}
            subtext="Average confidence in contextual ranking"
          />
        </div>

        <div className="mb-12 grid gap-5 md:grid-cols-2">
          <StatCard
            label="Average Efficacy Score"
            value={summary.avgEfficacyScore?.toFixed(2) ?? "0.00"}
            subtext="Composite measure of decision effect"
          />
          <StatCard
            label="Average Decision Usefulness"
            value={summary.avgDecisionUsefulness?.toFixed(2) ?? "0.00"}
            subtext="Usefulness oriented toward judgment improvement"
          />
        </div>

        {/* Panels */}
        <div className="space-y-10">
          <DecisionEfficacyPanel
            title="Top Effective Assets"
            rows={efficacy.topEffective || []}
            emptyMessage="No effective assets identified yet."
          />

          <DecisionEfficacyPanel
            title="Top Useful Assets"
            rows={efficacy.topUseful || []}
            emptyMessage="No high-usefulness assets identified yet."
          />

          <DecisionEfficacyPanel
            title="Top Route Improvers"
            rows={efficacy.routeImprovers || []}
            emptyMessage="No route-improving assets detected yet."
          />

          {/* Conditional Panels */}
          <ConditionalEfficacyPanel
            title="Conditional Efficacy — By Sector"
            rows={efficacy.conditional?.bySector || []}
          />
          <ConditionalEfficacyPanel
            title="Conditional Efficacy — By Route"
            rows={efficacy.conditional?.byRoute || []}
          />
          <ConditionalEfficacyPanel
            title="Conditional Efficacy — By Readiness Tier"
            rows={efficacy.conditional?.byReadinessTier || []}
          />
          <ConditionalEfficacyPanel
            title="Conditional Efficacy — By Authority Type"
            rows={efficacy.conditional?.byAuthorityType || []}
          />
          <ConditionalEfficacyPanel
            title="Conditional Efficacy — By Organisational State"
            rows={efficacy.conditional?.byOrgState || []}
          />

          {/* Contextual Ranking Panels */}
          <ContextualRankingPanel
            title="Best Assets by Sector"
            rows={contextual.bySector || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Route"
            rows={contextual.byRoute || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Readiness Tier"
            rows={contextual.byReadinessTier || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Authority Type"
            rows={contextual.byAuthorityType || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Organisational State"
            rows={contextual.byOrgState || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Market Risk Band"
            rows={contextual.byMarketRiskBand || []}
          />
          <ContextualRankingPanel
            title="Best Assets by Revenue Band"
            rows={contextual.byRevenueBand || []}
          />

          {/* Full Registry */}
          <DecisionEfficacyPanel
            title="Full Decision Efficacy Registry"
            rows={efficacy.assets || []}
            emptyMessage="No efficacy records found."
          />
        </div>
      </div>
    </div>
  );
}
