// accessPosture: Retained oversight — board-level archive for retained clients
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import ValueReceipt from "@/components/product/ValueReceipt";
import { resolvePageAccess } from "@/lib/access/server";
import { loadBoardroomArchiveCommandSummary } from "@/lib/product/boardroom-archive-summary";

type BoardroomSignalExposure = {
  highestSeverity: string | null;
  executiveSummary: string;
  signals: Array<{
    signalName: string;
    patternTag: string;
    severityBand: string;
    narrativeSummary: string;
    differentiatorSummary: string;
    admissibleNextMove: string;
    sampleCaveat: string;
  }>;
};

type InstitutionalCaseBoardroomContext = {
  caseId: string;
  qualificationState: string;
  evidencePosture: string;
  boardroomEarned: boolean;
  admitted: string[];
  /** Decision authority and stakeholder exposure */
  stakeholderExposure?: {
    approvalRequired: string | null;
    potentialBlockers: string[];
    consequenceBearers: string[];
    unresolvedContradiction: string | null;
    thinState: boolean;
  } | null;
  /** Scenario pressure — what happens if this remains unresolved */
  scenarioPressure?: {
    likelyConsequence: string;
    bestControlledPath: string;
    worstAvoidablePath: string;
    uncertaintyCaveat: string;
    thinState: boolean;
  } | null;
  /** Decision record summary posture */
  decisionRecordPosture?: string | null;
  /** Contradiction pressure band */
  contradictionPressure?: string | null;
  /** Named intelligence signals detected for this case (P7 — signal exposure) */
  signalExposure?: BoardroomSignalExposure | null;
  /** Outcome verification state for board-level tracking */
  verificationStatus?: string | null;
  /** What verified outcomes write into institutional memory */
  memoryConsequence?: string | null;
};

type Props = {
  authenticated: boolean;
  summary: Awaited<ReturnType<typeof loadBoardroomArchiveCommandSummary>> | null;
  institutionalCase: InstitutionalCaseBoardroomContext | null;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const BoardroomArchivePage: NextPage<Props> = ({ authenticated, summary, institutionalCase }) => {
  return (
    <Layout title="Boardroom Archive" description="Boardroom archive as retained strategic memory." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Boardroom archive
            </p>
            <h1 className="mt-3 text-3xl text-white">Board-level strategic memory.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              Boardroom is not a one-off PDF. This archive shows whether board-level dossiers exist, when they were generated, and whether the current record is boardroom-ready.
            </p>
            <div className="mt-6 max-w-lg">
              <ValueReceipt
                price="Retained oversight"
                deliveryFormat="Governed brief + board dossier"
                includes={["Board-ready decision dossier", "Decision record with contradiction map", "Escalation history", "Qualification state"]}
                memoryWrite={true}
                dossierIncluded={true}
                accessPosture="retained"
                nextAdmissibleMove="Generate board dossier if qualified, or strengthen evidence to qualify"
                compact
              />
            </div>
          </header>

          {authenticated && institutionalCase && (
            <section style={{ border: "1px solid rgba(201,169,110,0.18)", background: "rgba(201,169,110,0.03)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Institutional case
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Qualification</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.qualificationState.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Boardroom status</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.boardroomEarned ? "Qualified" : "Not yet qualified"}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Evidence</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.evidencePosture.replace(/_/g, " ").toLowerCase()}</p>
                </div>
              </div>
            </section>
          )}

          {authenticated && institutionalCase?.stakeholderExposure && !institutionalCase.stakeholderExposure.thinState && (
            <section style={{ border: "1px solid rgba(201,169,110,0.12)", background: "rgba(201,169,110,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Decision authority and stakeholder exposure
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/60">
                {institutionalCase.stakeholderExposure.approvalRequired && (
                  <p>Stated approval authority: {institutionalCase.stakeholderExposure.approvalRequired}</p>
                )}
                {institutionalCase.stakeholderExposure.potentialBlockers.length > 0 && (
                  <p>Potential blockers: {institutionalCase.stakeholderExposure.potentialBlockers.join(", ")}</p>
                )}
                {institutionalCase.stakeholderExposure.unresolvedContradiction && (
                  <p className="text-white/50">{institutionalCase.stakeholderExposure.unresolvedContradiction}</p>
                )}
              </div>
            </section>
          )}

          {authenticated && institutionalCase?.scenarioPressure && !institutionalCase.scenarioPressure.thinState && (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Scenario pressure
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/60">
                <p>{institutionalCase.scenarioPressure.likelyConsequence}</p>
                <p className="text-white/50">{institutionalCase.scenarioPressure.bestControlledPath}</p>
                <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.30)", marginTop: "0.75rem" }}>
                  {institutionalCase.scenarioPressure.uncertaintyCaveat || "Scenario estimate based on current record. Not independently verified."}
                </p>
              </div>
            </section>
          )}

          {/* P6 — BOARD SIGNAL AUTHORITY: board relevance, objections, signal recurrence */}
          {authenticated && institutionalCase && (
            <section style={{ border: "1px solid rgba(201,169,110,0.14)", background: "rgba(201,169,110,0.025)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Board signal authority
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Board relevance</p>
                  <p className="text-sm text-white/60">
                    {institutionalCase.boardroomEarned
                      ? "Case has crossed the board-eligibility threshold. Evidence, consequence, and qualification conditions are satisfied."
                      : "Board eligibility not yet confirmed. Evidence and qualification conditions must be satisfied before board presentation."}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Decision record posture</p>
                  <p className="text-sm text-white/60">
                    {institutionalCase.decisionRecordPosture
                      ? institutionalCase.decisionRecordPosture.replace(/_/g, " ").toLowerCase()
                      : "Decision record posture not yet assessed."}
                  </p>
                </div>
              </div>
              {institutionalCase.contradictionPressure && (
                <div className="mt-3">
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Contradiction pressure</p>
                  <p className="text-sm text-white/50">{institutionalCase.contradictionPressure.replace(/_/g, " ").toLowerCase()} — unresolved contradictions are the primary board objection risk.</p>
                </div>
              )}
              {institutionalCase.stakeholderExposure && institutionalCase.stakeholderExposure.potentialBlockers.length > 0 && (
                <div className="mt-3">
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>Likely board objections</p>
                  <p className="text-sm text-white/50">Potential blockers identified: {institutionalCase.stakeholderExposure.potentialBlockers.join(", ")}. These represent the objection surface the board brief must address.</p>
                </div>
              )}
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                Board signal authority is derived from the institutional case record. Not independently verified. Board outcomes are scenario estimates.
              </p>
            </section>
          )}

          {/* P7 — SIGNAL EXPOSURE: named intelligence signals for board-level review */}
          {authenticated && institutionalCase?.signalExposure && (
            <section style={{ border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.03)", padding: "1rem" }}>
              <div className="flex items-center gap-3 mb-3">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(239,68,68,0.72)" }}>
                  Signal exposure
                </p>
                {institutionalCase.signalExposure.highestSeverity && (
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(239,68,68,0.50)", border: "1px solid rgba(239,68,68,0.20)", padding: "2px 6px" }}>
                    {institutionalCase.signalExposure.highestSeverity}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/65 mb-4">{institutionalCase.signalExposure.executiveSummary}</p>
              <div className="space-y-3">
                {institutionalCase.signalExposure.signals.map((signal) => (
                  <div key={signal.signalName} style={{ borderLeft: "2px solid rgba(239,68,68,0.25)", paddingLeft: "0.85rem" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(239,68,68,0.55)" }}>
                        {signal.severityBand}
                      </span>
                      <span className="text-sm text-white/80">{signal.signalName}</span>
                    </div>
                    <p className="text-xs text-white/45 italic mb-1">{signal.patternTag}</p>
                    <p className="text-xs text-white/55 leading-relaxed mb-2">{signal.narrativeSummary}</p>
                    <div style={{ borderLeft: "1px solid rgba(201,169,110,0.20)", paddingLeft: "0.65rem" }}>
                      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.45)", marginBottom: "0.2rem" }}>Board admission move</p>
                      <p className="text-xs text-white/50">{signal.admissibleNextMove}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.16)", marginTop: "0.75rem" }}>
                {institutionalCase.signalExposure.signals[0]?.sampleCaveat ?? "Signal patterns represent observed tendencies, not determinate predictions."}
              </p>
            </section>
          )}

          {/* P7 — VERIFICATION STATUS + MEMORY CONSEQUENCE */}
          {authenticated && institutionalCase?.verificationStatus && (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.60)" }}>
                Verification state
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.25rem" }}>Status</p>
                  <p className="text-sm text-white/60">{institutionalCase.verificationStatus.replace(/_/g, " ")}</p>
                </div>
                {institutionalCase.memoryConsequence && (
                  <div style={{ borderLeft: "2px solid rgba(201,169,110,0.20)", paddingLeft: "0.85rem" }}>
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.45)", marginBottom: "0.25rem" }}>Memory consequence</p>
                    <p className="text-xs text-white/50 leading-relaxed">{institutionalCase.memoryConsequence}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!authenticated ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Sign in to view boardroom archive state.</p>
            </section>
          ) : !summary ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">No boardroom archive is available for this scope yet.</p>
              <p className="mt-3 text-sm leading-7 text-white/50">Boardroom memory appears only when evidence, consequence, and qualification conditions justify escalation.</p>
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                {[
                  ["Archive count", String(summary.archiveCount)],
                  ["Repeated exposure", String(summary.repeatedExposureCount)],
                  ["Unresolved", String(summary.unresolvedCount)],
                  ["Latest dossier", summary.latestDossier ? new Date(summary.latestDossier.generatedAt).toLocaleDateString("en-GB") : "None"],
                ].map(([label, value]) => (
                  <article key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{label}</p>
                    <p className="mt-3 text-2xl text-white">{value}</p>
                  </article>
                ))}
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p className="text-sm leading-7 text-white/65">{summary.summary}</p>
                {summary.latestDossier ? (
                  <div className="mt-4 space-y-2 text-sm text-white/56">
                    <p>Case reference: {summary.latestDossier.caseReference}</p>
                    <p>Qualification state: {summary.latestDossier.qualificationStatus.replace(/_/g, " ").toLowerCase()}</p>
                    <p>Download availability: {summary.latestDossier.downloadAvailable ? "Available through the dossier route" : "Not yet available"}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/50">Not yet qualified. Evidence must first justify board-level escalation before any dossier is archived.</p>
                )}
              </section>

              <div>
                <Link href="/oversight" className="text-sm text-white/60 underline-offset-4 hover:underline">Return to Retained Oversight Command</Link>
              </div>
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
  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return { props: { authenticated: false, summary: null, institutionalCase: null } };
  }

  const email = session.user.email.toLowerCase();
  let institutionalCase: InstitutionalCaseBoardroomContext | null = null;
  try {
    const { resolveInstitutionalCase } = await import("@/lib/product/institutional-case-resolver");
    const { buildPublicSummary } = await import("@/lib/product/institutional-case-contract");
    const ic = await resolveInstitutionalCase(email);
    if (ic) {
      const pub = buildPublicSummary(ic);
      institutionalCase = {
        caseId: pub.caseId,
        qualificationState: pub.qualificationState,
        evidencePosture: pub.evidencePosture,
        boardroomEarned: pub.boardroomEarned,
        admitted: pub.admitted,
      };

      // Canonical composer — single source for all institutional intelligence
      try {
        const { composeInstitutionalCaseIntelligence } = await import("@/lib/product/institutional-case-intelligence-composer");
        const intel = await composeInstitutionalCaseIntelligence({ email, caseId: pub.caseId, viewerRole: "SPONSOR" });
        if (intel.status === "COMPOSED") {
          if (intel.stakeholderPressure && !intel.stakeholderPressure.thinState) {
            institutionalCase.stakeholderExposure = {
              approvalRequired: intel.stakeholderPressure.decisionOwner,
              potentialBlockers: intel.stakeholderPressure.potentialBlockers,
              consequenceBearers: intel.stakeholderPressure.affectedGroups.filter((g) => !g.startsWith("Blocking")),
              unresolvedContradiction: intel.stakeholderPressure.unresolvedAuthorityTension,
              thinState: false,
            };
          }
          if (intel.scenarioPressure && !intel.scenarioPressure.thinState) {
            institutionalCase.scenarioPressure = {
              likelyConsequence: intel.scenarioPressure.likelyConsequence,
              bestControlledPath: intel.scenarioPressure.bestControlledPath,
              worstAvoidablePath: intel.scenarioPressure.worstAvoidablePath,
              uncertaintyCaveat: intel.scenarioPressure.uncertaintyCaveat,
              thinState: false,
            };
          }
          if (intel.decisionRecordSummary) {
            institutionalCase.decisionRecordPosture = intel.decisionRecordSummary.posture;
          }
          if (intel.contradictionPressure) {
            institutionalCase.contradictionPressure = intel.contradictionPressure.pressureBand;
          }
          // P7 — signal exposure for boardroom
          if (intel.sovereignSignals && intel.sovereignSignals.signals.length > 0) {
            institutionalCase.signalExposure = {
              highestSeverity: intel.sovereignSignals.highestSeverity ?? null,
              executiveSummary: intel.sovereignSignals.executiveSummary,
              signals: intel.sovereignSignals.signals.map((s) => ({
                signalName: s.signalName,
                patternTag: s.patternTag,
                severityBand: s.severityBand,
                narrativeSummary: s.narrativeSummary,
                differentiatorSummary: s.differentiatorSummary,
                admissibleNextMove: s.admissibleNextMove,
                sampleCaveat: s.sampleCaveat,
              })),
            };
          }
          // P7 — verification status and memory consequence
          if (intel.recommendationEffectiveness && !intel.recommendationEffectiveness.thinState) {
            const { actedOn, blocked, disputed, totalOutcomeScore } = intel.recommendationEffectiveness;
            institutionalCase.verificationStatus =
              actedOn > 0 ? "verified_outcomes_present"
              : blocked > 0 ? "action_blocked"
              : disputed > 0 ? "disputed"
              : "pending_verification";
            institutionalCase.memoryConsequence =
              actedOn > 0
                ? `${actedOn} verified outcome${actedOn > 1 ? "s" : ""} on record. Outcome score: ${totalOutcomeScore.toFixed(1)}. These write into comparison basis maturity and signal recurrence for this case.`
                : "No verified outcomes on record yet. Outcome verification will write into comparison basis maturity and institutional signal memory.";
          }
        }
      } catch { /* degrade gracefully */ }
    }
  } catch { /* best-effort */ }

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const summary = organisationId
    ? await loadBoardroomArchiveCommandSummary({ organisationId }).catch(() => null)
    : null;
  return { props: { authenticated: true, summary, institutionalCase } };
};

export default BoardroomArchivePage;
