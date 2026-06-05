/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/advisory-queue.tsx — Inner Circle Advisory Queue */
/* Phase 1: Turn risk routing and Council Candidate flags into commercial action. */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";

type AdvisoryLead = {
  userId: string;
  userRef: string;
  email: string | null;
  latestRiskLevel: string;
  latestScore: number;
  diagnosticCount: number;
  pressureSignalCount: number;
  lastActivity: string | null;
  recommendedProduct: string;
  qualificationReason: string;
  qualificationStatus: string;
  qualificationId: string;
  councilCandidate: boolean;
};

type QueueStats = {
  total: number;
  highCritical: number;
  councilCandidates: number;
  open: number;
  converted: number;
};

type Props = {
  leads: AdvisoryLead[];
  stats: QueueStats;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

function statusColor(level: string) {
  const map: Record<string, string> = {
    Critical: "text-red-400 bg-red-500/10 border-red-500/20",
    High: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Low: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return map[level] || "text-white/40 bg-white/5 border-white/10";
}

function formatDate(ds: string | null) {
  if (!ds) return "—";
  try {
    return new Date(ds).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return ds;
  }
}

const AdvisoryQueuePage: NextPage<Props> = ({ leads, stats }) => {
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [localLeads, setLocalLeads] = React.useState(leads);
  const [filter, setFilter] = React.useState<string>("all");
  const [exportLoading, setExportLoading] = React.useState(false);

  const filteredLeads = React.useMemo(() => {
    if (filter === "all") return localLeads;
    if (filter === "high-critical") return localLeads.filter((l) => l.latestRiskLevel === "High" || l.latestRiskLevel === "Critical");
    if (filter === "council") return localLeads.filter((l) => l.councilCandidate);
    if (filter === "open") return localLeads.filter((l) => l.qualificationStatus === "OPEN" || l.qualificationStatus === "COUNCIL_CANDIDATE");
    if (filter === "converted") return localLeads.filter((l) => l.qualificationStatus === "CONVERTED");
    if (filter === "boardroom") return localLeads.filter((l) =>
      ["BOARDROOM_RECOMMENDED", "BOARDROOM_CLICKED", "BOARDROOM_REQUESTED"].includes(l.qualificationStatus)
    );
    if (filter === "strategy") return localLeads.filter((l) =>
      ["STRATEGY_RECOMMENDED", "STRATEGY_CLICKED"].includes(l.qualificationStatus)
    );
    if (filter === "council-requested") return localLeads.filter((l) => l.qualificationStatus === "COUNCIL_REQUESTED");
    return localLeads;
  }, [localLeads, filter]);

  const actionStatusMap: Record<string, string> = {
    dismiss: "DISMISSED",
    contacted: "CONTACTED",
    "boardroom-recommended": "BOARDROOM_RECOMMENDED",
    "boardroom-clicked": "BOARDROOM_CLICKED",
    "boardroom-requested": "BOARDROOM_REQUESTED",
    "converted-boardroom": "CONVERTED",
    "strategy-recommended": "STRATEGY_RECOMMENDED",
    "strategy-clicked": "STRATEGY_CLICKED",
    "converted-strategy": "CONVERTED",
    "council-requested": "COUNCIL_REQUESTED",
    "converted-retainer": "CONVERTED",
  };

  const handleAction = async (qualificationId: string, action: string) => {
    setActionLoading(qualificationId);
    try {
      const res = await fetch("/api/admin/advisory-queue/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualificationId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        setLocalLeads((prev) =>
          prev.map((l) =>
            l.qualificationId === qualificationId
              ? { ...l, qualificationStatus: actionStatusMap[action] || l.qualificationStatus }
              : l
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/advisory-queue/export", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.csv) {
        const blob = new Blob([data.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `advisory-queue-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Advisory Queue | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  Admin · Advisory Queue
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  Risk routing & Council Candidate flags
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  Turn diagnostic risk and pressure signals into commercial action.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                style={{ ...mono, borderColor: `${GOLD}44`, color: GOLD, fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}
                className="border px-4 py-2 transition hover:bg-white/5 disabled:opacity-40"
              >
                {exportLoading ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Total Leads", value: stats.total, accent: "text-white/60" },
              { label: "High/Critical", value: stats.highCritical, accent: "text-orange-400" },
              { label: "Council Candidates", value: stats.councilCandidates, accent: "text-purple-400" },
              { label: "Open", value: stats.open, accent: "text-amber-400" },
              { label: "Converted", value: stats.converted, accent: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="border p-4" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
                <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  {s.label}
                </p>
                <p className={`mt-2 text-2xl font-black tracking-tight ${s.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "high-critical", label: "High/Critical" },
              { key: "council", label: "Council Candidates" },
              { key: "open", label: "Open" },
              { key: "boardroom", label: "Boardroom" },
              { key: "strategy", label: "Strategy Room" },
              { key: "council-requested", label: "Council Requested" },
              { key: "converted", label: "Converted" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  ...mono,
                  borderColor: filter === f.key ? GOLD : RULE,
                  color: filter === f.key ? GOLD : "rgba(255,255,255,0.5)",
                  fontSize: 7,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
                className="border px-3 py-1.5 transition hover:bg-white/5"
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${RULE}` }}>
                  {["User", "Risk", "Score", "Diagnostics", "Pressure", "Last Activity", "Product Route", "Reason", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-12 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">
                      No leads match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.qualificationId} className="border-b transition hover:bg-white/[0.015]" style={{ borderBottomColor: RULE }}>
                      <td className="px-3 py-3">
                        <div className="font-mono text-[9px] text-white/60">{lead.userRef}</div>
                        <div className="text-xs text-white/40">{lead.email || "—"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${statusColor(lead.latestRiskLevel)}`}>
                          {lead.latestRiskLevel}
                        </span>
                        {lead.councilCandidate ? (
                          <span className="ml-2 inline-block border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-purple-400">
                            Council
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-mono text-sm">{lead.latestScore}</td>
                      <td className="px-3 py-3 font-mono text-xs text-white/50">{lead.diagnosticCount}</td>
                      <td className="px-3 py-3 font-mono text-xs text-white/50">{lead.pressureSignalCount}</td>
                      <td className="px-3 py-3 font-mono text-[9px] text-white/40">{formatDate(lead.lastActivity)}</td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-amber-400/80">
                          {lead.recommendedProduct.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-[200px] truncate text-xs text-white/40">
                        {lead.qualificationReason}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`font-mono text-[7px] uppercase tracking-[0.12em] ${
                          lead.qualificationStatus === "CONVERTED" ? "text-green-400" :
                          lead.qualificationStatus === "DISMISSED" ? "text-white/20" :
                          lead.qualificationStatus === "CONTACTED" ? "text-blue-400" :
                          lead.qualificationStatus === "COUNCIL_CANDIDATE" ? "text-purple-400" :
                          lead.qualificationStatus === "BOARDROOM_RECOMMENDED" ? "text-amber-400" :
                          lead.qualificationStatus === "BOARDROOM_CLICKED" ? "text-yellow-400" :
                          lead.qualificationStatus === "BOARDROOM_REQUESTED" ? "text-orange-400" :
                          lead.qualificationStatus === "STRATEGY_RECOMMENDED" ? "text-emerald-400" :
                          lead.qualificationStatus === "STRATEGY_CLICKED" ? "text-teal-400" :
                          lead.qualificationStatus === "COUNCIL_REQUESTED" ? "text-violet-400" :
                          "text-amber-400"
                        }`}>
                          {lead.qualificationStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {lead.qualificationStatus !== "DISMISSED" && lead.qualificationStatus !== "CONVERTED" ? (
                            <>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "contacted")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-blue-500/20 bg-blue-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                              >
                                Contact
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "boardroom-recommended")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-40"
                              >
                                Rec. Boardroom
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "boardroom-clicked")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-40"
                              >
                                Clicked Boardroom
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "boardroom-requested")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-orange-500/20 bg-orange-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-40"
                              >
                                Requested Boardroom
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "converted-boardroom")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-green-500/20 bg-green-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-green-400 transition hover:bg-green-500/20 disabled:opacity-40"
                              >
                                → Boardroom
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "strategy-recommended")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
                              >
                                Rec. Strategy
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "converted-strategy")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-teal-500/20 bg-teal-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-teal-400 transition hover:bg-teal-500/20 disabled:opacity-40"
                              >
                                → Strategy
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "council-requested")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-violet-400 transition hover:bg-violet-500/20 disabled:opacity-40"
                              >
                                Council Request
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "converted-retainer")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-teal-500/20 bg-teal-500/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-teal-400 transition hover:bg-teal-500/20 disabled:opacity-40"
                              >
                                → Retainer
                              </button>
                              <button
                                onClick={() => handleAction(lead.qualificationId, "dismiss")}
                                disabled={actionLoading === lead.qualificationId}
                                className="border border-white/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-white/30 transition hover:bg-white/5 disabled:opacity-40"
                              >
                                Dismiss
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t pt-6" style={{ borderTopColor: RULE }}>
            <Link
              href="/admin/analytics"
              style={{ ...mono, color: GOLD, fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}
              className="transition hover:text-white"
            >
              → View Analytics Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.ok) return { redirect: { ...auth.redirect, permanent: false } };

  const { prisma } = await import("@/lib/prisma");

  const qualifications = await prisma.$queryRaw<Array<{
    id: string;
    user_id: string;
    status: string;
    risk_level: string;
    recommended_product: string;
    reason: string;
    metadata_json: any;
    created_at: Date;
  }>>`
    SELECT id, user_id, status, risk_level, recommended_product, reason, metadata_json, created_at
    FROM inner_circle_advisory_qualifications
    WHERE status IN ('OPEN', 'COUNCIL_CANDIDATE', 'CONTACTED', 'BOARDROOM_RECOMMENDED', 'BOARDROOM_CLICKED', 'BOARDROOM_REQUESTED', 'STRATEGY_RECOMMENDED', 'STRATEGY_CLICKED', 'COUNCIL_REQUESTED', 'CONVERTED')
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const userIds = qualifications.map((q) => q.user_id);

  const profiles = userIds.length > 0 ? await prisma.$queryRaw<Array<{
    user_id: string;
    email: string | null;
    access_state: string;
    updated_at: Date | null;
  }>>`
    SELECT user_id, email, access_state, updated_at
    FROM inner_circle_profiles
    WHERE user_id = ANY(${userIds}::text[])
  ` : [];

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const diagnosticCounts = userIds.length > 0 ? await prisma.$queryRaw<Array<{
    user_id: string;
    count: bigint;
  }>>`
    SELECT user_id, COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE user_id = ANY(${userIds}::text[])
    GROUP BY user_id
  ` : [];

  const diagCountMap = new Map(diagnosticCounts.map((d) => [d.user_id, Number(d.count)]));

  const pressureCounts = userIds.length > 0 ? await prisma.$queryRaw<Array<{
    user_id: string;
    count: bigint;
  }>>`
    SELECT user_id, COUNT(*)::bigint AS count
    FROM pressure_signal_events
    WHERE user_id = ANY(${userIds}::text[])
    GROUP BY user_id
  ` : [];

  const pressureCountMap = new Map(pressureCounts.map((p) => [p.user_id, Number(p.count)]));

  const latestResults = userIds.length > 0 ? await prisma.$queryRaw<Array<{
    user_id: string;
    score: number;
    risk_level: string;
  }>>`
    SELECT DISTINCT ON (user_id) user_id, score, risk_level
    FROM inner_circle_diagnostic_results
    WHERE user_id = ANY(${userIds}::text[])
    ORDER BY user_id, created_at DESC
  ` : [];

  const latestResultMap = new Map(latestResults.map((r) => [r.user_id, { score: Number(r.score), riskLevel: r.risk_level }]));

  const leads: AdvisoryLead[] = qualifications.map((q) => {
    const profile = profileMap.get(q.user_id);
    const latest = latestResultMap.get(q.user_id);
    return {
      userId: q.user_id,
      userRef: q.user_id.slice(0, 12),
      email: profile?.email ?? null,
      latestRiskLevel: latest?.riskLevel ?? q.risk_level,
      latestScore: latest?.score ?? 0,
      diagnosticCount: diagCountMap.get(q.user_id) ?? 0,
      pressureSignalCount: pressureCountMap.get(q.user_id) ?? 0,
      lastActivity: profile?.updated_at?.toISOString() ?? null,
      recommendedProduct: q.recommended_product,
      qualificationReason: q.reason,
      qualificationStatus: q.status,
      qualificationId: q.id,
      councilCandidate: q.status === "COUNCIL_CANDIDATE",
    };
  });

  const stats: QueueStats = {
    total: leads.length,
    highCritical: leads.filter((l) => l.latestRiskLevel === "High" || l.latestRiskLevel === "Critical").length,
    councilCandidates: leads.filter((l) => l.councilCandidate).length,
    open: leads.filter((l) => l.qualificationStatus === "OPEN" || l.qualificationStatus === "COUNCIL_CANDIDATE").length,
    converted: leads.filter((l) => l.qualificationStatus === "CONVERTED").length,
  };

  return {
    props: {
      leads,
      stats,
    },
  };
};

export default AdvisoryQueuePage;
