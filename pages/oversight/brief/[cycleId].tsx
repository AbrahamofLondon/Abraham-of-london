import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { loadOversightCycleArchive } from "@/lib/product/oversight-cycle-archive";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCycleAudience, OversightCycleArchiveRecord } from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import type { BuyerVisibleCadencePosture } from "@/lib/product/retained-cadence-contract";
import { loadLatestRetainedReviewCycleForAccount, buildBuyerVisibleCadencePosture } from "@/lib/product/retained-cadence-service";
import { canViewSponsorCommandSummary, deriveRetainedProductRole } from "@/lib/product/retained-role-contract";
import { verifyRetainerAccess } from "@/lib/retainers/retainer-service";
import GovernanceEvidenceCarryForward from "@/components/strategy-room/GovernanceEvidenceCarryForward";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";

type ComposerIntelligence = {
  contradictionPressureBand: string | null;
  contradictionCount: number;
  suppressedCount: number;
  suppressionExplanation: string;
  thinStateReasons: string[];
};

type PageProps = {
  blockedReason: string | null;
  cycle: OversightCycleArchiveRecord | null;
  brief: OversightBrief | null;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  nextCycleIntent: OversightCycleArchiveRecord["nextCycleIntent"] | null;
  cycleComparison: OversightCycleComparison | null;
  audience: OversightCycleAudience;
  cadencePosture: BuyerVisibleCadencePosture | null;
  composerIntelligence: ComposerIntelligence | null;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const GOLD = "#C9A96E";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.025)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>{title}</p>
      <div style={{ marginTop: "0.85rem" }}>{children}</div>
    </section>
  );
}

const OversightBriefPage: NextPage<PageProps> = ({
  blockedReason,
  cycle,
  brief,
  suppressions,
  nextCycleIntent,
  cycleComparison,
  audience,
  cadencePosture,
  composerIntelligence,
}) => {
  return (
    <Layout title="Oversight Brief" description="Governed monthly oversight brief" fullWidth>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "1.25rem", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Governed Oversight Brief
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Reviewed cycle artifact
            </h1>
            {cycle ? (
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Cycle identity</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{cycle.cycleId}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Oversight period</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>
                    {new Date(cycle.periodStart).toLocaleDateString("en-GB")} to {new Date(cycle.periodEnd).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Delivery state</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{cycle.deliveryStatus}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Audience</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{audience}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Evidence boundary</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>
                    {audience === "BOARD_LEVEL" ? "Board-safe consequence view" : "Sponsor-safe governed view"}
                  </div>
                </div>
              </div>
            ) : null}
          </header>

          {blockedReason ? (
            <Section title="Access Blocked">
              <p style={{ ...serif, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>{blockedReason}</p>
            </Section>
          ) : null}

          {!blockedReason && brief && (
            <>
              <Section title="Executive Summary">
                <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>{brief.executiveSummary}</p>
              </Section>

              {cycleComparison?.available && (
                <Section title="What Changed">
                  <div className="space-y-4">
                    {cycleComparison.deltas.filter((delta) => delta.direction !== "UNCHANGED").map((delta) => (
                      <div key={`${delta.dimension}-${delta.explanation}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                          {delta.dimension} · {delta.direction}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{delta.explanation}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {(brief.cadence || cadencePosture) && (
                <Section title="Cadence Posture">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {cadencePosture?.state === "NOT_CONFIGURED"
                      ? "Retained cadence is not configured for this account."
                      : cadencePosture?.state === "MANUAL_OPERATOR_REVIEW"
                        ? "Retained review is operator-confirmed. Automated scheduling is not active for this account."
                        : cadencePosture?.state === "SCHEDULED"
                          ? `Next retained review is scheduled for ${cadencePosture.scheduledFor ? new Date(cadencePosture.scheduledFor).toLocaleDateString("en-GB") : "the recorded date"}.`
                          : cadencePosture?.state === "DUE_SOON"
                            ? "A retained review is due soon."
                            : cadencePosture?.state === "OVERDUE"
                              ? "A retained review is overdue. Operator attention is required."
                              : cadencePosture?.state === "COMPLETED"
                                ? `Latest retained review completed on ${cadencePosture.lastCompletedAt ? new Date(cadencePosture.lastCompletedAt).toLocaleDateString("en-GB") : "the recorded date"}.`
                                : cadencePosture?.state === "SKIPPED_WITH_REASON"
                                  ? "Latest retained review was skipped with recorded reason."
                                  : cadencePosture?.state === "ESCALATED"
                                    ? "This retained review cycle has been escalated."
                                    : brief.cadence?.explanation}
                  </p>
                  <p className="mt-2" style={{ ...serif, color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>
                    {cadencePosture?.explanation ?? brief.cadence?.explanation}
                  </p>
                  <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                    {(cadencePosture?.state ?? brief.cadence?.status ?? "UNAVAILABLE")}
                    {brief.cadence?.health ? ` · ${brief.cadence.health}` : ""}
                    {cadencePosture?.scheduledFor ? ` · Next review ${new Date(cadencePosture.scheduledFor).toLocaleDateString("en-GB")}` : ""}
                    {cadencePosture?.lastCompletedAt ? ` · Last review ${new Date(cadencePosture.lastCompletedAt).toLocaleDateString("en-GB")}` : ""}
                    {cadencePosture?.cadenceSource ? ` · ${cadencePosture.cadenceSource}` : ""}
                    {cadencePosture?.evidencePosture ? ` · ${cadencePosture.evidencePosture}` : ""}
                    {cadencePosture?.sourceLabel ? ` · ${cadencePosture.sourceLabel}` : ""}
                  </p>
                </Section>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <Section title="What Repeated">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.patternRecurrence
                      ? `${brief.patternRecurrence.explanation} (${brief.patternRecurrence.priorCount} prior case${brief.patternRecurrence.priorCount !== 1 ? "s" : ""}).`
                      : "No persisted recurrence signal was published in this cycle."}
                  </p>
                </Section>

                <Section title="What Became More Expensive">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.costOfInaction
                      ? `£${brief.costOfInaction.totalEstimated.toLocaleString()} estimated across ${brief.costOfInaction.casesIncluded} case${brief.costOfInaction.casesIncluded !== 1 ? "s" : ""}.`
                      : "No verified cost basis was published in this cycle."}
                  </p>
                </Section>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Section title="What Became Harder To Reverse">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.irreversibility
                      ? `${brief.irreversibility.level} (${brief.irreversibility.score}/100). ${brief.irreversibility.explanation}`
                      : "No irreversibility signal was published in this cycle."}
                  </p>
                </Section>

                <Section title="What Options Are Closing">
                  {brief.strategicOptions?.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length ? (
                    <ul className="space-y-3">
                      {brief.strategicOptions.options
                        .filter((item) => item.status === "CLOSING" || item.status === "EXPIRED")
                        .map((item) => (
                          <li key={item.id} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                            {item.label}: {item.closingReason || item.status.toLowerCase()}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>No option-decay signal was published in this cycle.</p>
                  )}
                </Section>
              </div>

              {/* ── CYCLE PROJECTION ── */}
              {(brief as any).cycleProjection && (
                <Section title="Cycle Projection">
                  <div className="space-y-3">
                    <div>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>What became harder</p>
                      <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{(brief as any).cycleProjection.whatBecameHarder}</p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>What may become more expensive</p>
                      <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{(brief as any).cycleProjection.whatMayBecomeMoreExpensive}</p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>What needs review before next cycle</p>
                      <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{(brief as any).cycleProjection.whatNeedsReviewBeforeNextCycle}</p>
                    </div>
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)", marginTop: "0.5rem" }}>
                      {(brief as any).cycleProjection.sourceLabel}
                    </p>
                  </div>
                </Section>
              )}

              {/* ── STAKEHOLDER FRICTION ── */}
              {(brief as any).stakeholderFriction && !(brief as any).stakeholderFriction.suppressedBelowThreshold && (
                <Section title="Repeated Stakeholder Friction">
                  <ul className="space-y-2">
                    {((brief as any).stakeholderFriction.recurringPatterns as string[]).map((pattern: string, i: number) => (
                      <li key={i} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{pattern}</li>
                    ))}
                  </ul>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)", marginTop: "0.5rem" }}>
                    {(brief as any).stakeholderFriction.sourceLabel}
                  </p>
                </Section>
              )}

              {/* ── PURPOSE ALIGNMENT EVIDENCE ── */}
              {(() => {
                if (!brief.purposeAlignment) return null;
                const pa = brief.purposeAlignment as Record<string, unknown>;
                const paItems = convertPurposeAlignmentToGovernedMemory({
                  available: true,
                  sourceSurface: "PURPOSE_ALIGNMENT",
                  assessedAt: (pa.assessedAt as string) ?? null,
                  schemaVersion: null,
                  profile: (pa.profile as string) ?? null,
                  compositeScore: (pa.compositeScore as number) ?? null,
                  strongestDomain: null,
                  weakestDomain: (pa.weakestDomain as string) ?? null,
                  competingObligation: null,
                  consequence: null,
                  institutionalConsequence: null,
                  primaryPattern: (pa.patternLabel as string) ?? null,
                  patternConsequence: null,
                  contradictions: [],
                  domainScores: [],
                  firstAction: null,
                  corrections: [],
                  assessmentId: null,
                });
                if (paItems.length === 0) return null;
                return (
                  <Section title="Purpose Alignment Memory">
                    <GovernanceEvidenceCarryForward
                      title="Earlier alignment signal"
                      intro="The following Purpose Alignment evidence remains relevant to this oversight scope. Only safe, summarised signals are shown."
                      items={paItems}
                      variant="session"
                    />
                  </Section>
                );
              })()}

              {/* ── OVERSIGHT SIGNALS ── */}
              {(brief as any).oversightSignals?.length > 0 && (
                <Section title="Oversight Evidence Signals">
                  <div className="space-y-4">
                    {((brief as any).oversightSignals as Array<{ id: string; type: string; severity: string; title: string; explanation: string; recommendedAction: string; sourceLabel?: string; evidencePosture?: string }>).map((signal) => (
                      <div key={signal.id} style={{ borderLeft: `2px solid ${signal.severity === "HIGH" || signal.severity === "CRITICAL" ? "rgba(252,165,165,0.40)" : "rgba(201,169,110,0.30)"}`, paddingLeft: "16px" }}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: signal.severity === "HIGH" || signal.severity === "CRITICAL" ? "rgba(252,165,165,0.50)" : "rgba(201,169,110,0.50)" }}>
                          {signal.type.replace(/_/g, " ")} &middot; {signal.severity}
                        </p>
                        <p className="mt-1" style={{ ...serif, fontWeight: 500, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                          {signal.title}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.60)", lineHeight: 1.6 }}>
                          {signal.explanation}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontStyle: "italic" }}>
                          Recommended: {signal.recommendedAction}
                        </p>
                        {signal.sourceLabel && (
                          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "6px" }}>
                            {signal.sourceLabel}{signal.evidencePosture ? ` · Evidence posture: ${signal.evidencePosture}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── RETAINER INTAKE MANDATE ── */}
              {(brief as any).retainerIntake && (brief as any).retainerIntake.clientSafeSummary?.length > 0 && (
                <Section title="Retainer Mandate Carried Forward">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "16px" }}>
                    This section reflects the oversight mandate recorded at intake. It is used to keep this cycle aligned with the scope the client entered, not as independently verified evidence.
                  </p>
                  {((brief as any).retainerIntake.clientSafeSummary as string[]).map((item: string, i: number) => (
                    <p key={i} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, marginBottom: "6px" }}>
                      {item}
                    </p>
                  ))}
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginTop: "12px" }}>
                    Source: Retainer Intake &middot; Evidence posture: client-reported
                    {(brief as any).retainerIntake.capturedAt && ` · Captured: ${new Date((brief as any).retainerIntake.capturedAt).toLocaleDateString("en-GB")}`}
                  </p>
                  {(brief as any).retainerIntake.suppressionReasons?.length > 0 && (
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(201,169,110,0.35)", marginTop: "6px" }}>
                      Some intake fields were suppressed for safety.
                    </p>
                  )}
                </Section>
              )}

              {brief.organisationDivergence && brief.organisationDivergence.count > 0 && (
                <Section title="Organisation Divergence">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.organisationDivergence.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.organisationDivergence.items.map((item) => (
                      <div key={`${item.type}-${item.affectedDomain}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {item.type} · {item.confidence}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item.sponsorSafeSummary}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {(brief.boardroomArchive || brief.counselHistory) && (
                <div className="grid gap-6 md:grid-cols-2">
                  {brief.boardroomArchive && (
                    <Section title="Boardroom Memory">
                      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.boardroomArchive.summary}</p>
                      <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                        {brief.boardroomArchive.previousDossierCount} prior dossier{brief.boardroomArchive.previousDossierCount === 1 ? "" : "s"} · {brief.boardroomArchive.repeatedExposureCount} repeated exposure{brief.boardroomArchive.repeatedExposureCount === 1 ? "" : "s"}
                      </p>
                    </Section>
                  )}
                  {brief.counselHistory && (
                    <Section title="Counsel Status">
                      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.counselHistory.summary}</p>
                      <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                        {brief.counselHistory.totalEvents} event{brief.counselHistory.totalEvents === 1 ? "" : "s"} · {brief.counselHistory.openCount} open
                      </p>
                    </Section>
                  )}
                </div>
              )}

              <Section title="What Must Be Decided Now">
                {brief.structuredActions?.length ? (
                  <div className="space-y-4">
                    {brief.structuredActions.map((action) => (
                      <div key={action.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {action.actionType} · {action.severity}
                        </p>
                        <p className="mt-2" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>{action.action}</p>
                        {action.evidenceBasis ? (
                          <p className="mt-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.62)" }}>
                            {action.continuitySourceLabel
                              ? `Continuity source · ${action.continuityConfidenceLabel || "CAPTURED"}`
                              : "Continuity source"}
                          </p>
                        ) : null}
                        {action.continuitySourceLabel ? (
                          <p className="mt-1" style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.34)" }}>
                            {action.continuitySourceLabel}
                          </p>
                        ) : null}
                        {action.evidenceBasis ? (
                          <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.56)", lineHeight: 1.58 }}>{action.evidenceBasis}</p>
                        ) : null}
                        {action.consequenceIfIgnored ? (
                          <p className="mt-2" style={{ ...serif, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{action.consequenceIfIgnored}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {brief.requiredActions.map((action) => (
                      <li key={action} style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>{action}</li>
                    ))}
                  </ul>
                )}
              </Section>

              {brief.valueProtected && (
                <Section title="Value Protected">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.valueProtected.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.valueProtected.missedSignals.map((signal) => (
                      <div key={signal.label}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {signal.label} · {signal.severity}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{signal.whyItMatters}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {brief.cancellationLoss && (
                <Section title="Visibility Preserved">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.cancellationLoss.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.cancellationLoss.lostVisibility.map((item) => (
                      <div key={`${item.area}-${item.description}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {item.area} · {item.severity}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {brief.indispensability && (
                <Section title="What Would Be Missed">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.indispensability.headline}</p>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Preserved visibility</p>
                      <ul className="mt-2 space-y-2">
                        {brief.indispensability.preservedVisibility.map((item) => (
                          <li key={item} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Would be lost</p>
                      <ul className="mt-2 space-y-2">
                        {brief.indispensability.wouldLose.map((item) => (
                          <li key={item} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Section>
              )}

              {brief.sovereignSignalRecurrence && brief.sovereignSignalRecurrence.currentCycleSignals.length > 0 && (
                <Section title="Signal Pattern Recurrence">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.sovereignSignalRecurrence.recurrenceSummary}</p>
                  {brief.sovereignSignalRecurrence.hasCriticalRecurrence && (
                    <p className="mt-3" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(252,165,165,0.70)" }}>
                      Critical pattern has recurred across oversight cycles
                    </p>
                  )}
                  <div className="mt-4 space-y-4">
                    {brief.sovereignSignalRecurrence.currentCycleSignals.map((signal) => (
                      <div key={signal.signalId} style={{ borderLeft: "1px solid rgba(255,255,255,0.10)", paddingLeft: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: signal.severityBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : signal.severityBand === "ALERT" ? "#C9A96E" : "rgba(255,255,255,0.50)" }}>
                            {signal.severityBand}
                          </p>
                          {signal.isRecurrence && (
                            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", border: "1px solid rgba(255,255,255,0.10)", padding: "1px 5px" }}>
                              Recurring · {signal.cycleCount} cycle{signal.cycleCount !== 1 ? "s" : ""}
                            </p>
                          )}
                          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: signal.movement === "INCREASING" ? "rgba(252,165,165,0.55)" : signal.movement === "REDUCING" ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.28)" }}>
                            {signal.movement.replace(/_/g, " ").toLowerCase()}
                          </p>
                        </div>
                        <p className="mt-1" style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.5, color: "rgba(255,255,255,0.74)" }}>{signal.signalName}</p>
                        <p className="mt-1" style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>{signal.retainedImplication}</p>
                        <p className="mt-1" style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)" }}>Next cycle: {signal.nextReviewObligation}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4" style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                    Evidence posture: {brief.sovereignSignalRecurrence.evidencePosture.replace(/_/g, " ").toLowerCase()} · {brief.sovereignSignalRecurrence.totalDistinctSignals} distinct signal pattern{brief.sovereignSignalRecurrence.totalDistinctSignals !== 1 ? "s" : ""} observed
                  </p>
                </Section>
              )}

              {suppressions.length > 0 && (
                <Section title="Suppression Notice">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    Some detail has been withheld to preserve privacy, entitlement boundaries, or small-sample safety.
                  </p>
                </Section>
              )}

              {nextCycleIntent && (
                <Section title="Next Review Window">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {nextCycleIntent.reason}
                  </p>
                  <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                    {nextCycleIntent.cadence} · {new Date(nextCycleIntent.nextCycleRecommendedDate).toLocaleDateString("en-GB")}
                  </p>
                </Section>
              )}

              {/* ── PDF Download ── */}
              <section className="border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                  Export
                </p>
                <p className="mt-3 text-sm leading-7 text-white/50">
                  Download a client-safe PDF of this oversight brief.
                </p>
                <button
                  className="mt-4 border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm text-amber-200 transition-colors hover:bg-amber-500/20"
                  onClick={() => {
                    if (!cycle?.subjectEmail) {
                      alert("No sponsor email is available for PDF generation.");
                      return;
                    }
                    fetch("/api/pdf/oversight-brief", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: cycle.subjectEmail,
                        organisationId: cycle.organisationId ?? null,
                      }),
                    })
                      .then((r) => {
                        if (!r.ok) throw new Error("PDF generation failed");
                        return r.blob();
                      })
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `oversight-brief-${brief.briefId}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      })
                      .catch(() => {
                        alert("PDF generation failed. Admin access may be required.");
                      });
                  }}
                >
                  Download PDF
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "OVERSIGHT_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const cycleId = typeof ctx.query.cycleId === "string" ? ctx.query.cycleId : null;
  const audience = ctx.query.audience === "BOARD_LEVEL" ? "BOARD_LEVEL" : "CLIENT_SPONSOR";
  if (!cycleId) {
    return { props: { blockedReason: "No oversight cycle was specified. Navigate to Retained Oversight Command to view available cycles. A cycle is created when a retained review period is completed.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience, cadencePosture: null, composerIntelligence: null } };
  }

  const archive = await loadOversightCycleArchive({ cycleId });
  if (!archive) {
    return { props: { blockedReason: "This oversight cycle could not be found. It may not have been archived yet, or the cycle reference may be incorrect. Oversight briefs become available after a retained review cycle is completed and archived by the system.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience, cadencePosture: null, composerIntelligence: null } };
  }

  const email = session.user.email.toLowerCase();
  const isAdmin = access.permissions.isAdmin;
  const membership = archive.record.organisationId
    ? await prisma.organisationMembership.findFirst({
        where: {
          organisationId: archive.record.organisationId,
          email,
          status: "active",
        },
        select: { roleTitle: true, isExecutive: true },
      })
    : null;
  const role = deriveRetainedProductRole({
    isAdmin,
    organisationRole: membership?.roleTitle ?? (membership?.isExecutive ? "EXECUTIVE" : archive.record.accountId ? "SPONSOR" : null),
    authenticated: access.permissions.isAuthenticated,
  });

  if (!isAdmin && !canViewSponsorCommandSummary(role)) {
    return { props: { blockedReason: "This sponsor-safe oversight brief is not available to the current role.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience, cadencePosture: null, composerIntelligence: null } };
  }

  if (!isAdmin && archive.record.organisationId) {
    const membershipGate = await prisma.organisationMembership.findFirst({
      where: {
        organisationId: archive.record.organisationId,
        email,
        status: "active",
      },
      select: { id: true },
    });
    if (!membershipGate) {
      return { props: { blockedReason: "Organisation access is required for this oversight brief.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience, cadencePosture: null, composerIntelligence: null } };
    }
  }

  const retainerAccess = await verifyRetainerAccess({
    contractId: archive.record.accountId,
    organisationId: archive.record.organisationId ?? null,
    email,
  });
  if (!retainerAccess.ok && !isAdmin) {
    return { props: { blockedReason: "Retainer access is not active for this account.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience, cadencePosture: null, composerIntelligence: null } };
  }

  const retainedCycle = await loadLatestRetainedReviewCycleForAccount({
    accountId: archive.record.accountId,
    organisationId: archive.record.organisationId ?? null,
    sponsorEmail: email,
  }).catch(() => null);
  const cadencePosture = buildBuyerVisibleCadencePosture(retainedCycle);

  // Canonical composer — contradiction pressure + suppression
  let composerIntelligence: ComposerIntelligence | null = null;
  try {
    const { composeInstitutionalCaseIntelligence } = await import("@/lib/product/institutional-case-intelligence-composer");
    const intel = await composeInstitutionalCaseIntelligence({
      email,
      organisationId: archive.record.organisationId ?? undefined,
      viewerRole: isAdmin ? "ADMIN" : "SPONSOR",
    });
    composerIntelligence = {
      contradictionPressureBand: intel.contradictionPressure?.pressureBand ?? null,
      contradictionCount: intel.contradictionPressure?.activeContradictions ?? 0,
      suppressedCount: intel.suppressionSummary.suppressedCount,
      suppressionExplanation: intel.suppressionSummary.explanation,
      thinStateReasons: intel.evidencePosture.thinStateReasons,
    };
  } catch { /* degrade */ }

  return {
    props: {
      blockedReason: null,
      cycle: archive.record,
      brief: archive.audienceBriefs[audience] ?? archive.clientSafeBrief,
      suppressions: archive.record.suppressions,
      nextCycleIntent: archive.record.nextCycleIntent ?? null,
      cycleComparison: archive.cycleComparison ?? null,
      audience,
      cadencePosture,
      composerIntelligence,
    },
  };
};

export default OversightBriefPage;
