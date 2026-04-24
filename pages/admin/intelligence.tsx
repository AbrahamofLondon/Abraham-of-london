/* pages/admin/intelligence.tsx — REAL-TIME AUDIT & INTELLIGENCE VIEW */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/access/server";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Crown,
  BarChart3,
  Sparkles,
  Zap,
  Eye,
  Compass,
} from "lucide-react";
import { SovereignDashboard } from "@/lib/components/ai/SovereignDashboard";
import { KnowledgeGraph } from "@/components/Intelligence/KnowledgeGraph";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";

interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  resourceName: string | null;
  severity: string;
  createdAt: string;
  metadata?: unknown;
}

interface DealFlowSubmission {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  revenue: string;
  score: number;
  route: string;
  aiScore: number | null;
  aiConfidence: number | null;
  aiIntent: string | null;
  aiDealQuality: string | null;
  aiSummary: string | null;
  status: string;
  priority: string | null;
  authority?: string;
  problem?: string;
  urgency?: string;
}

interface DealFlowStats {
  strategy: number;
  diagnostic: number;
  reject: number;
  avg: number;
  submissions: DealFlowSubmission[];
  ai: {
    highQualityDeals: number;
    avgAiConfidence: number;
    intentDistribution: {
      STRATEGY: number;
      DIAGNOSTIC: number;
      NURTURE: number;
      REJECT: number;
    };
  };
}

type CanonicalContext = {
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

type EfficacyRow = {
  id: string;
  joinKey: string;
  context: CanonicalContext;
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
    avgRank?: number;
    avgMatchScore?: number;
    contextualLift: number;
    reasons: string[];
  }>;
};

interface IntelligenceProps {
  logs: AuditLogEntry[];
  stats: {
    totalDownloads: number;
    activeUsers24h: number;
    topAsset: string;
  };
  dealFlowStats?: DealFlowStats | null;
  canonicalEfficacy?: EfficacyRow[];
}

function DealFlowBlock({
  initialData,
}: {
  initialData?: DealFlowStats | null;
}) {
  const [data, setData] = React.useState<DealFlowStats | null>(initialData || null);
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedView, setExpandedView] = React.useState(false);
  const [selectedDeal, setSelectedDeal] = React.useState<{
    submission: DealFlowSubmission;
    input: any;
    result: any;
  } | null>(null);

  React.useEffect(() => {
    if (initialData) return;

    fetch("/api/admin/deal-flow-stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch deal flow stats");
        return r.json();
      })
      .then((stats) => {
        setData(stats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Deal flow stats error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [initialData]);

  const transformForDashboard = (sub: DealFlowSubmission) => {
    const fusionInput = {
      ruleScore: sub.score,
      aiScore: sub.aiScore || sub.score,
      authority: sub.authority === "yes",
      problem: sub.problem || "No problem description provided",
      urgency: sub.urgency || "Not specified",
      revenue: parseFloat(sub.revenue) || 0,
    };

    const fusionResult = {
      route: sub.route,
      priority:
        sub.aiDealQuality === "ELITE"
          ? "SOVEREIGN"
          : sub.aiDealQuality === "HIGH"
          ? "HIGH"
          : sub.aiDealQuality === "MEDIUM"
          ? "MEDIUM"
          : "LOW",
      fusedScore: sub.score,
      routeConfidence: sub.aiConfidence ? Math.round(sub.aiConfidence * 100) : 70,
      temperature:
        sub.aiDealQuality === "ELITE"
          ? "SCORCHING"
          : sub.aiDealQuality === "HIGH"
          ? "HOT"
          : sub.aiDealQuality === "MEDIUM"
          ? "WARM"
          : "COOL",
      rationale: [
        `${sub.route === "STRATEGY" ? "Chamber priority routing" : "Structured review indicated"}`,
        `${sub.aiDealQuality || "Standard"} quality assessment based on institutional criteria`,
        `${sub.aiIntent === "STRATEGY" ? "Strategic alignment detected" : "Diagnostic pathway recommended"}`,
        `${sub.score >= 80 ? "High resonance score" : sub.score >= 55 ? "Moderate resonance" : "Further assessment required"}`,
      ],
    };

    return { input: fusionInput, result: fusionResult };
  };

  const handleViewDealIntelligence = (sub: DealFlowSubmission) => {
    const { input, result } = transformForDashboard(sub);
    setSelectedDeal({ submission: sub, input, result });
  };

  const closeDashboard = () => {
    setSelectedDeal(null);
  };

  if (loading) {
    return (
      <div className="mt-10 border-t border-white/10 pt-10">
        <h2 className="text-xl font-bold mb-6 text-[#D4AF37]">Deal Flow Engine</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-zinc-900/30 rounded"></div>
          <div className="h-40 bg-zinc-900/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-10 border-t border-white/10 pt-10">
        <h2 className="text-xl font-bold mb-6 text-[#D4AF37]">Deal Flow Engine</h2>
        <div className="bg-red-900/20 border border-red-500/30 rounded p-4">
          <p className="text-sm text-red-400">⚠️ Deal flow intelligence unavailable</p>
          <p className="text-xs text-red-400/70 mt-1">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  const renderIntentBadge = (intent: string | null) => {
    if (!intent) return null;

    const config: Record<string, { color: string; label: string }> = {
      STRATEGY: { color: "bg-[#D4AF37]/20 text-[#D4AF37]", label: "Strategy" },
      DIAGNOSTIC: { color: "bg-blue-500/20 text-blue-400", label: "Diagnostic" },
      NURTURE: { color: "bg-emerald-500/20 text-emerald-400", label: "Nurture" },
      REJECT: { color: "bg-gray-500/20 text-gray-400", label: "Reject" },
    };

    const fallback = { color: "bg-gray-500/20 text-gray-400", label: "Reject" };
    const match = config[intent] ?? config["REJECT"] ?? fallback;
    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${match.color}`}>
        {match.label}
      </span>
    );
  };

  const renderQualityBadge = (quality: string | null) => {
    if (!quality) return null;

    const config: Record<string, { color: string; icon: any }> = {
      ELITE: { color: "text-amber-400 border-amber-500/30", icon: Crown },
      HIGH: { color: "text-emerald-400 border-emerald-500/30", icon: TrendingUp },
      MEDIUM: { color: "text-blue-400 border-blue-500/30", icon: Activity },
      LOW: { color: "text-gray-400 border-gray-500/30", icon: TrendingDown },
    };

    const fallback = { color: "text-blue-400 border-blue-500/30", icon: Activity };
    const match = config[quality] ?? config["MEDIUM"] ?? fallback;
    const Icon = match.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${match.color}`}>
        <Icon className="h-2.5 w-2.5" />
        {quality}
      </span>
    );
  };

  return (
    <div className="mt-10 border-t border-white/10 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#D4AF37]">Deal Flow Engine</h2>
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900/30 px-3 py-1 rounded">
            Institutional Assessment
          </span>
        </div>
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 hover:text-[#D4AF37] transition-colors"
        >
          {expandedView ? "Collapse" : "Expand Analytics"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
        {[
          { label: "Strategy Room", value: data.strategy, color: "#D4AF37" },
          { label: "Diagnostic Track", value: data.diagnostic, color: "#3B82F6" },
          { label: "Filtered Out", value: data.reject, color: "#6B7280" },
          { label: "Avg Score", value: data.avg.toFixed(0), color: "#D4AF37" },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-sm border border-white/5 bg-zinc-900/20 p-6 transition-all hover:bg-zinc-900/30"
          >
            <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
              {stat.label}
            </p>
            <p className="text-3xl font-light tracking-tighter" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {expandedView && (
        <div className="mb-8 p-6 border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.03] to-transparent rounded-sm">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-[#D4AF37]/60" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/60">
              Institutional Assessment Intelligence
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="border border-white/5 bg-zinc-900/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-emerald-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  High-Quality Deals
                </span>
              </div>
              <p className="text-2xl font-light text-white">{data.ai.highQualityDeals}</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                ELITE / HIGH priority opportunities
              </p>
            </div>

            <div className="border border-white/5 bg-zinc-900/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-blue-400/60" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  Avg Assessment Confidence
                </span>
              </div>
              <p className="text-2xl font-light text-white">{data.ai.avgAiConfidence}%</p>
              <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] rounded-full"
                  style={{ width: `${data.ai.avgAiConfidence}%` }}
                />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-3.5 w-3.5 text-[#D4AF37]/60" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  Intent Distribution
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(data.ai.intentDistribution).map(([intent, count]) => (
                  <div key={intent} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{intent}</span>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeal && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#D4AF37]/60" />
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/60">
                Sovereign Intelligence Analysis
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-mono text-zinc-500">
                {selectedDeal.submission.email || selectedDeal.submission.name}
              </span>
              <button
                onClick={closeDashboard}
                className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          <SovereignDashboard result={selectedDeal.result} input={selectedDeal.input} />
        </div>
      )}

      <div>
        <h3 className="mb-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          Recent Submissions <span className="h-px flex-1 bg-white/5" />
        </h3>

        <div className="space-y-2">
          {data.submissions.slice(0, 10).map((sub) => (
            <div
              key={sub.id}
              className="group flex flex-col gap-2 border border-white/5 bg-zinc-900/10 p-4 transition-colors hover:bg-zinc-900/30 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-6 flex-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    sub.route === "STRATEGY"
                      ? "bg-[#D4AF37]"
                      : sub.route === "DIAGNOSTIC"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-white transition-colors group-hover:text-[#D4AF37]">
                    {sub.email || sub.name || "Anonymous"}{" "}
                    <span className="font-light text-zinc-500">— assessed —</span>{" "}
                    <span
                      className={`font-mono ${
                        sub.score >= 80
                          ? "text-[#D4AF37]"
                          : sub.score >= 55
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {sub.score}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 font-mono text-[9px] uppercase text-zinc-600">
                    <span>Revenue: £{Number(sub.revenue).toLocaleString()}</span>
                    <span>•</span>
                    <span>Route: {sub.route}</span>
                    <span>•</span>
                    <span>{new Date(sub.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                {sub.aiDealQuality && renderQualityBadge(sub.aiDealQuality)}
                {sub.aiIntent && renderIntentBadge(sub.aiIntent)}
                {sub.aiConfidence && (
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-zinc-500">confidence:</span>
                    <span className="text-[9px] font-mono text-[#D4AF37]">
                      {Math.round(sub.aiConfidence * 100)}%
                    </span>
                  </div>
                )}
                {sub.status === "NEW" && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-400">
                    New
                  </span>
                )}
                {sub.priority === "HIGH" && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-red-500/20 text-red-400">
                    Priority
                  </span>
                )}
                <button
                  onClick={() => handleViewDealIntelligence(sub)}
                  className="px-3 py-1.5 rounded text-[8px] font-mono uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="h-2.5 w-2.5" />
                  View Intelligence
                </button>
              </div>
            </div>
          ))}
        </div>

        {data.submissions.length === 0 && (
          <div className="border border-white/5 bg-zinc-900/20 p-8 text-center">
            <p className="text-sm text-zinc-500">No submissions yet</p>
            <p className="text-xs text-zinc-600 mt-1">Strategy Room will populate here</p>
          </div>
        )}
      </div>

      {data.submissions.some((s) => s.aiSummary) && (
        <div className="mt-6 p-4 border-t border-white/5">
          <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
            Recent Assessment Insight
          </p>
          <p className="text-xs text-zinc-400 italic">
            {data.submissions.find((s) => s.aiSummary)?.aiSummary ||
              "Institutional assessment framework active"}
          </p>
        </div>
      )}
    </div>
  );
}

const IntelligenceView: NextPage<IntelligenceProps> = ({
  logs,
  stats,
  dealFlowStats,
  canonicalEfficacy = [],
}) => {
  return (
    <Layout title="Intelligence Command Center">
      <main className="min-h-screen bg-[#020202] px-8 pb-20 pt-32 text-white">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "Total Asset Retrievals", value: stats.totalDownloads },
              { label: "Active VIPs (24h)", value: stats.activeUsers24h },
              { label: "High-Interest Brief", value: stats.topAsset },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-sm border border-white/5 bg-zinc-900/20 p-6"
              >
                <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-light tracking-tighter text-[#D4AF37]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-12">
            <KnowledgeGraph
              frameworks={[]}
              efficacyRows={canonicalEfficacy}
              overlayMode="canonical"
            />
          </div>

          <div className="mb-12">
            <SecurityDashboard
              logs={logs}
              efficacyRows={canonicalEfficacy}
              overlayMode="canonical"
            />
          </div>

          <DealFlowBlock initialData={dealFlowStats} />
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<IntelligenceProps> = async (
  context
) => {
  const auth = await requireAdminPage(context);
  if (!auth.authorized) return auth.redirect as any;

  const db = prisma;

  const logsRaw =
    (await db?.systemAuditLog.findMany({
      where: {
        action: { in: ["ASSET_RETRIEVAL_AUTHORIZED", "AUTH_SIGNIN"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })) || [];

  const totalDownloads =
    (await db?.systemAuditLog.count({
      where: { action: "ASSET_RETRIEVAL_AUTHORIZED" },
    })) || 0;

  const activeUsers24h =
    (await db?.innerCircleMember.count({
      where: {
        lastSeenAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })) || 0;

  const logs: AuditLogEntry[] = logsRaw.map((log) => {
    const logWithExtras = log as typeof log & {
      resourceName?: string | null;
      metadata?: unknown;
    };

    return {
      id: String(log.id),
      action: String(log.action),
      actorEmail: log.actorEmail ?? null,
      resourceName: logWithExtras.resourceName ?? null,
      severity: String(log.severity),
      createdAt: new Date(log.createdAt).toISOString(),
      metadata: logWithExtras.metadata,
    };
  });

  let dealFlowStats: DealFlowStats | null = null;
  try {
    const submissions =
      (await db?.dealFlowSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          name: true,
          email: true,
          revenue: true,
          score: true,
          route: true,
          aiScore: true,
          aiConfidence: true,
          aiIntent: true,
          aiDealQuality: true,
          aiSummary: true,
          status: true,
          priority: true,
          authority: true,
          problem: true,
          urgency: true,
        },
      })) || [];

    if (submissions.length > 0) {
      const strategy = submissions.filter((s) => s.route === "STRATEGY").length;
      const diagnostic = submissions.filter((s) => s.route === "DIAGNOSTIC").length;
      const reject = submissions.filter((s) => s.route === "REJECT").length;
      const avg =
        submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length;

      const highQualityDeals = submissions.filter(
        (s) => s.aiDealQuality === "ELITE" || s.aiDealQuality === "HIGH"
      ).length;

      const avgAiConfidence =
        submissions.reduce((acc, s) => acc + (s.aiConfidence || 0), 0) /
        submissions.length;

      const intentDistribution = {
        STRATEGY: submissions.filter((s) => s.aiIntent === "STRATEGY").length,
        DIAGNOSTIC: submissions.filter((s) => s.aiIntent === "DIAGNOSTIC").length,
        NURTURE: submissions.filter((s) => s.aiIntent === "NURTURE").length,
        REJECT: submissions.filter((s) => s.aiIntent === "REJECT").length,
      };

      dealFlowStats = {
        strategy,
        diagnostic,
        reject,
        avg,
        submissions: submissions.map((s) => ({
          ...s,
          revenue: s.revenue || "0",
          createdAt: s.createdAt.toISOString(),
          authority: s.authority || "",
          problem: s.problem || "",
          urgency: s.urgency || "",
        })),
        ai: {
          highQualityDeals,
          avgAiConfidence: Math.round(avgAiConfidence * 100),
          intentDistribution,
        },
      };
    }
  } catch (error) {
    console.warn("Deal flow table not yet migrated:", error);
  }

  let canonicalEfficacy: EfficacyRow[] = [];
  try {
    const rows =
      (await db?.decisionAssetEfficacy.findMany({
        take: 12,
        orderBy: [{ efficacyScore: "desc" }],
      })) || [];

    canonicalEfficacy = rows.map((row: any) => ({
      id: String(row.id),
      joinKey: String(row.joinKey || row.contextKey || row.id),
      context: {
        route: row.route || row.canonicalSnapshot?.sections?.constitutionalPosture?.route || "DIAGNOSTIC",
        readinessTier:
          row.readinessTier ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.readinessTier ||
          "EMERGING",
        authorityType:
          row.authorityType ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.authorityType ||
          "UNKNOWN",
        revenueBand:
          row.revenueBand ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.revenueBand ||
          "UNSPECIFIED",
        marketRiskBand:
          row.marketRiskBand ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.marketRiskBand ||
          "MODERATE",
        orgState:
          row.orgState ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.orgState ||
          "DRIFTING",
        dominantDomains:
          row.dominantDomains ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.dominantDomains ||
          [],
        failureModes:
          row.failureModes ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.failureModes ||
          [],
        requiredInterventions:
          row.requiredInterventions ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.requiredInterventions ||
          [],
        sponsorTypes:
          row.sponsorTypes ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.sponsorTypes ||
          [],
        worldviewAnchors:
          row.worldviewAnchors ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.worldviewAnchors ||
          [],
        clarityScore:
          row.clarityScore ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.clarityScore ||
          0,
        authorityScore:
          row.authorityScore ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.authorityScore ||
          0,
        governanceScore:
          row.governanceScore ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.governanceScore ||
          0,
        severityScore:
          row.severityScore ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.severityScore ||
          0,
        revenueScore:
          row.revenueScore ||
          row.canonicalSnapshot?.sections?.constitutionalPosture?.revenueScore ||
          0,
      },
      totalSessions: Number(row.totalSessions || 0),
      impressionCount: Number(row.impressionCount || 0),
      conversionCount: Number(row.conversionCount || 0),
      contextualConversionRate: Number(row.contextualConversionRate || 0),
      rankedAssets: Array.isArray(row.rankedAssets) ? row.rankedAssets : [],
    }));
  } catch (error) {
    console.warn("Decision context efficacy unavailable:", error);
  }

  return {
    props: {
      logs,
      stats: {
        totalDownloads,
        activeUsers24h,
        topAsset: "Legacy Architecture Canvas",
      },
      dealFlowStats,
      canonicalEfficacy,
    },
  };

};

export default IntelligenceView;
