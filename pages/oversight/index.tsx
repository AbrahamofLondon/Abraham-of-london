import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import RetainedMemoryLossPanel from "@/components/oversight/RetainedMemoryLossPanel";
import { resolvePageAccess } from "@/lib/access/server";
import { loadBoardroomArchiveCommandSummary } from "@/lib/product/boardroom-archive-summary";
import type { OversightCadenceVisibility } from "@/lib/product/oversight-cadence-contract";
import { buildSponsorSafeCommandSummary, type SponsorSafeCommandSummary } from "@/lib/product/sponsor-safe-command-summary";

type Props = {
  authenticated: boolean;
  summary: SponsorSafeCommandSummary | null;
  boardroomSummary: Awaited<ReturnType<typeof loadBoardroomArchiveCommandSummary>> | null;
  cadence: OversightCadenceVisibility | null;
  warnings: string[];
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{label}</p>
      <p className="mt-3 text-3xl text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-white/55">{note}</p>
    </article>
  );
}

const OversightPage: NextPage<Props> = ({ authenticated, summary, boardroomSummary, cadence, warnings }) => {
  if (!authenticated) {
    return (
      <Layout title="Retained Oversight Command" description="Sponsor-safe retained oversight visibility." fullWidth>
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-4xl">
            <p className="text-white/65">Sign in to view retained oversight command visibility.</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Retained Oversight Command" description="Sponsor-safe command visibility for retained oversight." fullWidth headerTransparent>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Retained Oversight Command
            </p>
            <h1 className="mt-3 text-3xl text-white">Sponsor-safe oversight visibility.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              This surface shows what is being retained: review posture, memory, escalation history, and continuity. It does not expose respondent-level evidence or operator-only material.
            </p>
          </header>

          {!summary ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Retained oversight command is not yet established for this account.</p>
              <p className="mt-3 text-sm leading-7 text-white/50">Start with diagnostic evidence, then capture retained oversight intake before expecting sponsor-safe command visibility.</p>
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Stat label="Active cases" value={summary.retainedMemory.activeCases} note="Cases currently carried into retained oversight." />
                <Stat label="Oversight cycles" value={summary.retainedMemory.oversightCycles} note="Archived review cycles retained as memory." />
                <Stat label="Counsel history" value={summary.retainedMemory.counselCases} note="Governed counsel events retained across the relationship." />
                <Stat label="Boardroom archive" value={summary.retainedMemory.boardroomDossiers} note="Board-level dossier records retained across cycles." />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Current command summary</p>
                  <p className="mt-3 text-white">{summary.oversightStatus.label}</p>
                  <p className="mt-3 text-sm leading-7 text-white/60">{summary.oversightStatus.explanation}</p>
                  <div className="mt-5 space-y-3">
                    {summary.attention.length > 0 ? summary.attention.map((item) => (
                      <div key={`${item.label}-${item.source}`} className="border border-white/10 bg-black/20 p-3">
                        <p className="text-sm text-white">{item.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35" style={mono}>{item.severity} · {item.source}</p>
                        <p className="mt-2 text-sm text-white/55">{item.explanation}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-white/45">No sponsor-safe attention items are currently published.</p>
                    )}
                  </div>
                </section>

                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Institutional memory retained</p>
                  <div className="mt-4 space-y-3 text-sm text-white/62">
                    <p>First captured: {summary.retainedMemory.firstCapturedAt ? new Date(summary.retainedMemory.firstCapturedAt).toLocaleDateString("en-GB") : "Not yet established"}</p>
                    <p>Most recent update: {summary.retainedMemory.lastUpdatedAt ? new Date(summary.retainedMemory.lastUpdatedAt).toLocaleDateString("en-GB") : "No retained update yet"}</p>
                    <p>Continuity fields carried forward: {summary.retainedMemory.completedStages}</p>
                    <p>Checkpoint responses retained: {summary.retainedMemory.checkpointResponses}</p>
                  </div>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" }}>Suppression boundary</p>
                    <ul className="mt-3 space-y-2 text-sm text-white/55">
                      {summary.suppression.map((item) => <li key={`${item.reason}-${item.scope}`}>{item.reason} ({item.scope})</li>)}
                    </ul>
                  </div>
                </section>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Cadence posture</p>
                  <p className="mt-3 text-white">{cadence?.label || "Manual retained review is available."}</p>
                  <p className="mt-3 text-sm leading-7 text-white/58">{cadence?.explanation || "No automated cadence has been configured. Review cadence requires operator confirmation."}</p>
                </section>
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Counsel and boardroom history</p>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    {summary.retainedMemory.counselCases} counsel event{summary.retainedMemory.counselCases === 1 ? "" : "s"} and {summary.retainedMemory.boardroomDossiers} boardroom dossier record{summary.retainedMemory.boardroomDossiers === 1 ? "" : "s"} remain in retained memory.
                  </p>
                  {boardroomSummary?.latestDossier ? (
                    <p className="mt-3 text-sm text-white/48">
                      Latest dossier: {new Date(boardroomSummary.latestDossier.generatedAt).toLocaleDateString("en-GB")} · {boardroomSummary.latestDossier.qualificationStatus.replace(/_/g, " ").toLowerCase()}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-white/45">No boardroom dossier has been archived yet. Boardroom memory appears only when the evidence justifies it.</p>
                  )}
                </section>
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Role-safe visibility</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/58">
                    <li>No raw respondent text.</li>
                    <li>No operator notes.</li>
                    <li>No counsel notes.</li>
                    <li>No thresholds or trigger mechanics.</li>
                  </ul>
                </section>
              </section>

              <RetainedMemoryLossPanel summary={summary.cancellationLoss.summary} retainedAssets={summary.cancellationLoss.retainedAssets} />

              <section className="flex flex-wrap gap-3">
                <Link href="/counsel/status" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Counsel status</Link>
                <Link href="/account/proof-pack" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Proof pack</Link>
                <Link href="/boardroom" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Boardroom archive</Link>
              </section>

              {warnings.length > 0 && (
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Warnings</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/52">
                    {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;
  if (!access.permissions.isAuthenticated || !email) {
    return { props: { authenticated: false, summary: null, boardroomSummary: null, cadence: null, warnings: [] } };
  }

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const result = await buildSponsorSafeCommandSummary({ userId, email, organisationId });
  const cadence: OversightCadenceVisibility = !result.brief?.cadence
    ? {
        state: "AUTOMATION_NOT_CONFIGURED",
        label: "No automated cadence has been configured.",
        explanation: "Manual retained review is available. Next review is not yet scheduled until operator confirmation exists.",
      }
    : result.brief.cadence.status === "REVIEW_DUE" || result.brief.cadence.status === "REVIEW_OVERDUE" || result.brief.cadence.status === "DELIVERY_DUE" || result.brief.cadence.status === "DELIVERY_OVERDUE" || result.brief.cadence.status === "OVERDUE"
      ? {
          state: "MANUAL_REVIEW_READY",
          label: "Manual retained review is available.",
          explanation: "Review cadence requires operator confirmation. No automated cadence has been configured on this surface.",
        }
      : result.brief.cadence.status === "PAUSED_BY_COUNSEL_ESCALATION"
        ? {
            state: "CADENCE_BLOCKED",
            label: "Review cadence is blocked pending escalation.",
            explanation: "A live escalation is holding the next retained review. This is not automated oversight.",
          }
        : {
            state: "MANUAL_REVIEW_SCHEDULED",
            label: "Review cadence requires operator confirmation.",
            explanation: `Next review is ${result.brief.cadence.nextCycleDueDate ? `scheduled manually for ${new Date(result.brief.cadence.nextCycleDueDate).toLocaleDateString("en-GB")}` : "not yet scheduled"}. No automated cadence has been configured.`,
          };

  const boardroomSummary = organisationId || result.account?.organisationId
    ? await loadBoardroomArchiveCommandSummary({ organisationId: organisationId ?? result.account?.organisationId ?? null }).catch(() => null)
    : null;

  return {
    props: {
      authenticated: true,
      summary: result.summary,
      boardroomSummary,
      cadence,
      warnings: result.warnings,
    },
  };
};

export default OversightPage;

