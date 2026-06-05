/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/analytics.tsx — Phase 3: Inner Circle Analytics Dashboard */
/* Shows whether the acquisition and diagnostic loop actually works. */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";

type AnalyticsData = {
  pressureSignalCount: number;
  pressureByDay: Array<{ date: string; count: number }>;
  pressureDistribution: { green: number; amber: number; red: number };
  accountCreationFromPressure: number;
  scorecardStarts: number;
  scorecardCompletions: number;
  scorecardRiskDistribution: Record<string, number>;
  highCriticalUsers: number;
  councilCandidatesFlagged: number;
  boardroomCtaClicks: number;
  strategyRoomCtaClicks: number;
  worksheetActionsCreated: number;
  worksheetActionsCompleted: number;
  emailEventsSent: number;
  emailEventsByType: Array<{ event: string; count: number }>;
  rateLimitBackend: string;
  rateLimitConfigured: boolean;
  rateLimitReachable: boolean;
  rateLimitWarning: string | null;
};

type Props = {
  data: AnalyticsData;
};

const GOLD = "#C9A96E";
const FRONTIER = "#7CB8E8";
const RULE = "rgba(255,255,255,0.08)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

function MetricCard({ label, value, accent }: { label: string; value: string | number | undefined; accent?: string }) {
  return (
    <div className="border p-5" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.012)" }}>
      <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: accent || "white" }}>
        {value}
      </p>
    </div>
  );
}

const AnalyticsPage: NextPage<Props> = ({ data }) => {
  return (
    <>
      <Head>
        <title>Analytics | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  Admin · Analytics
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  Acquisition & diagnostic loop
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  Funnel metrics for the Inner Circle operating layer.
                </p>
              </div>
              <Link
                href="/admin/advisory-queue"
                style={{ ...mono, color: GOLD, fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}
                className="border border-amber-500/20 px-4 py-2 transition hover:bg-white/5"
              >
                ← Advisory Queue
              </Link>
            </div>
          </div>

          {/* Pressure Signal Funnel */}
          <div className="mt-8">
            <p style={{ ...mono, color: FRONTIER, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Pressure Signal Funnel
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Total Signals" value={data.pressureSignalCount} accent={FRONTIER} />
              <MetricCard label="Green" value={data.pressureDistribution.green} accent="#6EE7B7" />
              <MetricCard label="Amber" value={data.pressureDistribution.amber} accent="#FCD34D" />
              <MetricCard label="Red" value={data.pressureDistribution.red} accent="#F87171" />
            </div>
            <p className="mt-3 text-xs text-white/30">
              Accounts created from pressure signal: {data.accountCreationFromPressure}
            </p>
          </div>

          {/* Scorecard Funnel */}
          <div className="mt-10">
            <p style={{ ...mono, color: GOLD, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Rise-Decay Scorecard Funnel
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <MetricCard label="Starts" value={data.scorecardStarts} accent={GOLD} />
              <MetricCard label="Completions" value={data.scorecardCompletions} accent={GOLD} />
              <MetricCard label="Low" value={data.scorecardRiskDistribution.low} accent="#6EE7B7" />
              <MetricCard label="Medium" value={data.scorecardRiskDistribution.medium} accent="#FCD34D" />
              <MetricCard label="High" value={data.scorecardRiskDistribution.high} accent="#F87171" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              <MetricCard label="Critical" value={data.scorecardRiskDistribution.critical} accent="#EF4444" />
              <MetricCard label="High/Critical Users" value={data.highCriticalUsers} accent="#F87171" />
              <MetricCard label="Council Candidates" value={data.councilCandidatesFlagged} accent="#A78BFA" />
            </div>
          </div>

          {/* Commercial Routing */}
          <div className="mt-10">
            <p style={{ ...mono, color: "#9B8EC4", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Commercial Routing
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <MetricCard label="Boardroom Brief CTAs" value={data.boardroomCtaClicks} accent="#C9A96E" />
              <MetricCard label="Strategy Room CTAs" value={data.strategyRoomCtaClicks} accent="#7CB8E8" />
              <MetricCard label="Completion Rate" value={data.scorecardCompletions > 0 ? `${Math.round((data.worksheetActionsCompleted / Math.max(data.worksheetActionsCreated, 1)) * 100)}%` : "0%"} accent="white" />
            </div>
          </div>

          {/* Worksheet Actions */}
          <div className="mt-10">
            <p style={{ ...mono, color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Worksheet Actions
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <MetricCard label="Created" value={data.worksheetActionsCreated} />
              <MetricCard label="Completed" value={data.worksheetActionsCompleted} accent="#6EE7B7" />
            </div>
          </div>

          {/* Email Events */}
          <div className="mt-10">
            <p style={{ ...mono, color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Email Follow-Up Events
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Total Sent" value={data.emailEventsSent} accent="#9B8EC4" />
              {data.emailEventsByType.map((e) => (
                <MetricCard key={e.event} label={e.event.replace(/_/g, " ")} value={e.count} />
              ))}
            </div>
          </div>

          {/* Rate-Limit Backend Status */}
          <div className="mt-10">
            <p style={{ ...mono, color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Rate-Limit Backend
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Backend" value={data.rateLimitBackend} accent={
                data.rateLimitBackend === "upstash" ? "#6EE7B7" :
                data.rateLimitBackend === "postgres" ? "#FCD34D" :
                "#F87171"
              } />
              <MetricCard label="Configured" value={data.rateLimitConfigured ? "Yes" : "No"} accent={data.rateLimitConfigured ? "#6EE7B7" : "#F87171"} />
              <MetricCard label="Reachable" value={data.rateLimitReachable ? "Yes" : "No"} accent={data.rateLimitReachable ? "#6EE7B7" : "#F87171"} />
            </div>
            {data.rateLimitWarning ? (
              <div className="mt-3 border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-amber-400">
                  Warning
                </p>
                <p className="mt-1 text-xs text-amber-300/80">{data.rateLimitWarning}</p>
              </div>
            ) : null}
          </div>

          {/* Pressure by day */}
          {data.pressureByDay.length > 0 && (
            <div className="mt-10">
              <p style={{ ...mono, color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Pressure Signals by Day (last 14)
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.pressureByDay.map((d) => (
                  <div key={d.date} className="border p-3 text-center" style={{ borderColor: RULE, minWidth: 80 }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-white/30">{d.date}</p>
                    <p className="mt-1 font-mono text-lg text-white/70">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop-off analysis */}
          <div className="mt-10 border-t pt-6" style={{ borderTopColor: RULE }}>
            <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Funnel Drop-Off Analysis
            </p>
            <div className="mt-4 space-y-2 text-sm text-white/50">
              <p>Pressure signals → Account: {data.pressureSignalCount > 0 ? `${Math.round((data.accountCreationFromPressure / data.pressureSignalCount) * 100)}%` : "0%"}</p>
              <p>Scorecard starts → Completions: {data.scorecardStarts > 0 ? `${Math.round((data.scorecardCompletions / data.scorecardStarts) * 100)}%` : "0%"}</p>
              <p>Completions → Worksheet action: {data.scorecardCompletions > 0 ? `${Math.round((data.worksheetActionsCreated / data.scorecardCompletions) * 100)}%` : "0%"}</p>
              <p>Worksheet → Completed: {data.worksheetActionsCreated > 0 ? `${Math.round((data.worksheetActionsCompleted / data.worksheetActionsCreated) * 100)}%` : "0%"}</p>
              <p>High/Critical → Advisory lead: {data.highCriticalUsers > 0 ? `${Math.round((data.councilCandidatesFlagged / data.highCriticalUsers) * 100)}%` : "0%"}</p>
            </div>
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

  // Pressure signal counts
  const pressureTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM pressure_signal_events
  `;

  const pressureByLevel = await prisma.$queryRaw<Array<{ level: string; count: bigint }>>`
    SELECT pressure_level AS level, COUNT(*)::bigint AS count
    FROM pressure_signal_events
    GROUP BY pressure_level
  `;

  const pressureByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
    SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::bigint AS count
    FROM pressure_signal_events
    WHERE created_at >= NOW() - INTERVAL '14 days'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  // Accounts from pressure
  const accountsFromPressure = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT user_id)::bigint AS count
    FROM pressure_signal_events
    WHERE user_id IS NOT NULL
  `;

  // Scorecard stats
  const scorecardStarts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM inner_circle_diagnostic_results
  `;

  const scorecardCompletions = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE lifecycle_status = 'completed'
  `;

  const scorecardByRisk = await prisma.$queryRaw<Array<{ level: string; count: bigint }>>`
    SELECT risk_level AS level, COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    GROUP BY risk_level
  `;

  // High/Critical users
  const highCriticalUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT user_id)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE risk_level IN ('High', 'Critical')
  `;

  // Council candidates
  const councilCandidates = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_advisory_qualifications
    WHERE status = 'COUNCIL_CANDIDATE'
  `;

  // Worksheet actions
  const worksheetCreated = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM inner_circle_worksheet_actions
  `;

  const worksheetCompleted = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_worksheet_actions
    WHERE status = 'completed'
  `;

  // Email events
  const emailTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM inner_circle_email_event_logs
  `;

  const emailByType = await prisma.$queryRaw<Array<{ event: string; count: bigint }>>`
    SELECT trigger_event AS event, COUNT(*)::bigint AS count
    FROM inner_circle_email_event_logs
    GROUP BY trigger_event
  `;

  const pressureMap: Record<string, number> = { GREEN: 0, AMBER: 0, RED: 0 };
  pressureByLevel.forEach((r) => { pressureMap[r.level] = Number(r.count); });

  const riskMap: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  scorecardByRisk.forEach((r) => { riskMap[r.level] = Number(r.count); });

  // Fetch rate-limit backend status
  let rateLimitBackend = "unknown";
  let rateLimitConfigured = false;
  let rateLimitReachable = false;
  let rateLimitWarning: string | null = null;

  try {
    const { getRateLimitBackendStatus } = await import("@/lib/server/security/rate-limit-provider");
    const status = await getRateLimitBackendStatus();
    rateLimitBackend = status.backend;
    rateLimitConfigured = status.configured;
    rateLimitReachable = status.reachable;

    if (status.backend === "memory" && process.env.NODE_ENV !== "development") {
      rateLimitWarning = "Production rate limiting is using memory fallback. Configure Upstash Redis.";
    } else if (status.backend === "postgres" && !status.reachable) {
      rateLimitWarning = "PostgreSQL rate-limit fallback is unreachable. Check database connection.";
    }
  } catch {
    rateLimitBackend = "error";
    rateLimitWarning = "Rate-limit backend status check failed.";
  }

  const data: AnalyticsData = {
    pressureSignalCount: Number(pressureTotal[0]?.count ?? 0),
    pressureByDay: pressureByDay.map((r) => ({ date: r.date, count: Number(r.count) })),
    pressureDistribution: {
      green: pressureMap["GREEN"] ?? 0,
      amber: pressureMap["AMBER"] ?? 0,
      red: pressureMap["RED"] ?? 0,
    },
    accountCreationFromPressure: Number(accountsFromPressure[0]?.count ?? 0),
    scorecardStarts: Number(scorecardStarts[0]?.count ?? 0),
    scorecardCompletions: Number(scorecardCompletions[0]?.count ?? 0),
    scorecardRiskDistribution: riskMap,
    highCriticalUsers: Number(highCriticalUsers[0]?.count ?? 0),
    councilCandidatesFlagged: Number(councilCandidates[0]?.count ?? 0),
    boardroomCtaClicks: 0,
    strategyRoomCtaClicks: 0,
    worksheetActionsCreated: Number(worksheetCreated[0]?.count ?? 0),
    worksheetActionsCompleted: Number(worksheetCompleted[0]?.count ?? 0),
    emailEventsSent: Number(emailTotal[0]?.count ?? 0),
    emailEventsByType: emailByType.map((r) => ({ event: r.event, count: Number(r.count) })),
    rateLimitBackend,
    rateLimitConfigured,
    rateLimitReachable,
    rateLimitWarning,
  };

  return {
    props: { data },
  };
};

export default AnalyticsPage;
