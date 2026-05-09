import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { loadBoardroomArchiveCommandSummary } from "@/lib/product/boardroom-archive-summary";

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
                  {institutionalCase.scenarioPressure.uncertaintyCaveat}
                </p>
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

      // Wire stakeholder map + simulation into boardroom context
      try {
        const { getDiagnosticJourney } = await import("@/lib/diagnostics/journey-store");
        const journey = await getDiagnosticJourney({ email });
        const caseObj = journey.decisionObjects?.slice(-1)?.[0];
        if (caseObj) {
          const { buildStakeholderMapFromCase } = await import("@/lib/decision/stakeholder-map");
          const map = buildStakeholderMapFromCase(caseObj as any);
          institutionalCase.stakeholderExposure = {
            approvalRequired: map.formalOwner,
            potentialBlockers: map.blockers.slice(0, 3),
            consequenceBearers: map.misalignedParties.length > 0 ? ["Misaligned stakeholder identified"] : [],
            unresolvedContradiction: map.realOwner && map.formalOwner && map.realOwner !== map.formalOwner
              ? `Stated owner (${map.formalOwner}) may not be the actual decision-maker.`
              : null,
            thinState: !map.formalOwner && map.blockers.length === 0,
          };

          // Simulation — scenario pressure
          try {
            const { loadSpineFromJourney } = await import("@/lib/decision/spine-persistence");
            const { prisma } = await import("@/lib/prisma");
            const spine = await loadSpineFromJourney(email, prisma as unknown as Parameters<typeof loadSpineFromJourney>[1]);
            if (spine) {
              const { simulateAction } = await import("@/lib/decision/simulation-engine");
              const sim = simulateAction({ action: "do_nothing", spine, stakeholderMap: map });
              institutionalCase.scenarioPressure = {
                likelyConsequence: sim.immediateEffect,
                bestControlledPath: sim.recommendation,
                worstAvoidablePath: sim.secondOrderEffect,
                uncertaintyCaveat: sim.confidence < 0.5
                  ? "Scenario estimate has low confidence. Not independently verified."
                  : "Scenario estimate based on current record. Not independently verified.",
                thinState: sim.confidence < 0.3,
              };
            }
          } catch { /* degrade */ }
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
