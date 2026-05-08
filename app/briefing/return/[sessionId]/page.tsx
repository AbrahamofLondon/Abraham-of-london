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

type ReturnBriefData = {
  sessionId: string;
  sessionKey: string;
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
      <div style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px" }}>No return brief is warranted at this time.</p>
          <Link href="/strategy-room" style={{ color: "#C9A96E", fontSize: "13px", marginTop: "16px", display: "inline-block", textDecoration: "none" }}>
            Return to Strategy Room
          </Link>
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
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.42)", marginTop: "10px" }}>
              {brief.costOfInaction.explanation}
            </p>
          </div>
        )}

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
              Decision Integrity Programme
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontSize: "28px", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: "8px" }}>
              &pound;25,000+
            </p>
            <Link
              href="/consulting?retainer=qualified"
              style={{ display: "inline-block", marginTop: "16px", padding: "12px 24px", border: "1px solid rgba(201,169,110,0.40)", backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}
            >
              Request programme access
            </Link>
          </div>
        )}

      </div>
    </main>
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
