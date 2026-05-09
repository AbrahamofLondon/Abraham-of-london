// pages/counsel/index.tsx
// Design: Institutional Monumentalism — governed escalation surface
// This is the human escalation chamber. Not a brochure.
// Access is controlled by evidence, escalation thresholds, and retainer status.

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, AlertTriangle, ShieldCheck, Clock, FileText, Activity } from "lucide-react";

import Layout from "@/components/Layout";
import GovernanceEvidenceCarryForward from "@/components/strategy-room/GovernanceEvidenceCarryForward";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";
import {
  convertFinancialExposureToGovernedMemory,
} from "@/lib/product/financial-exposure-persistence";
import { resolvePageAccess } from "@/lib/access/server";
import type { CounselRoomState } from "@/lib/product/counsel-room-contract";
import { COUNSEL_ACCESS_LABELS } from "@/lib/product/counsel-room-contract";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

type CounselPageProps = {
  counselState: CounselRoomState | null;
  paEvidence: Record<string, unknown> | null;
  feEvidence: Record<string, unknown> | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const CounselPage: NextPage<CounselPageProps> = ({ counselState, paEvidence, feEvidence }) => {
  // ── Convert evidence to governed memory items ──
  const paMemory = React.useMemo(() => {
    if (!paEvidence) return [];
    return convertPurposeAlignmentToGovernedMemory({
      available: true,
      sourceSurface: "PURPOSE_ALIGNMENT",
      assessedAt: (paEvidence as any).assessedAt ?? null,
      schemaVersion: null,
      profile: (paEvidence as any).profile ?? null,
      compositeScore: (paEvidence as any).compositeScore ?? null,
      strongestDomain: (paEvidence as any).strongestDomain ?? null,
      weakestDomain: (paEvidence as any).weakestDomain ?? null,
      competingObligation: (paEvidence as any).competingObligation ?? null,
      consequence: (paEvidence as any).consequence ?? null,
      institutionalConsequence: (paEvidence as any).institutionalConsequence ?? null,
      primaryPattern: (paEvidence as any).primaryPattern ?? null,
      patternConsequence: (paEvidence as any).patternConsequence ?? null,
      contradictions: (paEvidence as any).contradictions ?? [],
      domainScores: (paEvidence as any).domainScores ?? [],
      firstAction: (paEvidence as any).firstAction ?? null,
      corrections: [],
      assessmentId: (paEvidence as any).assessmentId ?? null,
    });
  }, [paEvidence]);

  const feMemory = React.useMemo(() => {
    if (!feEvidence) return [];
    return convertFinancialExposureToGovernedMemory({
      userCostOfDelayText: (feEvidence as any).userCostOfDelayText ?? null,
      estimatedFinancialExposure: (feEvidence as any).estimatedFinancialExposure ?? null,
      exposureBand: (feEvidence as any).exposureBand ?? null,
      exposureBasis: (feEvidence as any).exposureBasis ?? null,
      computedAt: (feEvidence as any).computedAt ?? "",
      sourceSurface: (feEvidence as any).sourceSurface ?? "unknown",
      schemaVersion: (feEvidence as any).schemaVersion ?? "1.0.0",
    });
  }, [feEvidence]);

  const mergedMemory = [...paMemory, ...feMemory];
  const hasEvidence = mergedMemory.length > 0;

  // ── Counsel state ──
  const state = counselState ?? {
    accessState: "NO_EVIDENCE" as const,
    canRequestCounsel: false,
    canViewEvidencePackage: false,
    canSubmitStructuredIntake: false,
    reason: "Counsel is not yet warranted by the evidence available.",
    evidencePackage: null,
    recommendedPath: "COMPLETE_FAST_DIAGNOSTIC" as const,
  };

  const labels = COUNSEL_ACCESS_LABELS[state.accessState];
  const isRestricted = !state.canRequestCounsel && !state.canViewEvidencePackage;
  const isEligible = state.canRequestCounsel || state.canSubmitStructuredIntake;

  return (
    <Layout
      title="Counsel Review | Abraham of London"
      description="Governed escalation chamber. Counsel begins when the system determines that human judgement is necessary."
      canonicalUrl="/counsel"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content={isRestricted ? "noindex,nofollow" : "index,follow"} />
      </Head>

      <main style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-5xl px-6 py-32 lg:px-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                {isRestricted ? "Counsel Review · Restricted" : "Counsel Review · Escalation Chamber"}
              </span>
            </div>

            <h1 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1.0, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.92)", maxWidth: "16ch" }}>
              {labels.title}
            </h1>

            <p style={{ marginTop: "1.5rem", ...serif, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.45)", maxWidth: "48ch" }}>
              {labels.description}
            </p>

            {/* Restrained language line */}
            <p style={{ marginTop: "0.75rem", ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              {labels.restrained}
            </p>

            {/* CTAs based on access state */}
            <div className="flex flex-wrap gap-3 mt-10">
              {state.recommendedPath === "COMPLETE_FAST_DIAGNOSTIC" && (
                <Link href="/diagnostics/fast" style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                  Start Fast Diagnostic <ArrowRight style={{ width: "13px", height: "13px", display: "inline", marginLeft: 6 }} />
                </Link>
              )}
              {state.recommendedPath === "COMPLETE_CONSTITUTIONAL" && (
                <Link href="/diagnostics/constitutional-diagnostic" style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                  Complete Constitutional Diagnostic <ArrowRight style={{ width: "13px", height: "13px", display: "inline", marginLeft: 6 }} />
                </Link>
              )}
              {state.recommendedPath === "ENTER_STRATEGY_ROOM" && (
                <Link href="/strategy-room" style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                  Enter Strategy Room <ArrowRight style={{ width: "13px", height: "13px", display: "inline", marginLeft: 6 }} />
                </Link>
              )}
              {state.recommendedPath === "REQUEST_COUNSEL_REVIEW" && (
                <Link href="/counsel/intake" style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                  {state.canSubmitStructuredIntake ? "Submit Counsel Intake" : "Request Counsel Review"} <ArrowRight style={{ width: "13px", height: "13px", display: "inline", marginLeft: 6 }} />
                </Link>
              )}
              {state.recommendedPath === "RETAINER_REVIEW" && (
                <Link href="/retainer/dashboard" style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                  Open Retained Review <ArrowRight style={{ width: "13px", height: "13px", display: "inline", marginLeft: 6 }} />
                </Link>
              )}
              <Link href="/diagnostics" style={{ padding: "14px 28px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", textDecoration: "none" }}>
                View diagnostic ladder
              </Link>
            </div>
          </div>
        </section>

        {/* ── EVIDENCE PACKAGE ── */}
        {hasEvidence && (
          <section style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
              <div className="flex items-center gap-3 mb-8">
                <FileText style={{ width: "16px", height: "16px", color: `${GOLD}70` }} />
                <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Evidence package
                </span>
              </div>

              <GovernanceEvidenceCarryForward
                title="System evidence carried forward"
                intro="The following evidence from your diagnostic journey is relevant to counsel review."
                items={mergedMemory}
                variant="entry"
              />

              {/* Escalation details */}
              {state.evidencePackage && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                      Completed stages
                    </span>
                    <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.95rem", color: "rgba(255,255,255,0.72)" }}>
                      {state.evidencePackage.completedStages.length > 0
                        ? state.evidencePackage.completedStages.join(", ")
                        : "None"}
                    </p>
                  </div>
                  <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                      Escalation level
                    </span>
                    <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.95rem", color: state.evidencePackage.escalationLevel >= 2 ? "rgba(252,165,165,0.72)" : "rgba(255,255,255,0.72)" }}>
                      {state.evidencePackage.escalationLevel}
                    </p>
                  </div>
                  {state.evidencePackage.activeContradictions.length > 0 && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        Active contradictions
                      </span>
                      <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.95rem", color: "rgba(255,255,255,0.72)" }}>
                        {state.evidencePackage.activeContradictions.length}
                      </p>
                    </div>
                  )}
                  {(state.evidencePackage.overdueCheckpointCount > 0 || state.evidencePackage.blockedCheckpointCount > 0) && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        Checkpoint status
                      </span>
                      <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.95rem", color: "rgba(252,165,165,0.72)" }}>
                        {state.evidencePackage.overdueCheckpointCount > 0 && `${state.evidencePackage.overdueCheckpointCount} overdue`}
                        {state.evidencePackage.overdueCheckpointCount > 0 && state.evidencePackage.blockedCheckpointCount > 0 && " · "}
                        {state.evidencePackage.blockedCheckpointCount > 0 && `${state.evidencePackage.blockedCheckpointCount} blocked`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Escalation triggers */}
              {state.evidencePackage && state.evidencePackage.triggers.length > 0 && (
                <div className="mt-6" style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.02)", padding: "1rem 1.25rem" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle style={{ width: "14px", height: "14px", color: "rgba(252,165,165,0.55)" }} />
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
                      Escalation triggers detected
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {state.evidencePackage.triggers.map((trigger, i) => (
                      <li key={i} style={{ padding: "0.35rem 0", borderBottom: i < state.evidencePackage!.triggers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.50)" }}>
                        {trigger.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence posture */}
              {state.evidencePackage && (
                <p style={{ marginTop: "0.75rem", ...mono, fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
                  Evidence posture: {state.evidencePackage.evidencePosture.replace(/_/g, " ").toLowerCase()}
                  {state.evidencePackage.suppressionReasons.length > 0 && ` · ${state.evidencePackage.suppressionReasons.length} suppression(s) active`}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── RESTRICTED STATE — no evidence ── */}
        {isRestricted && !hasEvidence && (
          <section className="py-24">
            <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
              <ShieldCheck style={{ width: "32px", height: "32px", color: `${GOLD}40`, margin: "0 auto 1.5rem" }} />
              <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", maxWidth: "40ch", margin: "0 auto" }}>
                Counsel Review exists for the cases the system should not pretend to resolve alone. When the evidence crosses the threshold for human judgement, the case enters Counsel Review.
              </p>
              <p style={{ marginTop: "1rem", ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
                No evidence yet. Complete a diagnostic first.
              </p>
            </div>
          </section>
        )}

        {/* ── ESCALATION ELIGIBLE / COUNSEL RECOMMENDED / REQUIRED ── */}
        {isEligible && (
          <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
              <div className="grid gap-8 lg:grid-cols-2">
                <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1.5rem" }}>
                  <ShieldCheck style={{ width: "24px", height: "24px", color: `${GOLD}80`, marginBottom: "1rem" }} />
                  <h3 style={{ ...serif, fontSize: "1.25rem", color: "rgba(255,255,255,0.88)" }}>
                    Request Counsel Review
                  </h3>
                  <p style={{ marginTop: "0.5rem", ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                    Submit a structured intake with your evidence package. The system will prefill what it knows — you add what only you know.
                  </p>
                  <Link href="/counsel/intake" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "10px 20px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                    Submit intake <ArrowRight style={{ width: 10, height: 10 }} />
                  </Link>
                </div>

                <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                  <Activity style={{ width: "24px", height: "24px", color: `${GOLD}50`, marginBottom: "1rem" }} />
                  <h3 style={{ ...serif, fontSize: "1.25rem", color: "rgba(255,255,255,0.88)" }}>
                    Continue in Strategy Room
                  </h3>
                  <p style={{ marginTop: "0.5rem", ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                    The Strategy Room provides governed execution tracking. Return to automated governance if counsel is not yet required.
                  </p>
                  <Link href="/strategy-room" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "10px 20px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                    Enter Strategy Room <ArrowRight style={{ width: 10, height: 10 }} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── RETAINER COVERED ── */}
        {state.accessState === "RETAINER_COVERED" && (
          <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06`, padding: "1.5rem" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock style={{ width: "18px", height: "18px", color: `${GOLD}80` }} />
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                    Retained oversight active
                  </span>
                </div>
                <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                  Your retained oversight agreement includes counsel review. Open the retained dashboard to view your review cadence, active cases, and next scheduled review.
                </p>
                <Link href="/retainer/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "10px 20px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                  Open retained review <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.25)", fontStyle: "italic", maxWidth: "48ch" }}>
              Counsel Review exists for the cases the system should not pretend to resolve alone. When the evidence crosses the threshold for human judgement, the case enters Counsel Review.
            </p>
          </div>
        </section>

      </main>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE PROPS
// ─────────────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<CounselPageProps> = async (ctx) => {
  const emptyProps: CounselPageProps = {
    counselState: null,
    paEvidence: null,
    feEvidence: null,
  };

  try {
    const { session, access } = await resolvePageAccess(ctx);
    if (!access.permissions.isAuthenticated || !session?.user?.email) {
      return { props: emptyProps };
    }

    const email = session.user.email;
    const { resolveCounselRoomState } = await import("@/lib/product/counsel-room-resolver");
    const counselState = await resolveCounselRoomState({ email });

    const props: CounselPageProps = {
      counselState,
      paEvidence: null,
      feEvidence: null,
    };

    // Load PA evidence
    try {
      const { loadPurposeAlignmentEvidence } = await import("@/lib/alignment/evidence-loader");
      const pa = await loadPurposeAlignmentEvidence({ email });
      if (pa.available) {
        props.paEvidence = pa as unknown as Record<string, unknown>;
      }
    } catch { /* best-effort */ }

    // Load FE evidence
    try {
      const { loadLatestFinancialExposure } = await import("@/lib/product/financial-exposure-persistence");
      const fe = await loadLatestFinancialExposure({ email });
      if (fe) {
        props.feEvidence = fe as unknown as Record<string, unknown>;
      }
    } catch { /* best-effort */ }

    return { props };
  } catch {
    return { props: emptyProps };
  }
};

export default CounselPage;
