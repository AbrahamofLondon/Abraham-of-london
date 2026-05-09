"use client";

/**
 * Return Brief — private briefing that makes inaction visible.
 *
 * Styled as a document, not an app screen.
 * Same visual system as Executive Report: 680px, left-aligned, document authority.
 */

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import IntelligenceGainPanel from "@/components/living/IntelligenceGainPanel";
import WhatChangedPanel from "@/components/living/WhatChangedPanel";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import GovernedActionPanel from "@/components/living/GovernedActionPanel";
import HumanReviewPrompt from "@/components/living/HumanReviewPrompt";
import ContinuityStatement from "@/components/product/ContinuityStatement";
import AdmissionNotice from "@/components/product/AdmissionNotice";
import GovernanceEvidenceCarryForward from "@/components/strategy-room/GovernanceEvidenceCarryForward";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";
import {
  convertFinancialExposureToGovernedMemory,
} from "@/lib/product/financial-exposure-persistence";

type ReturnBriefData = {
  sessionId: string;
  sessionKey: string;
  checkpointReference?: {
    checkpointId?: string | null;
    strategyRoomSessionId?: string | null;
    lookupMode: "CHECKPOINT_ID" | "STRATEGY_ROOM_SESSION";
    available: boolean;
  } | null;
  generatedAt: string;
  trigger: string;
  opening: string;
  trajectory: { state: string; reason: string };
  contradiction: { decision: string; constraint: string; status: string } | null;
  outcomeEvidence: {
    processedDecisionCases: number;
    improvedPercent: number;
    failureRateWhenIgnored: number;
    averageTimeToImprovementDays: number | null;
    confidence: string;
    statements: string[];
  } | null;
  delta: { clarity: string; authority: string; readiness: string } | null;
  costOfInaction?: {
    accumulatedCost: number;
    daysElapsed: number;
    basis: "MONTHLY" | "DAILY" | "UNAVAILABLE";
    explanation: string;
  } | null;
  verification?: Array<{
    commitmentId: string;
    label: string;
    dueAt?: string;
    checkpoint: "DAY_14" | "DAY_30" | "DAY_60" | "MONTHLY_RETAINER";
    status:
      | "NOT_DUE"
      | "DUE"
      | "OVERDUE"
      | "VERIFIED_EXECUTED"
      | "VERIFIED_BLOCKED"
      | "UNVERIFIED";
    prompt: string;
  }> | null;
  recurrence?: {
    status: "NO_PRIOR_PATTERN" | "POSSIBLE_RECURRENCE" | "VERIFIED_RECURRENCE" | "INSUFFICIENT_HISTORY";
    priorCount: number;
    explanation: string;
  } | null;
  evidenceCarryForward?: {
    source: Record<string, string | undefined>;
    verificationStatus?: string;
    failureComparison?: string;
    recurrenceStatus?: string;
    stopSignalStatus?: string;
  } | null;
  purposeAlignmentEvidence?: Record<string, unknown> | null;
  teamEvidence?: {
    source: string;
    largestGapDomain?: string;
    largestGapDelta?: number;
    trustScore?: number;
    respondentCount?: number;
    claimLevel?: string;
    summary: string;
  } | null;
  enterpriseEvidence?: {
    source: string;
    fragilitySignal?: string;
    percentScore?: number;
    weakestDomains?: string[];
    summary: string;
  } | null;
  consequenceEvidence?: {
    financial?: string;
    reputational?: string;
    institutional?: string;
    timeline?: string;
  } | null;
  challenge: string;
  retainerTriggered: boolean;
};

export default function ReturnBriefPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.sessionId as string;
  const accessToken = searchParams?.get("access") || "";
  const [brief, setBrief] = React.useState<ReturnBriefData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [noBrief, setNoBrief] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) return;
    const query = accessToken ? `?access=${encodeURIComponent(accessToken)}` : "";
    fetch(`/api/strategy-room/briefing/return/${sessionId}${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.briefAvailable) {
          setBrief(data.brief);
        } else {
          setNoBrief(true);
        }
      })
      .catch(() => setNoBrief(true))
      .finally(() => setLoading(false));
  }, [accessToken, sessionId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Loading briefing...</p>
      </div>
    );
  }

  if (noBrief || !brief) {
    return (
      <div style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", color: "#F5F5F5" }}>
        <div style={{ maxWidth: "580px", margin: "0 auto", padding: "120px 24px 80px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "24px" }}>
            Governed monitoring active
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "clamp(24px, 3.5vw, 36px)", lineHeight: 1.2, color: "#F5F5F5", marginBottom: "24px" }}>
            No return brief is warranted yet.
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>
            The system is monitoring this case. A return brief is generated only when the evidence threshold is crossed:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "A committed action remains unverified past its checkpoint",
              "A recurring pattern is detected",
              "Execution trajectory deteriorates",
              "Cost of inaction exceeds the monitored threshold",
              "A counsel or boardroom escalation trigger is met",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.35)", paddingLeft: "16px", position: "relative", marginBottom: "8px" }}>
                <span style={{ position: "absolute", left: 0, color: "rgba(201,169,110,0.40)" }}>&bull;</span>
                {item}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.30)", marginTop: "24px" }}>
            This is governed monitoring, not absence of product. The system will surface a brief when the evidence requires it.
          </p>
          <div style={{ marginTop: "32px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/strategy-room" style={{ color: "#C9A96E", fontSize: "12px", textDecoration: "none", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Return to Strategy Room
            </Link>
            <Link href="/decision-centre" style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", textDecoration: "none", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Decision Centre
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", color: "#F5F5F5" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "96px 24px 96px" }}>

        {/* ═══ 0. CONTINUITY HEADER ═══ */}
        <div style={{ paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "32px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "8px" }}>
            Decision Infrastructure by Abraham of London
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            You are not starting again. The system remembers this case.
          </p>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Session: {brief.sessionKey?.slice(0, 12) || sessionId?.toString().slice(0, 12)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Generated: {brief.generatedAt ? new Date(brief.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: brief.trajectory.state === "DETERIORATING" ? "rgba(252,165,165,0.50)" : brief.trajectory.state === "FRAGILE" ? "rgba(201,169,110,0.50)" : "rgba(110,231,183,0.50)" }}>
              Trajectory: {brief.trajectory.state}
            </span>
          </div>
        </div>

        {/* ═══ 1. OPENING ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "24px" }}>
            Return Brief
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.15, color: "#F5F5F5" }}>
            {brief.opening}
          </h1>
        </div>

        {/* ═══ 2. TRAJECTORY SNAPSHOT ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>
            Current trajectory
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "24px", color: brief.trajectory.state === "DETERIORATING" ? "rgba(252,165,165,0.80)" : brief.trajectory.state === "FRAGILE" ? "#C9A96E" : "rgba(110,231,183,0.70)" }}>
            {brief.trajectory.state}
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.50)", marginTop: "12px" }}>
            {brief.trajectory.reason}
          </p>
        </div>

        {/* ═══ 2b. SIGNAL CONTINUITY ═══ */}
        <div style={{ paddingBottom: "48px" }}>
          <ContinuityStatement
            continuity={
              brief.contradiction
                ? brief.trajectory.state === "DETERIORATING" ? "WORSENING"
                  : brief.trajectory.state === "FRAGILE" ? "REPEATED"
                  : "IMPROVING"
                : brief.trajectory.state === "DETERIORATING" ? "NEW"
                : "UNKNOWN"
            }
            reason={
              brief.contradiction
                ? brief.trajectory.state === "DETERIORATING"
                  ? `The contradiction between "${brief.contradiction.decision}" and "${brief.contradiction.constraint}" has intensified since the last session. The condition is compounding.`
                  : brief.trajectory.state === "FRAGILE"
                    ? `The contradiction between "${brief.contradiction.decision}" and "${brief.contradiction.constraint}" persists at similar severity. The structure has not changed.`
                    : `Early indicators suggest the intervention on "${brief.contradiction.decision}" is producing movement.`
                : brief.trajectory.state === "DETERIORATING"
                  ? "The trajectory has shifted since the last session."
                  : null
            }
            priorOccurrences={brief.contradiction ? 1 : 0}
            trend={
              brief.trajectory.state === "DETERIORATING" ? "escalating"
                : brief.trajectory.state === "STABLE" ? "de-escalating"
                : "stable"
            }
            implication={
              brief.trajectory.state === "DETERIORATING"
                ? "Immediate structural correction required. The cost of inaction is compounding."
                : brief.trajectory.state === "FRAGILE"
                  ? "The pattern persists. Consider whether intervention is reaching the structural root."
                  : undefined
            }
          />
        </div>

        {/* ═══ 2c. ADMISSION STATUS ═══ */}
        <div style={{ paddingBottom: "48px" }}>
          <AdmissionNotice
            status="ADMITTED"
            surface="Return Brief"
            evidenceTier={brief.outcomeEvidence?.confidence === "governed" ? "outcome_verified" : brief.outcomeEvidence?.confidence === "directional" ? "multi_source" : "single_source"}
            caseId={brief.sessionKey}
            continuityStatus={brief.contradiction ? "Active contradiction tracked" : "No active contradiction"}
            compact
          />
        </div>

        {/* ═══ 3. CONTRADICTION RE-EXPOSED ═══ */}
        {brief.evidenceCarryForward && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
              Against your prior standard
            </p>
            <div style={{ background: "#111", padding: "22px 24px", borderLeft: "2px solid rgba(201,169,110,0.42)" }}>
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.62)", marginBottom: "12px" }}>
                You previously said this would count as proof. The system is now checking the case against that standard.
              </p>
              {[brief.evidenceCarryForward.verificationStatus, brief.evidenceCarryForward.failureComparison, brief.evidenceCarryForward.recurrenceStatus, brief.evidenceCarryForward.stopSignalStatus]
                .filter(Boolean)
                .map((statement, index) => (
                  <p key={index} style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: index === 0 ? 0 : "12px" }}>
                    {statement}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* ═══ PA EVIDENCE CARRIED FORWARD ═══ */}
        {(() => {
          const paItems = brief.purposeAlignmentEvidence
            ? convertPurposeAlignmentToGovernedMemory({
                available: true,
                sourceSurface: "PURPOSE_ALIGNMENT",
                assessedAt: (brief.purposeAlignmentEvidence.assessedAt as string) ?? null,
                schemaVersion: null,
                profile: (brief.purposeAlignmentEvidence.profile as string) ?? null,
                compositeScore: null,
                strongestDomain: null,
                weakestDomain: (brief.purposeAlignmentEvidence.weakestDomain as string) ?? null,
                competingObligation: (brief.purposeAlignmentEvidence.previouslyReportedCompetingObligation as string) ?? null,
                consequence: (brief.purposeAlignmentEvidence.previouslyReportedConsequence as string) ?? null,
                institutionalConsequence: null,
                primaryPattern: null,
                patternConsequence: (brief.purposeAlignmentEvidence.currentStateAgainstPriorConsequence as string) ?? null,
                contradictions: [],
                domainScores: [],
                firstAction: null,
                corrections: [],
                assessmentId: null,
              })
            : [];
          if (paItems.length === 0) return null;
          return (
            <div style={{ paddingBottom: "48px" }}>
              <GovernanceEvidenceCarryForward
                title="Purpose Alignment evidence carried forward"
                intro="The following evidence from your earlier Purpose Alignment assessment remains relevant to this case."
                items={paItems}
                variant="session"
              />
            </div>
          );
        })()}

        {/* ═══ TEAM EVIDENCE CARRIED FORWARD ═══ */}
        {brief.teamEvidence && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Team evidence carried forward
            </p>
            <div style={{ background: "#111", padding: "20px 24px", borderLeft: "2px solid rgba(201,169,110,0.30)" }}>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
                {brief.teamEvidence.summary}
              </p>
              {brief.teamEvidence.trustScore !== undefined && brief.teamEvidence.trustScore < 50 && (
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(252,165,165,0.60)", marginTop: "10px" }}>
                  Team trust was reported at {brief.teamEvidence.trustScore}/100. This may affect execution honesty and escalation safety.
                </p>
              )}
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "10px" }}>
                Source: Team Assessment &middot; {brief.teamEvidence.respondentCount ?? 0} respondent{(brief.teamEvidence.respondentCount ?? 0) === 1 ? "" : "s"} &middot; Evidence posture: aggregated
              </p>
            </div>
          </div>
        )}

        {/* ═══ ENTERPRISE STRAIN CARRIED FORWARD ═══ */}
        {brief.enterpriseEvidence && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Enterprise strain carried forward
            </p>
            <div style={{ background: "#111", padding: "20px 24px", borderLeft: "2px solid rgba(201,169,110,0.30)" }}>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
                {brief.enterpriseEvidence.summary}
              </p>
              {brief.enterpriseEvidence.weakestDomains && brief.enterpriseEvidence.weakestDomains.length > 0 && (
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.40)", marginTop: "8px" }}>
                  Weakest domain{brief.enterpriseEvidence.weakestDomains.length > 1 ? "s" : ""}: {brief.enterpriseEvidence.weakestDomains.join(", ")}.
                </p>
              )}
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "10px" }}>
                Source: Enterprise Assessment &middot; Evidence posture: system-inferred
              </p>
            </div>
          </div>
        )}

        {/* ═══ CONSEQUENCE EVIDENCE CARRIED FORWARD ═══ */}
        {brief.consequenceEvidence && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Consequences you previously identified
            </p>
            <div style={{ background: "#111", padding: "20px 24px", borderLeft: "2px solid rgba(201,169,110,0.30)" }}>
              {[brief.consequenceEvidence.financial, brief.consequenceEvidence.reputational, brief.consequenceEvidence.institutional, brief.consequenceEvidence.timeline]
                .filter(Boolean)
                .map((text, i) => (
                  <p key={i} style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: i === 0 ? 0 : "8px" }}>
                    {text}
                  </p>
                ))}
              <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.35)", marginTop: "10px" }}>
                These consequences have not been independently verified. They represent what you reported during Strategy Room intake.
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "8px" }}>
                Source: Strategy Room Stage 2 &middot; Evidence posture: user-reported
              </p>
            </div>
          </div>
        )}

        {brief.contradiction && (
          <div style={{ background: "#111", padding: "24px 28px", borderLeft: "2px solid #444", marginBottom: "64px" }}>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#777" }}>
              You previously committed to:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              &ldquo;{brief.contradiction.decision}&rdquo;
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#777", marginTop: "20px" }}>
              The constraint:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              &ldquo;{brief.contradiction.constraint}&rdquo;
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "20px" }}>
              remains active. {brief.contradiction.status}.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "12px" }}>
              The structure has not changed.
            </p>
          </div>
        )}

        {/* ═══ 4. OUTCOME EVIDENCE ═══ */}
        {brief.outcomeEvidence && (
          <div style={{ paddingBottom: "64px" }}>
            <div style={{ height: "1px", background: "#1A1A1A", marginBottom: "48px" }} />
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
              Observed outcomes in similar cases
            </p>
            {brief.outcomeEvidence.statements.map((statement, i) => (
              <p key={i} style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.50)", marginBottom: "4px", paddingLeft: "16px" }}>
                &bull; {statement}
              </p>
            ))}
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#444", marginTop: "12px" }}>
              Confidence: {brief.outcomeEvidence.confidence} ({brief.outcomeEvidence.processedDecisionCases} cases)
            </p>
          </div>
        )}

        {/* ═══ 5. PERSONAL DELTA ═══ */}
        {brief.delta && (
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
              Change since last session
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              <DeltaLine label="Clarity" value={brief.delta.clarity} />
              <DeltaLine label="Authority" value={brief.delta.authority} />
              <DeltaLine label="Readiness" value={brief.delta.readiness} />
            </div>
          </div>
        )}

        {/* ═══ 5b. COST OF INACTION CLOCK ═══ */}
        {brief.costOfInaction && brief.costOfInaction.basis !== "UNAVAILABLE" && brief.costOfInaction.accumulatedCost > 0 && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Cost of inaction since last session
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "24px", color: "#C9A96E" }}>
              £{brief.costOfInaction.accumulatedCost.toLocaleString()} estimated over {brief.costOfInaction.daysElapsed} day{brief.costOfInaction.daysElapsed === 1 ? "" : "s"}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "8px" }}>
              Basis: {brief.costOfInaction.basis === "MONTHLY" ? "monthly estimate from original case" : "daily estimate from original case"}
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.42)", marginTop: "10px" }}>
              {brief.costOfInaction.explanation}
            </p>
          </div>
        )}

        {/* ═══ 5b-ii. FINANCIAL EXPOSURE EVIDENCE ═══ */}
        {(() => {
          const feItems = convertFinancialExposureToGovernedMemory(
            brief.costOfInaction && brief.costOfInaction.accumulatedCost > 0
              ? {
                  userCostOfDelayText: null,
                  estimatedFinancialExposure: brief.costOfInaction.accumulatedCost,
                  exposureBand: brief.costOfInaction.accumulatedCost >= 50000 ? "high" : brief.costOfInaction.accumulatedCost >= 10000 ? "moderate" : "low",
                  exposureBasis: null,
                  computedAt: brief.generatedAt,
                  sourceSurface: "RETURN_BRIEF",
                  schemaVersion: "1.0.0",
                }
              : null,
          );
          if (feItems.length === 0) return null;
          return (
            <div style={{ paddingBottom: "48px" }}>
              <GovernanceEvidenceCarryForward
                title="Financial exposure evidence"
                intro="The following financial exposure estimates are based on diagnostic inputs and have not been independently verified."
                items={feItems}
                variant="session"
              />
            </div>
          );
        })()}

        {/* ═══ 5c. COMMITMENT VERIFICATION ═══ */}
        {brief.verification && brief.verification.length > 0 && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Commitment verification
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              {brief.verification.map((checkpoint) => (
                <div key={`${checkpoint.commitmentId}-${checkpoint.checkpoint}`} style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                      {checkpoint.label}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: checkpoint.status === "OVERDUE" ? "rgba(252,165,165,0.55)" : checkpoint.status === "DUE" ? "#C9A96E" : checkpoint.status.startsWith("VERIFIED") ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.25)" }}>
                      {checkpoint.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {checkpoint.dueAt && (
                    <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.32)", marginTop: "4px" }}>
                      Due {new Date(checkpoint.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.46)", marginTop: "6px" }}>
                    {checkpoint.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.recurrence && (brief.recurrence.status === "POSSIBLE_RECURRENCE" || brief.recurrence.status === "VERIFIED_RECURRENCE") && (
          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Pattern recurrence
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.58)" }}>
              This condition has appeared before in your case history.
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "8px" }}>
              Prior cases matched: {brief.recurrence.priorCount}
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.42)", marginTop: "10px" }}>
              {brief.recurrence.explanation}
            </p>
          </div>
        )}

        {/* ═══ LIVING INTELLIGENCE PANELS ═══ */}
        <div style={{ display: "grid", gap: "16px", paddingBottom: "48px" }}>
          <IntelligenceGainPanel
            stage="Return Brief"
            findings={[
              { label: "Trajectory", value: `${brief.trajectory.state} — ${brief.trajectory.reason}` },
              ...(brief.contradiction ? [{ label: "Contradiction", value: `${brief.contradiction.decision} vs ${brief.contradiction.constraint} (${brief.contradiction.status})` }] : []),
              ...(brief.outcomeEvidence ? [{ label: "Outcomes processed", value: `${brief.outcomeEvidence.processedDecisionCases} cases, ${brief.outcomeEvidence.improvedPercent}% improved` }] : []),
              ...(brief.outcomeEvidence?.confidence ? [{ label: "Evidence confidence", value: brief.outcomeEvidence.confidence }] : []),
            ]}
          />

          {brief.delta && (
            <WhatChangedPanel
              deltas={[
                ...(brief.delta.clarity != null ? [{ metric: "Clarity", before: null, after: String(brief.delta.clarity), direction: (Number(brief.delta.clarity) > 0 ? "improved" : Number(brief.delta.clarity) < 0 ? "deteriorated" : "stable") as "improved" | "stable" | "deteriorated" }] : []),
                ...(brief.delta.authority != null ? [{ metric: "Authority", before: null, after: String(brief.delta.authority), direction: (Number(brief.delta.authority) > 0 ? "improved" : Number(brief.delta.authority) < 0 ? "deteriorated" : "stable") as "improved" | "stable" | "deteriorated" }] : []),
                ...(brief.delta.readiness != null ? [{ metric: "Readiness", before: null, after: String(brief.delta.readiness), direction: (Number(brief.delta.readiness) > 0 ? "improved" : Number(brief.delta.readiness) < 0 ? "deteriorated" : "stable") as "improved" | "stable" | "deteriorated" }] : []),
              ]}
              newEvidence={brief.outcomeEvidence?.statements}
            />
          )}

          <EvidenceStrengthMeter
            level={brief.outcomeEvidence?.confidence === "governed" ? "outcome_verified" : brief.outcomeEvidence?.confidence === "directional" ? "multi_source" : "single_source"}
            stagesCompleted={7}
            stages={[
              { key: "fast_diagnostic", label: "Fast Diagnostic", status: "completed", contribution: "Identified initial decision structure and urgency signal." },
              { key: "purpose_alignment", label: "Purpose Alignment", status: "completed", contribution: "Detected personal mandate and conviction-obligation tension." },
              { key: "constitutional", label: "Constitutional Diagnostic", status: "completed", contribution: "Confirmed governance route and authority posture." },
              { key: "team", label: "Team Assessment", status: "completed", contribution: "Measured leadership-team perception gap." },
              { key: "enterprise", label: "Enterprise Assessment", status: "completed", contribution: "Mapped institutional pressure and execution variance." },
              { key: "executive_reporting", label: "Executive Reporting", status: "completed", contribution: "Priced consequence and issued governed priority stack." },
              { key: "strategy_room", label: "Strategy Room", status: "completed", contribution: brief.contradiction ? `Governed intervention on: "${brief.contradiction.decision}"` : "Governed intervention sequence initiated." },
              { key: "outcome_verification", label: "Outcome Verification", status: brief.outcomeEvidence?.confidence === "governed" ? "completed" : "pending", contribution: brief.outcomeEvidence ? `${brief.outcomeEvidence.processedDecisionCases} cases processed, ${brief.outcomeEvidence.improvedPercent}% improved.` : undefined },
            ]}
            whatWouldStrengthen={brief.outcomeEvidence?.confidence !== "governed" ? "Complete the outcome verification loop to reach governed-tier evidence." : undefined}
          />

          <GovernedActionPanel
            requiredAction={brief.challenge}
            whyThisAction={brief.trajectory.state === "DETERIORATING" ? "The trajectory is deteriorating. Immediate correction is required." : brief.contradiction ? `Contradiction between ${brief.contradiction.decision} and ${brief.contradiction.constraint} remains unresolved.` : null}
            whatProvesProgress="Return to Strategy Room and log the action taken. The system tracks execution against the decision ledger."
            whatHappensNext={brief.retainerTriggered ? "Pattern is persistent. Retainer governance is recommended." : "Return to Strategy Room and execute the next intervention."}
          />

          <HumanReviewPrompt context="Return Brief" />
        </div>

        {/* ═══ 6. DIRECT CHALLENGE ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <div style={{ height: "1px", background: "#1A1A1A", marginBottom: "48px" }} />
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400, fontSize: "20px", lineHeight: 1.4, color: "rgba(255,255,255,0.80)" }}>
            {brief.challenge}
          </p>
        </div>

        {/* ═══ 7. CHECKPOINT RESPONSE ═══ */}
        <CheckpointResponsePanel checkpointReference={brief.checkpointReference ?? { checkpointId: null, strategyRoomSessionId: brief.sessionKey, lookupMode: "STRATEGY_ROOM_SESSION", available: false }} />

        {/* ═══ CTA ═══ */}
        <Link
          href={`/strategy-room/session/${brief.sessionKey}`}
          style={{ display: "block", width: "100%", padding: "18px 0", textAlign: "center", backgroundColor: "#F5F5F5", color: "#0B0B0B", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontWeight: 500 }}
        >
          Return to Strategy Room
        </Link>

        {/* ═══ RETAINER TRIGGER ═══ */}
        {brief.retainerTriggered && (
          <div style={{ marginTop: "64px", padding: "24px 28px", borderLeft: "2px solid #C9A96E", background: "rgba(201,169,110,0.04)" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)" }}>
              This is no longer a single decision issue.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", marginTop: "8px" }}>
              The pattern is persistent. Without ongoing enforcement, this will continue to recur.
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#C9A96E", marginTop: "20px" }}>
              Ongoing oversight may be required
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

function CheckpointResponsePanel({
  checkpointReference,
}: {
  checkpointReference: {
    checkpointId?: string | null;
    strategyRoomSessionId?: string | null;
    lookupMode: "CHECKPOINT_ID" | "STRATEGY_ROOM_SESSION";
    available: boolean;
  };
}) {
  const [status, setStatus] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

  async function respond(responseStatus: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/checkpoints/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId: checkpointReference.checkpointId ?? undefined,
          strategyRoomSessionId: checkpointReference.strategyRoomSessionId ?? undefined,
          lookupMode: checkpointReference.lookupMode,
          responseStatus,
          ...(responseStatus === "BLOCKED" ? { blockerDescription: note } : {}),
          ...(responseStatus === "ABANDONED" ? { whatChanged: note } : {}),
          ...(responseStatus === "COMPLETED" ? { evidenceNote: note } : {}),
          ...(responseStatus === "DISPUTED_FINDING" ? { whatChanged: note } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error("Checkpoint response could not be recorded.");
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Checkpoint response could not be recorded.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ paddingBottom: "48px" }}>
        <div style={{ border: "1px solid rgba(110,231,183,0.20)", backgroundColor: "rgba(110,231,183,0.03)", padding: "20px 24px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.50)" }}>
            Response recorded
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "8px" }}>
            Your response has been recorded. The system will use it to update case memory and governance signals.
          </p>
        </div>
      </div>
    );
  }

  if (!checkpointReference.available) {
    return (
      <div style={{ paddingBottom: "48px" }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "20px 24px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
            No checkpoint created yet
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "8px" }}>
            This return brief is present, but no durable checkpoint has been created for this session yet. The system will not fabricate one here.
          </p>
        </div>
      </div>
    );
  }

  const options = [
    { value: "COMPLETED", label: "Completed", color: "rgba(110,231,183,0.50)", noteLabel: "What evidence shows this? (optional)" },
    { value: "PARTIALLY_COMPLETED", label: "Partially completed", color: "rgba(201,169,110,0.50)", noteLabel: null },
    { value: "BLOCKED", label: "Blocked", color: "rgba(252,165,165,0.50)", noteLabel: "What is blocking execution? (required)" },
    { value: "ABANDONED", label: "Abandoned", color: "rgba(252,165,165,0.50)", noteLabel: "Why was this abandoned? (required)" },
    { value: "DISPUTED_FINDING", label: "Dispute this finding", color: "rgba(255,255,255,0.30)", noteLabel: "What does the system have wrong? (required)" },
  ];

  return (
    <div style={{ paddingBottom: "48px" }}>
      <div style={{ height: "1px", background: "#1A1A1A", marginBottom: "32px" }} />
      <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
        What happened?
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
        The system needs your confirmation. This is not optional feedback — it is governance evidence that changes how the system treats this case.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(status === opt.value ? null : opt.value)}
            disabled={submitting}
            style={{
              padding: "10px 16px",
              border: status === opt.value ? `1px solid ${opt.color}` : "1px solid rgba(255,255,255,0.08)",
              backgroundColor: status === opt.value ? `${opt.color.replace(/[\d.]+\)$/, "0.08)")}` : "transparent",
              color: status === opt.value ? opt.color : "rgba(255,255,255,0.40)",
              fontSize: "12px",
              cursor: "pointer",
              ...mono,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {status && (() => {
        const selected = options.find((o) => o.value === status);
        const needsNote = status === "BLOCKED" || status === "ABANDONED" || status === "DISPUTED_FINDING";
        return (
          <div style={{ marginTop: "12px" }}>
            {selected?.noteLabel && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={selected.noteLabel}
                rows={3}
                style={{
                  width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F5", fontSize: "13px",
                  lineHeight: 1.6, resize: "vertical", marginBottom: "12px",
                }}
              />
            )}
            <button
              onClick={() => respond(status)}
              disabled={submitting || (needsNote && note.trim().length < 5)}
              style={{
                padding: "12px 24px", backgroundColor: "#F5F5F5", color: "#0B0B0B",
                border: "none", cursor: submitting || (needsNote && note.trim().length < 5) ? "not-allowed" : "pointer",
                opacity: submitting || (needsNote && note.trim().length < 5) ? 0.3 : 1,
                ...mono, fontSize: "10px", letterSpacing: "0.10em", textTransform: "uppercase" as const,
              }}
            >
              {submitting ? "Recording..." : "Record response"}
            </button>
            {submitError && (
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)", marginTop: "10px" }}>
                {submitError}
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function DeltaLine({ label, value }: { label: string; value: string }) {
  const isPositive = value.startsWith("+") || value === "increased";
  const isNegative = value === "decreased" || value === "contested";
  const color = isPositive ? "rgba(110,231,183,0.60)" : isNegative ? "rgba(252,165,165,0.60)" : "rgba(255,255,255,0.40)";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.04em", color }}>{value}</span>
    </div>
  );
}
