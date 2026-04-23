import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import AdminLayout from "@/components/admin/AdminLayout";
import { Crown, ArrowRight, AlertTriangle } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  stats: {
    activeLeads: number;
    erCompletionsToday: number;
    srEntries: number;
    activeRetainers: number;
  };
  topContradictions: Array<{ label: string; severity: string; confidence: number; sourceStage: string }>;
  blockingStakeholders: Array<{ name: string; role: string; decisionText: string }>;
  recentAuditEvents: Array<{ actionType: string; objectType: string; summary: string; createdAt: string }>;
  recentEnforcementCycles: Array<{ cycleDate: string; decisionsReviewed: number; contradictionsActive: number; advantageSignal: string }>;
};

const AuthorityCenterPage: NextPage<Props> = ({ stats, topContradictions, blockingStakeholders, recentAuditEvents, recentEnforcementCycles }) => {
  return (
    <AdminLayout title="Authority Center">
      <Head>
        <title>Authority Center | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
            Authority center
          </span>
          <p style={{ ...serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem" }}>
            Where do I act right now?
          </p>
        </div>

        {/* Stats — above the fold */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Active leads", value: stats.activeLeads, color: `${GOLD}CC` },
            { label: "ER completions today", value: stats.erCompletionsToday, color: stats.erCompletionsToday > 0 ? "rgba(110,231,183,0.65)" : "rgba(255,255,255,0.40)" },
            { label: "Strategy Room entries", value: stats.srEntries, color: stats.srEntries > 0 ? "rgba(110,231,183,0.65)" : "rgba(255,255,255,0.40)" },
            { label: "Active retainers", value: stats.activeRetainers, color: stats.activeRetainers > 0 ? `${GOLD}CC` : "rgba(255,255,255,0.40)" },
          ].map((s) => (
            <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{s.label}</div>
              <div style={{ ...mono, fontSize: "20px", color: s.color, marginTop: "0.25rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Critical contradictions — top 3 */}
        <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            Critical contradictions ({topContradictions.length})
          </span>
          {topContradictions.length === 0 ? (
            <p style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.25)", marginTop: "0.3rem" }}>No critical contradictions active.</p>
          ) : topContradictions.map((c, i) => (
            <div key={i} style={{ marginTop: "0.35rem", paddingTop: i > 0 ? "0.3rem" : 0, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle style={{ width: 10, height: 10, color: "rgba(252,165,165,0.50)" }} />
                <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: c.severity === "critical" ? "rgba(252,165,165,0.65)" : "rgba(253,186,116,0.60)" }}>{c.severity}</span>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>{Math.round(c.confidence * 100)}% · {c.sourceStage}</span>
              </div>
              <p style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.40)", marginTop: "0.1rem" }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Blocking stakeholders */}
        {blockingStakeholders.length > 0 && (
          <div style={{ border: `1px solid ${GOLD}15`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
              Blocking stakeholders
            </span>
            {blockingStakeholders.map((s, i) => (
              <div key={i} style={{ marginTop: "0.3rem" }}>
                <span style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.55)" }}>BLOCKING</span>
                <span style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.40)", marginLeft: "0.5rem" }}>{s.name} ({s.role})</span>
                <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)", marginTop: "0.05rem" }}>Decision: {s.decisionText.slice(0, 80)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent audit events */}
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Recent audit events
          </span>
          {recentAuditEvents.length === 0 ? (
            <p style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.20)", marginTop: "0.3rem" }}>No recent events.</p>
          ) : recentAuditEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>{new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              <span style={{ ...mono, fontSize: "6.5px", color: `${GOLD}80` }}>{e.actionType}</span>
              <span style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.30)" }}>{e.summary}</span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex gap-3 flex-wrap">
          {[
            { href: "/admin/enterprise-pipeline", label: "Pipeline" },
            { href: "/admin/outcome-ledger", label: "Outcome Ledger" },
            { href: "/admin/enterprise-foundation", label: "Foundation" },
            { href: "/admin/proof", label: "Proof Queue" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex items-center gap-2" style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", border: "1px solid rgba(255,255,255,0.06)", padding: "6px 12px" }}>
              {l.label} <ArrowRight style={{ width: 9, height: 9 }} />
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    leadCount,
    erToday,
    srCount,
    retainerCount,
    contradictions,
    stakeholders,
    auditEvents,
    cycles,
  ] = await Promise.all([
    prisma.dealFlowSubmission.count(),
    prisma.diagnosticJourney.count({ where: { diagnosticType: "executive_reporting", createdAt: { gte: today } } }),
    prisma.strategyRoomExecutionSession.count({ where: { status: { not: "draft" } } }),
    prisma.retainerContract.count({ where: { status: "ACTIVE" } }),
    prisma.diagnosticEvidenceNode.findMany({
      where: { kind: "contradiction", severity: { in: ["critical", "high"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.decisionStakeholder.findMany({
      where: { alignmentState: "BLOCKING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { decisionObject: { select: { decisionText: true } } },
    }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.enforcementCycle.findMany({ orderBy: { cycleDate: "desc" }, take: 5 }),
  ]);

  return {
    props: {
      stats: {
        activeLeads: leadCount,
        erCompletionsToday: erToday,
        srEntries: srCount,
        activeRetainers: retainerCount,
      },
      topContradictions: contradictions.map((c) => ({
        label: c.label,
        severity: c.severity,
        confidence: c.confidence,
        sourceStage: c.sourceStage,
      })),
      blockingStakeholders: stakeholders.map((s) => ({
        name: s.name,
        role: s.role,
        decisionText: (s as any).decisionObject?.decisionText ?? "—",
      })),
      recentAuditEvents: auditEvents.map((e) => ({
        actionType: e.actionType,
        objectType: e.objectType,
        summary: e.summary,
        createdAt: e.createdAt.toISOString(),
      })),
      recentEnforcementCycles: cycles.map((c) => ({
        cycleDate: c.cycleDate.toISOString(),
        decisionsReviewed: 0,
        contradictionsActive: 0,
        advantageSignal: (c as any).advantageSignal ?? "PARITY",
      })),
    },
  };
};

export default AuthorityCenterPage;
