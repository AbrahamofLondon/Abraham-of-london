import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import RetainedMemoryLossPanel from "@/components/oversight/RetainedMemoryLossPanel";
import { resolvePageAccess } from "@/lib/access/server";
import { metadataLabelStyle } from "@/lib/design/typography";
import { prisma } from "@/lib/prisma.server";
import type { CadenceHistoryEvent, CadencePostureForSponsor } from "@/lib/product/retained-cadence-contract";
import { computeCadencePostureForSponsor, loadCadenceHistory } from "@/lib/product/retained-cadence-service";
import {
  canViewBoardroomArchive,
  canViewPortfolioMemory,
  canViewSponsorCommandSummary,
  deriveRetainedProductRole,
  type RetainedProductRole,
} from "@/lib/product/retained-role-contract";
import { buildSponsorSafeCommandSummary, type SponsorSafeCommandSummary } from "@/lib/product/sponsor-safe-command-summary";

type InstitutionalCaseOversight = {
  totalInstitutionalCases: number;
  qualifiedCount: number;
  boardroomCount: number;
  oversightActiveCount: number;
};

type Props = {
  authenticated: boolean;
  summary: SponsorSafeCommandSummary | null;
  warnings: string[];
  role: RetainedProductRole | null;
  blockedByRole: boolean;
  cadencePosture: CadencePostureForSponsor | null;
  cadenceHistory: CadenceHistoryEvent[];
  institutionalCaseSummary: InstitutionalCaseOversight | null;
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

function SectionCard({
  eyebrow,
  title,
  body,
  meta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  meta: string[];
}) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>{eyebrow}</p>
      <p className="mt-3 text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/60">{body}</p>
      <div className="mt-4 space-y-1">
        {meta.map((item) => (
          <p key={item} style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "Not available";
}

const OversightPage: NextPage<Props> = ({ authenticated, summary, warnings, role, blockedByRole, cadencePosture, cadenceHistory, institutionalCaseSummary }) => {
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
              This surface shows retained cadence posture, brief status, memory, active attention, and continuity loss without exposing respondent text, operator notes, counsel notes, or internal trigger mechanics.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35" style={mono}>
              Product role: {role ?? "UNRESOLVED"}
            </p>
            <div style={{ marginTop: "20px", borderTop: "1px solid rgba(201,169,110,0.15)", paddingTop: "16px" }}>
              <p style={{ ...metadataLabelStyle, letterSpacing: "0.22em", color: "rgba(201,169,110,0.70)", marginBottom: "10px" }}>
                Retained oversight currently preserves
              </p>
              <div style={{ display: "grid", gap: "6px" }}>
                {([
                  { label: "Cadence posture", value: cadencePosture?.status ?? "Cadence posture tracked across retained cycles" },
                  { label: "Recurrence memory", value: `${summary?.retainedMemory?.oversightCycles ?? "—"} oversight cycles retained` },
                  { label: "Boardroom archive", value: `${summary?.retainedMemory?.boardroomDossiers ?? "—"} board-level dossier records` },
                  { label: "Counsel history", value: `${summary?.retainedMemory?.counselCases ?? "—"} governed counsel events` },
                  { label: "Active cases", value: `${summary?.retainedMemory?.activeCases ?? "—"} cases in retained oversight` },
                  { label: "Continuity signal", value: "Outcome history and portfolio signal carried across cycles" },
                ] as { label: string; value: string | number }[]).map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: "16px" }}>
                    <span style={{ ...metadataLabelStyle, letterSpacing: "0.12em", color: "rgba(201,169,110,0.55)", minWidth: "140px", paddingTop: "1px", flexShrink: 0 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.45)" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {institutionalCaseSummary && institutionalCaseSummary.totalInstitutionalCases > 0 && (
            <section className="grid gap-4 md:grid-cols-4">
              <Stat label="Institutional cases" value={institutionalCaseSummary.totalInstitutionalCases} note="Total cases in the institutional corridor." />
              <Stat label="Qualified" value={institutionalCaseSummary.qualifiedCount} note="Cases that have passed institutional qualification." />
              <Stat label="Boardroom" value={institutionalCaseSummary.boardroomCount} note="Cases with boardroom dossier attached." />
              <Stat label="Oversight active" value={institutionalCaseSummary.oversightActiveCount} note="Cases under retained oversight." />
            </section>
          )}

          {blockedByRole ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">This sponsor-safe surface is not available to the current role.</p>
              <p className="mt-3 text-sm leading-7 text-white/50">Respondent-facing access does not expose Control Room or sponsor command surfaces.</p>
            </section>
          ) : !summary ? (
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
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Retained cadence posture</p>
                  <p className="mt-3 text-white">{summary.retainedCadencePosture.summary}</p>
                  <p className="mt-3 text-sm leading-7 text-white/58">{summary.retainedCadencePosture.state === "NOT_CONFIGURED" ? "Retained cadence is not configured for this account." : summary.retainedCadencePosture.state === "CONFIGURED" ? "Retained cadence is configured. No cycle is currently due." : summary.retainedCadencePosture.state === "MANUAL_OPERATOR_REVIEW" ? "Retained review is operator-confirmed. Automated scheduling is not active for this account." : summary.retainedCadencePosture.state === "SCHEDULED" ? `Next retained review is scheduled for ${formatDate(summary.retainedCadencePosture.scheduledFor)}.` : summary.retainedCadencePosture.state === "DUE_SOON" || summary.retainedCadencePosture.state === "REVIEW_DUE" ? "A retained review is due." : summary.retainedCadencePosture.state === "REVIEW_IN_PROGRESS" ? "A retained review is in progress." : summary.retainedCadencePosture.state === "OVERDUE" ? "A retained review is overdue. Operator attention is required." : summary.retainedCadencePosture.state === "COMPLETED" || summary.retainedCadencePosture.state === "REVIEW_COMPLETED" ? `Latest retained review completed on ${formatDate(summary.retainedCadencePosture.lastCompletedAt)}.` : summary.retainedCadencePosture.state === "SKIPPED_WITH_REASON" || summary.retainedCadencePosture.state === "REVIEW_SKIPPED" ? "Latest retained review was skipped with recorded reason." : summary.retainedCadencePosture.state === "CADENCE_BROKEN" ? "Retained cadence has been broken. Operator intervention required." : "This retained review cycle has been escalated."}</p>

                  {(summary.retainedCadencePosture.state === "OVERDUE" || summary.retainedCadencePosture.state === "CADENCE_BROKEN" || summary.retainedCadencePosture.state === "ESCALATED") && (
                    <div className="mt-3 border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      <p className="text-xs text-amber-200">Attention required: this cadence state indicates that a retained review has not been completed within the expected window.</p>
                    </div>
                  )}

                  <div className="mt-4 space-y-1">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                      Last review date · {cadencePosture ? formatDate(cadencePosture.lastReviewDate) : formatDate(summary.retainedCadencePosture.lastCompletedAt)}
                    </p>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                      Next due date · {cadencePosture ? formatDate(cadencePosture.nextDueDate) : formatDate(summary.retainedCadencePosture.scheduledFor)}
                    </p>
                    {cadencePosture && (
                      <>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                          Cycles completed · {cadencePosture.cyclesCompleted}
                        </p>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: cadencePosture.cyclesOverdue > 0 ? "rgba(245,158,11,0.60)" : "rgba(255,255,255,0.34)" }}>
                          Cycles overdue · {cadencePosture.cyclesOverdue}
                        </p>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: cadencePosture.reliability < 0.5 ? "rgba(245,158,11,0.60)" : "rgba(255,255,255,0.34)" }}>
                          Cadence reliability · {Math.round(cadencePosture.reliability * 100)}%
                        </p>
                      </>
                    )}
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                      Cadence source · {summary.retainedCadencePosture.cadenceSource}
                    </p>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                      Evidence posture · {summary.retainedCadencePosture.evidencePosture}
                    </p>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                      Source label · {summary.retainedCadencePosture.sourceLabel}
                    </p>
                  </div>
                </section>
              </section>

              {/* P6 — OVERSIGHT SIGNAL AUTHORITY: signal recurrence, cadence reliability, institutional signal tracking */}
              <section style={{ border: "1px solid rgba(201,169,110,0.14)", background: "rgba(201,169,110,0.025)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                  Retained signal authority
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Signal recurrence</p>
                    <p className="text-sm text-white/60">
                      {summary.retainedMemory.oversightCycles > 0
                        ? `${summary.retainedMemory.oversightCycles} oversight cycle${summary.retainedMemory.oversightCycles !== 1 ? "s" : ""} retained. Signal patterns are tracked across cycles for recurrence and escalation.`
                        : "No oversight cycles retained yet. Signal recurrence tracking begins after the first completed review cycle."}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Cadence reliability</p>
                    <p className="text-sm text-white/60">
                      {cadencePosture
                        ? cadencePosture.reliability >= 0.8
                          ? `${Math.round(cadencePosture.reliability * 100)}% — cadence is well-maintained. Signals are captured on a reliable review rhythm.`
                          : cadencePosture.reliability >= 0.5
                          ? `${Math.round(cadencePosture.reliability * 100)}% — cadence is partially maintained. Signal continuity may be disrupted by missed cycles.`
                          : `${Math.round(cadencePosture.reliability * 100)}% — cadence reliability is low. Signal continuity is at risk. Operator attention required.`
                        : "Cadence reliability data is not yet available for this scope."}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Active attention signal</p>
                    <p className="text-sm text-white/60">
                      {summary.attention.length === 0
                        ? "No active attention items. No elevated signal is currently published from retained oversight."
                        : (() => {
                            const high = summary.attention.filter((a) => a.severity === "HIGH").length;
                            const medium = summary.attention.filter((a) => a.severity === "MEDIUM").length;
                            const highest = high > 0 ? "HIGH" : medium > 0 ? "MEDIUM" : "LOW";
                            return `${summary.attention.length} attention item${summary.attention.length !== 1 ? "s" : ""} active. Highest severity: ${highest}. Signal authority is elevated.`;
                          })()}
                    </p>
                  </div>
                </div>
                {cadencePosture && cadencePosture.cyclesOverdue > 0 && (
                  <div className="mt-3">
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Cadence gap signal</p>
                    <p className="text-sm text-white/50">
                      {cadencePosture.cyclesOverdue} cycle{cadencePosture.cyclesOverdue !== 1 ? "s" : ""} overdue. Gaps in retained cadence reduce the continuity of signal detection. Unreviewed cycles may represent untracked escalation risk.
                    </p>
                  </div>
                )}
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                  Retained signal authority is derived from the oversight cycle record and cadence posture. Signal recurrence is a pattern estimate — not independently verified. Cadence reliability reflects the proportion of completed cycles against expected schedule.
                </p>
              </section>

              {/* P7 — SIGNAL MOVEMENT + REVIEW OBLIGATION + OPERATOR REVIEW REQUIREMENT */}
              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.60)" }}>
                  Signal movement and review obligation
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Movement direction</p>
                    <p className="text-sm text-white/60">
                      {cadencePosture
                        ? cadencePosture.cyclesOverdue > 1
                          ? "Rising — multiple overdue cycles indicate escalating oversight risk."
                          : cadencePosture.cyclesOverdue === 1
                            ? "Elevated — one cycle is overdue. Immediate review will stabilise trajectory."
                            : cadencePosture.reliability >= 0.8
                              ? "Stable — cadence is well-maintained. Signal trajectory is confirmed."
                              : "Drifting — cadence gaps are reducing the reliability of signal movement detection."
                        : "Insufficient cadence data to determine movement direction."}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Review obligation</p>
                    <p className="text-sm text-white/60">
                      {summary.attention.filter((a) => a.severity === "HIGH").length > 0
                        ? "Mandatory review — HIGH severity attention items are active. Operator review is required."
                        : summary.retainedMemory.oversightCycles > 0 && cadencePosture && cadencePosture.reliability < 0.6
                          ? "Review recommended — cadence reliability is below threshold. Operator attention warranted."
                          : "No mandatory review obligation at this time. Continue scheduled cadence."}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Operator review requirement</p>
                    <p className="text-sm text-white/60">
                      {summary.attention.filter((a) => a.severity === "HIGH").length > 0
                        ? "Required — HIGH severity signals are present and require human operator confirmation."
                        : summary.outcomeVerificationSummary.thinState
                          ? "Monitoring — outcome verification is thin; operator should schedule a structured review."
                          : "Not required — no conditions currently mandate operator review."}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Memory update status</p>
                    <p className="text-sm text-white/60">
                      {summary.retainedMemory.checkpointResponses > 0
                        ? `${summary.retainedMemory.checkpointResponses} checkpoint response${summary.retainedMemory.checkpointResponses !== 1 ? "s" : ""} recorded. Memory is active and updating with each review cycle.`
                        : "No checkpoint responses recorded. Memory update begins after the first verified outcome or checkpoint completion."}
                    </p>
                  </div>
                </div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.14)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                  Movement direction is derived from cadence posture and attention severity — not independently verified. Review obligation is a structural assessment, not a legal requirement.
                </p>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <SectionCard
                  eyebrow="Active Attention Queue"
                  title={summary.activeAttentionQueueSummary.summary}
                  body="This is the sponsor-safe count of active attention items currently published from retained oversight."
                  meta={[
                    `Source label · ${summary.activeAttentionQueueSummary.sourceLabel}`,
                    `Evidence posture · ${summary.activeAttentionQueueSummary.evidencePosture}`,
                    `As of · ${formatDate(summary.activeAttentionQueueSummary.asOf)}`,
                  ]}
                />
                <SectionCard
                  eyebrow="Latest Oversight Brief"
                  title={summary.latestOversightBriefStatus.status}
                  body={summary.latestOversightBriefStatus.summary}
                  meta={[
                    `Source label · ${summary.latestOversightBriefStatus.sourceLabel}`,
                    `Evidence posture · ${summary.latestOversightBriefStatus.evidencePosture}`,
                    `Date · ${formatDate(summary.latestOversightBriefStatus.asOf)}`,
                  ]}
                />
                <SectionCard
                  eyebrow="Outcome Verification"
                  title={summary.outcomeVerificationSummary.summary}
                  body={summary.outcomeVerificationSummary.thinState ? "Outcome history is thin." : "Outcome history is sufficient to contribute to retained oversight posture."}
                  meta={[
                    `Source label · ${summary.outcomeVerificationSummary.sourceLabel}`,
                    `Evidence posture · ${summary.outcomeVerificationSummary.evidencePosture}`,
                    `Date · ${formatDate(summary.outcomeVerificationSummary.asOf)}`,
                  ]}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <SectionCard
                  eyebrow="Counsel Memory"
                  title={summary.counselMemorySummary.summary}
                  body={summary.counselMemorySummary.empty ? "No counsel history has been retained yet." : `${summary.counselMemorySummary.totalEvents} event(s), ${summary.counselMemorySummary.openCount} open.`}
                  meta={[
                    `Source label · ${summary.counselMemorySummary.sourceLabel}`,
                    `Evidence posture · ${summary.counselMemorySummary.evidencePosture}`,
                    `Date · ${formatDate(summary.counselMemorySummary.asOf)}`,
                  ]}
                />
                <SectionCard
                  eyebrow="Boardroom Archive"
                  title={canViewBoardroomArchive(role) ? summary.boardroomArchiveSummary.summary : "Boardroom archive summary is suppressed for this role."}
                  body={canViewBoardroomArchive(role) ? (summary.boardroomArchiveSummary.empty ? "No boardroom archive has been retained yet." : `${summary.boardroomArchiveSummary.totalDossiers} dossier record(s), ${summary.boardroomArchiveSummary.unresolvedCount} unresolved.`) : "Boardroom archive visibility is restricted on this surface."}
                  meta={[
                    `Source label · ${summary.boardroomArchiveSummary.sourceLabel}`,
                    `Evidence posture · ${summary.boardroomArchiveSummary.evidencePosture}`,
                    `Date · ${formatDate(summary.boardroomArchiveSummary.asOf)}`,
                  ]}
                />
                <SectionCard
                  eyebrow="Continuity Loss"
                  title={summary.cancellationLossSummary.summary}
                  body={summary.cancellationLoss.retainedAssets.length > 0 ? summary.cancellationLoss.retainedAssets.join(", ") : "Continuity-loss detail remains thin until more retained history exists."}
                  meta={[
                    `Source label · ${summary.cancellationLossSummary.sourceLabel}`,
                    `Evidence posture · ${summary.cancellationLossSummary.evidencePosture}`,
                    `Date · ${formatDate(summary.cancellationLossSummary.asOf)}`,
                  ]}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Institutional memory retained</p>
                  <div className="mt-4 space-y-3 text-sm text-white/62">
                    <p>First captured: {summary.retainedMemory.firstCapturedAt ? new Date(summary.retainedMemory.firstCapturedAt).toLocaleDateString("en-GB") : "Not yet established"}</p>
                    <p>Most recent update: {summary.retainedMemory.lastUpdatedAt ? new Date(summary.retainedMemory.lastUpdatedAt).toLocaleDateString("en-GB") : "No retained update yet"}</p>
                    <p>Continuity fields carried forward: {summary.retainedMemory.completedStages}</p>
                    <p>Checkpoint responses retained: {summary.retainedMemory.checkpointResponses}</p>
                    <p>Portfolio memory: {canViewPortfolioMemory(role) ? "Visible on sponsor-safe basis where data exists." : "Suppressed for this role."}</p>
                  </div>
                </section>
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Suppression boundary</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/55">
                    {summary.suppression.map((item) => <li key={`${item.reason}-${item.scope}`}>{item.reason} ({item.scope})</li>)}
                  </ul>
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

              {cadenceHistory.length > 0 && (
                <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>Cadence history</p>
                  <div className="mt-4 space-y-2">
                    {cadenceHistory.slice(0, 20).map((event) => (
                      <div key={event.eventId} className="flex items-start gap-4 border-t border-white/5 pt-2 text-sm">
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.30)", minWidth: "80px" }}>
                          {new Date(event.timestamp).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-white/60">{event.action.replace(/_/g, " ").toLowerCase()}</p>
                        {event.reason && <p className="text-white/40">{event.reason}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <RetainedMemoryLossPanel summary={summary.cancellationLoss.summary} retainedAssets={summary.cancellationLoss.retainedAssets} />

              <section className="flex flex-wrap gap-3">
                {canViewPortfolioMemory(role) && (
                  <Link href="/oversight/portfolio" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">View Portfolio Memory &rarr;</Link>
                )}
                <Link href="/counsel/status" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Counsel status</Link>
                <Link href="/account/proof-pack" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Proof pack</Link>
                <Link href="/boardroom" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Boardroom archive</Link>
                <Link href="/engagements/retained-oversight" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">Review retained oversight pathway</Link>
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
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "OVERSIGHT_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;
  if (!access.permissions.isAuthenticated || !email) {
    return { props: { authenticated: false, summary: null, warnings: [], role: null, blockedByRole: false, cadencePosture: null, cadenceHistory: [], institutionalCaseSummary: null } };
  }

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const result = await buildSponsorSafeCommandSummary({ userId, email, organisationId });
  const resolvedOrganisationId = organisationId ?? result.account?.organisationId ?? null;
  const membership = resolvedOrganisationId
    ? await prisma.organisationMembership.findFirst({
        where: {
          organisationId: resolvedOrganisationId,
          email,
          status: "active",
        },
        select: {
          roleTitle: true,
          isExecutive: true,
        },
      }).catch(() => null)
    : null;

  const role = deriveRetainedProductRole({
    isAdmin: access.permissions.isAdmin,
    organisationRole: membership?.roleTitle ?? (membership?.isExecutive ? "EXECUTIVE" : result.account?.ownerUserId === userId ? "OWNER" : null),
    authenticated: access.permissions.isAuthenticated,
  });

  // Compute cadence posture and history for the resolved scope
  const scopeId = resolvedOrganisationId ?? result.account?.accountId ?? null;
  let cadencePosture: CadencePostureForSponsor | null = null;
  let cadenceHistory: CadenceHistoryEvent[] = [];
  if (scopeId && canViewSponsorCommandSummary(role)) {
    cadencePosture = await computeCadencePostureForSponsor(scopeId).catch(() => null);
    cadenceHistory = await loadCadenceHistory(scopeId).catch(() => []);
  }

  // Load institutional case metrics for corridor awareness
  let institutionalCaseSummary: InstitutionalCaseOversight | null = null;
  try {
    const { listInstitutionalCases } = await import("@/lib/product/institutional-case-service");
    const { QUALIFICATION_RANK } = await import("@/lib/product/institutional-case-contract");
    const cases = await listInstitutionalCases({ email, organisationId: resolvedOrganisationId ?? undefined });
    if (cases.length > 0) {
      institutionalCaseSummary = {
        totalInstitutionalCases: cases.length,
        qualifiedCount: cases.filter((c) => QUALIFICATION_RANK[c.qualificationState] >= QUALIFICATION_RANK.INSTITUTIONAL_QUALIFIED).length,
        boardroomCount: cases.filter((c) => c.institutionalFlags.hasBoardroomDossier).length,
        oversightActiveCount: cases.filter((c) => QUALIFICATION_RANK[c.qualificationState] >= QUALIFICATION_RANK.RETAINED_OVERSIGHT_ACTIVE).length,
      };
    }
  } catch { /* best-effort */ }

  return {
    props: {
      authenticated: true,
      summary: canViewSponsorCommandSummary(role) ? result.summary : null,
      warnings: result.warnings,
      role,
      blockedByRole: !canViewSponsorCommandSummary(role),
      cadencePosture,
      cadenceHistory,
      institutionalCaseSummary,
    },
  };
};

export default OversightPage;
