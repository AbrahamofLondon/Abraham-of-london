/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/intelligence/gmi/publication-readiness.tsx — PHASE 2: Publication Readiness Command Centre */
/* This is the release authority console. Not a passive dashboard. */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { resolveGmiReleaseState, type GmiReleaseState, type GmiBlocker } from "@/lib/intelligence/gmi-release-authority";

type Props = {
  state: GmiReleaseState;
  editionId: string;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function statusColor(status: string) {
  const map: Record<string, string> = {
    READY_FOR_PUBLICATION: "text-green-400 bg-green-500/10 border-green-500/20",
    BLOCKED: "text-red-400 bg-red-500/10 border-red-500/20",
    NEEDS_CALL_REVIEW: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    NEEDS_SOURCE_REVIEW: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    NEEDS_FALSIFICATION_REVIEW: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    NEEDS_BOARD_REVIEW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    DRAFT: "text-white/40 bg-white/5 border-white/10",
    PUBLISHED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };
  return map[status] || "text-white/40 bg-white/5 border-white/10";
}

function severityColor(severity: string) {
  const map: Record<string, string> = {
    critical: "border-red-500/20 bg-red-500/5 text-red-400",
    high: "border-orange-500/20 bg-orange-500/5 text-orange-400",
    medium: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    low: "border-white/10 bg-white/[0.02] text-white/50",
  };
  return map[severity] || "border-white/10 bg-white/[0.02] text-white/50";
}

function categoryIcon(category: string) {
  const map: Record<string, string> = {
    CALL_REVIEW: "📞",
    SOURCE_APPENDIX: "📄",
    FALSIFICATION: "🔍",
    BOARD_PULSE: "📊",
    PERFORMANCE: "📈",
    RED_TEAM: "⚔️",
    PDF_EXPORT: "📑",
    COMMERCIAL_ROUTING: "💰",
    METADATA: "🏷️",
  };
  return map[category] || "🔴";
}

const PublicationReadinessPage: NextPage<Props> = ({ state, editionId }) => {
  const [publishing, setPublishing] = React.useState(false);
  const [publishResult, setPublishResult] = React.useState<string | null>(null);
  const criticalBlockers = state.blockers.filter((b) => b.blocksPublication);
  const isReady = state.status === "READY_FOR_PUBLICATION";

  const handlePublish = async () => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/admin/intelligence/gmi/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId, confirmReleaseSnapshotId: `snapshot_${Date.now()}` }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishResult(`Published successfully. Snapshot: ${data.snapshotId}`);
      } else {
        setPublishResult(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setPublishResult(`Error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Head>
        <title>GMI Publication Readiness | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  GMI Release Authority
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  {editionId} — Publication Readiness
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  This console determines whether the edition is publishable. No manual checklist discipline.
                </p>
              </div>
            </div>
          </div>

          {/* Release Verdict */}
          <div className="mt-6 border p-5" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.012)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Release Verdict
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-block border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${statusColor(state.status)}`}>
                    {state.status.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-[8px] text-white/30">
                    {state.blockers.length} blocker(s) · {state.warnings.length} warning(s)
                  </span>
                </div>
              </div>
              <div className="text-right font-mono text-[7px] text-white/20">
                Generated: {new Date(state.generatedAt).toLocaleString()}
              </div>
            </div>

            {state.requiredActions.length > 0 && (
              <div className="mt-4">
                <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Required Actions
                </p>
                <ul className="mt-2 space-y-1">
                  {state.requiredActions.map((action, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <span className="text-amber-400">→</span> {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Critical Blockers */}
          {criticalBlockers.length > 0 && (
            <div className="mt-6">
              <p style={{ ...mono, color: "#F87171", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Critical Blockers — blocks publication
              </p>
              <div className="mt-3 space-y-3">
                {criticalBlockers.map((blocker) => (
                  <BlockerCard key={blocker.id} blocker={blocker} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="mt-6">
              <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Warnings — does not block publication
              </p>
              <div className="mt-3 space-y-2">
                {state.warnings.map((warning) => (
                  <BlockerCard key={warning.id} blocker={warning} />
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="mt-8">
            <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Release Metrics
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {[
                { label: "Total Calls", value: state.metrics.totalCalls },
                { label: "Reviewed", value: state.metrics.reviewedCalls },
                { label: "Unscored", value: state.metrics.unscoredCalls, warn: state.metrics.unscoredCalls > 0 },
                { label: "Carried Forward", value: state.metrics.carriedForwardCalls },
                { label: "Disconfirmed", value: state.metrics.disconfirmedCalls },
                { label: "Source Blockers", value: state.metrics.releaseBlockingSourcesOpen, warn: state.metrics.releaseBlockingSourcesOpen > 0 },
                { label: "Method Notes Missing", value: state.metrics.sourceMethodNotesMissing, warn: state.metrics.sourceMethodNotesMissing > 0 },
                { label: "High-Conviction Theses", value: state.metrics.highConvictionTheses },
                { label: "Falsification Gaps", value: state.metrics.falsificationRulesMissing, warn: state.metrics.falsificationRulesMissing > 0 },
                { label: "Board Pulse", value: state.metrics.boardPulseComplete ? "Complete" : "Incomplete", warn: !state.metrics.boardPulseComplete },
                { label: "Board Pack PDF", value: state.metrics.boardPackPdfAvailable ? "Available" : "Missing", warn: !state.metrics.boardPackPdfAvailable },
                { label: "Operator Brief", value: state.metrics.operatorBriefPublic ? "Public" : "Not Public", warn: !state.metrics.operatorBriefPublic },
              ].map((m) => (
                <div key={m.label} className="border p-3" style={{ borderColor: m.warn ? "rgba(248,113,113,0.2)" : RULE }}>
                  <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/30">{m.label}</p>
                  <p className={`mt-1 font-mono text-sm ${m.warn ? "text-red-400" : "text-white/70"}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Action */}
          <div className="mt-8 border-t pt-6" style={{ borderTopColor: RULE }}>
            <div className="flex flex-wrap items-center gap-4">
              {isReady ? (
                <>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5 disabled:opacity-40"
                    style={{ borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14`, cursor: publishing ? "not-allowed" : "pointer" }}
                  >
                    {publishing ? "Publishing..." : "Publish Q2"}
                  </button>
                  <button
                    className="border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
                  >
                    Generate Release Snapshot
                  </button>
                  <button
                    className="border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
                  >
                    Generate Board Pack PDF
                  </button>
                </>
              ) : (
                <div className="border border-red-500/20 bg-red-500/10 px-5 py-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-red-400">
                    Publication blocked — {criticalBlockers.length} critical blocker(s) must be resolved first
                  </p>
                </div>
              )}
            </div>
            {publishResult && (
              <p className="mt-3 font-mono text-[8px] text-white/50">{publishResult}</p>
            )}
          </div>

          {/* Gate Sections */}
          <div className="mt-10 space-y-8">
            <GateSection
              title="Call Review Gate"
              description="Every call must be scored with evidence before publication."
              href="/admin/intelligence/gmi/batch-score"
              status={state.blockers.some((b) => b.category === "CALL_REVIEW" && b.blocksPublication) ? "BLOCKED" : "PASSING"}
              metrics={[
                { label: "Total calls", value: state.metrics.totalCalls },
                { label: "Scored", value: state.metrics.reviewedCalls },
                { label: "Unscored", value: state.metrics.unscoredCalls, warn: state.metrics.unscoredCalls > 0 },
                { label: "Carried forward", value: state.metrics.carriedForwardCalls },
                { label: "Disconfirmed", value: state.metrics.disconfirmedCalls },
              ]}
            />
            <GateSection
              title="Source Appendix Gate"
              description="All release-blocking source rows must be resolved."
              href="/admin/intelligence/gmi/source-workbench"
              status={state.blockers.some((b) => b.category === "SOURCE_APPENDIX" && b.blocksPublication) ? "BLOCKED" : "PASSING"}
              metrics={[
                { label: "Blocking rows", value: state.metrics.releaseBlockingSourcesOpen, warn: state.metrics.releaseBlockingSourcesOpen > 0 },
                { label: "Method notes missing", value: state.metrics.sourceMethodNotesMissing, warn: state.metrics.sourceMethodNotesMissing > 0 },
              ]}
            />
            <GateSection
              title="Falsification Gate"
              description="All high-conviction theses must have falsification thresholds."
              href="/admin/intelligence/gmi/falsification"
              status={state.blockers.some((b) => b.category === "FALSIFICATION" && b.blocksPublication) ? "BLOCKED" : "PASSING"}
              metrics={[
                { label: "High-conviction theses", value: state.metrics.highConvictionTheses },
                { label: "Missing thresholds", value: state.metrics.falsificationRulesMissing, warn: state.metrics.falsificationRulesMissing > 0 },
              ]}
            />
            <GateSection
              title="Board Consequence Gate"
              description="Board Pulse, Operator Consequence Index, and board-pack must be complete."
              href="/admin/intelligence/gmi/board-pulse"
              status={state.blockers.some((b) => b.category === "BOARD_PULSE" && b.blocksPublication) ? "BLOCKED" : "PASSING"}
              metrics={[
                { label: "Board Pulse", value: state.metrics.boardPulseComplete ? "Complete" : "Incomplete", warn: !state.metrics.boardPulseComplete },
                { label: "Board Pack PDF", value: state.metrics.boardPackPdfAvailable ? "Available" : "Missing", warn: !state.metrics.boardPackPdfAvailable },
              ]}
            />
            <GateSection
              title="Public Trust Gate"
              description="All public surfaces must be live and honest."
              href="/intelligence/gmi"
              status="PASSING"
              metrics={[
                { label: "Operator Brief", value: state.metrics.operatorBriefPublic ? "Public" : "Not Public", warn: !state.metrics.operatorBriefPublic },
                { label: "Performance Page", value: state.metrics.performancePageLive ? "Live" : "Not Live", warn: !state.metrics.performancePageLive },
                { label: "Red Team", value: state.metrics.redTeamIntakeLive ? "Live" : "Not Live", warn: !state.metrics.redTeamIntakeLive },
              ]}
            />
          </div>
        </div>
      </main>
    </>
  );
};

function BlockerCard({ blocker }: { blocker: GmiBlocker }) {
  return (
    <div className={`border p-4 ${severityColor(blocker.severity)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryIcon(blocker.category)}</span>
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">
              {blocker.category.replace(/_/g, " ")} · {blocker.severity.toUpperCase()}
              {blocker.blocksPublication ? (
                <span className="ml-2 text-red-400">· BLOCKS PUBLICATION</span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-white/80">{blocker.message}</p>
            {blocker.affectedEntityLabel && (
              <p className="mt-1 font-mono text-[8px] text-white/40">Entity: {blocker.affectedEntityLabel}</p>
            )}
          </div>
        </div>
        {blocker.actionHref && (
          <Link
            href={blocker.actionHref}
            className="shrink-0 border px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.14em] transition hover:bg-white/5"
            style={{ borderColor: RULE }}
          >
            {blocker.actionLabel || "Fix →"}
          </Link>
        )}
      </div>
    </div>
  );
}

function GateSection({
  title,
  description,
  href,
  status,
  metrics,
}: {
  title: string;
  description: string;
  href: string;
  status: string;
  metrics: Array<{ label: string; value: string | number | boolean; warn?: boolean }>;
}) {
  return (
    <div className="border p-5" style={{ borderColor: RULE }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${status === "PASSING" ? "bg-green-400" : "bg-red-400"}`} />
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/50">{title}</p>
          </div>
          <p className="mt-1 text-xs text-white/40">{description}</p>
        </div>
        <Link
          href={href}
          className="border px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.14em] transition hover:bg-white/5"
          style={{ borderColor: RULE }}
        >
          {status === "PASSING" ? "View →" : "Resolve →"}
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="font-mono text-[6px] uppercase tracking-[0.12em] text-white/30">{m.label}</p>
            <p className={`font-mono text-xs ${m.warn ? "text-red-400" : "text-white/60"}`}>{String(m.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.ok) return { redirect: { ...auth.redirect, permanent: false } };

  const editionId = (ctx.query?.edition as string) || "GMI-Q2-2026";
  const state = resolveGmiReleaseState(editionId);

  return {
    props: {
      state: JSON.parse(JSON.stringify(state)),
      editionId,
    },
  };
};

export default PublicationReadinessPage;
