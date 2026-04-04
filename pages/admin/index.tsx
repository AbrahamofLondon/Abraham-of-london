/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/index.tsx — DIRECTORATE TERMINAL WITH CANONICAL DECISION SURFACE */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  Crown,
  ArrowRight,
  Terminal,
  AlertCircle,
  Zap,
  Database,
  BarChart3,
  Gauge,
  GitBranch,
  Layers3,
  ShieldCheck,
  Compass,
  Sparkles,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ContextualContextCard } from "@/components/admin/decision/ContextualContextCard";
import { RankedAssetTable } from "@/components/admin/decision/RankedAssetTable";

export async function getServerSideProps() {
  return { props: {} };
}

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
  rankedAssets: RankedAsset[];
};

const AdminIndexPage: NextPage = () => {
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.email ===
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@abrahamoflondon.com");

  const [stats, setStats] = React.useState<any>(null);
  const [efficacyRows, setEfficacyRows] = React.useState<EfficacyRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAdmin) return;

    async function load() {
      try {
        const [statsRes, efficacyRes] = await Promise.all([
          fetch("/api/admin/deal-flow-stats"),
          fetch("/api/admin/decision/contextual-efficacy?limit=4"),
        ]);

        const statsData = await statsRes.json();
        const efficacyData = await efficacyRes.json();

        setStats(statsData);
        if (efficacyData?.ok) {
          setEfficacyRows(efficacyData.rows || []);
        }
      } catch {
        // leave graceful fallback
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <p className="text-sm text-white/60">Unauthorized access</p>
          <p className="mt-2 text-xs text-white/30">
            Administrative privileges required
          </p>
        </div>
      </div>
    );
  }

  const primaryContext = efficacyRows[0] || null;

  const modules = [
    {
      href: "/admin/intelligence",
      title: "Intelligence Center",
      description:
        "Live audit stream, deal flow diagnostics, canonical decision context and recommendation rationale.",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      stats: stats ? `${stats.strategy + stats.diagnostic} submissions` : "Loading",
    },
    {
      href: "/admin/command-wall",
      title: "Command Wall",
      description:
        "Decision-grade control surface with canonical context registry and governed asset ranking.",
      icon: Terminal,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      stats: "Active",
    },
    {
      href: "/admin/decision/contextual-efficacy",
      title: "Contextual Efficacy",
      description:
        "Track performance by canonical context, including domains, failure modes, interventions and rationale.",
      icon: Layers3,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      stats: "Canonical",
    },
    {
      href: "/admin/decision/contextual-ranking",
      title: "Session Ranking",
      description:
        "Load a session and inspect ranked assets from the exact context the user saw.",
      icon: Compass,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      stats: "Session",
    },
    {
      href: "/admin/decision/governance",
      title: "Recommendation Governance",
      description:
        "Approval logic, oversight workflows and recommendation governance controls.",
      icon: GitBranch,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      stats: "Active",
    },
    {
      href: "/admin/decision/metadata-audit",
      title: "Decision Metadata Audit",
      description:
        "Audit worldview anchors, commercial use cases and constitutional metadata across assets.",
      icon: Database,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      stats: "Audit",
    },
    {
      href: "/admin/decision/performance",
      title: "Decision Performance",
      description:
        "Track engagement, conversion rates and ranked recommendation performance.",
      icon: BarChart3,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      stats: "Analytics",
    },
    {
      href: "/admin/decision/efficacy",
      title: "Decision Efficacy",
      description:
        "Measure usefulness through readiness shifts, route progression and conversion outcomes.",
      icon: Gauge,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      stats: "Measured",
    },
  ];

  return (
    <AdminLayout title="Directorate Terminal">
      <Head>
        <title>Directorate Terminal | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-8">
        <div className="rounded-sm border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Institutional Command
                </span>
              </div>
              <h2 className="mt-3 font-serif text-2xl text-white">
                Welcome, {session?.user?.name?.split(" ")[0] || "Administrator"}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: "Strategy Room",
              value: stats?.strategy ?? "--",
              icon: Crown,
              trend: "Priority",
              color: "text-amber-500",
            },
            {
              label: "Diagnostic Track",
              value: stats?.diagnostic ?? "--",
              icon: Compass,
              trend: "Active",
              color: "text-blue-500",
            },
            {
              label: "Canonical Contexts",
              value: efficacyRows.length || "--",
              icon: Layers3,
              trend: "Tracked",
              color: "text-cyan-400",
            },
            {
              label: "Avg Score",
              value: stats?.avg ? stats.avg.toFixed(0) : "--",
              icon: Activity,
              trend: "Institutional Fit",
              color: "text-emerald-500",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-sm border border-white/5 bg-zinc-900/20 p-5 transition-all hover:border-white/10 hover:bg-zinc-900/30"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-[8px] font-mono text-white/20">
                    {stat.trend}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-light text-white">
                  {loading ? "--" : stat.value}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-white/30">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {stats?.ai && (
          <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                Institutional Assessment Intelligence
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-[10px] text-white/40">High-Quality Deals</p>
                <p className="text-xl font-light text-white">
                  {stats.ai.highQualityDeals}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Avg Confidence</p>
                <p className="text-xl font-light text-white">
                  {stats.ai.avgAiConfidence}%
                </p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${stats.ai.avgAiConfidence}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Primary Intent</p>
                <p className="text-xl font-light text-white">
                  {Object.entries(stats.ai.intentDistribution).sort(
                    (a: any, b: any) => b[1] - a[1]
                  )[0]?.[0] || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {primaryContext ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <h3 className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">
                Leading Canonical Context
              </h3>
            </div>

            <ContextualContextCard
              context={primaryContext.context}
              title="Top Performing Context"
            />
            <RankedAssetTable
              items={primaryContext.rankedAssets || []}
              title="Top Ranked Asset Rationale"
            />
          </div>
        ) : null}

        <div>
          <h3 className="mb-4 text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">
            Command Modules
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group relative overflow-hidden rounded-sm border border-white/5 bg-zinc-900/20 p-5 transition-all hover:border-white/10 hover:bg-zinc-900/30"
                >
                  <div className={`mb-3 inline-flex rounded p-2 ${module.bg}`}>
                    <Icon className={`h-4 w-4 ${module.color}`} />
                  </div>
                  <h4 className="font-serif text-base text-white transition-colors group-hover:text-amber-400">
                    {module.title}
                  </h4>
                  <p className="mt-1 line-clamp-3 text-[10px] text-white/40">
                    {module.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-white/20">
                      {module.stats}
                    </span>
                    <ArrowRight className="h-3 w-3 text-white/20 transition-colors group-hover:text-amber-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIndexPage;