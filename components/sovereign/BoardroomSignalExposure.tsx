"use client";

/**
 * BoardroomSignalExposure
 *
 * Renders the "Institutional Signal Exposure" section of the boardroom dossier.
 *
 * Each signal is presented in board-readable language:
 * - What the board should understand
 * - Evidence posture
 * - Anticipated objection
 * - What evidence would strengthen the signal
 * - What evidence would weaken the signal
 * - Recommended board posture
 *
 * Classification: PUBLIC_SAFE_DTO consumer. No raw engine data.
 * Max 3 signals surfaced per brief specification.
 */

import * as React from "react";
import type { SovereignSignalPublicSummary, SovereignSignalAssessment } from "@/lib/sovereign/sovereign-signal-public-dto";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "rgba(252,165,165,0.75)",
  ALERT: "#C9A96E",
  CONCERN: "rgba(255,255,255,0.45)",
  WATCH: "rgba(110,231,183,0.55)",
};

const SEVERITY_BORDER: Record<string, string> = {
  CRITICAL: "rgba(252,165,165,0.20)",
  ALERT: "rgba(201,169,110,0.18)",
  CONCERN: "rgba(255,255,255,0.08)",
  WATCH: "rgba(110,231,183,0.12)",
};

// Board relevance context per signal — board-readable, not technical
const BOARD_RELEVANCE: Record<string, {
  boardRelevance: string;
  anticipatedObjection: string;
  evidenceStrengthens: string;
  evidenceWeakens: string;
  boardPosture: string;
}> = {
  "authority-collapse-under-pressure": {
    boardRelevance: "The record suggests that decision authority may not hold under commercial or governance pressure. Where authority is unclear, board decisions may not translate reliably into organisational action.",
    anticipatedObjection: "\"We have clear reporting lines and a decision framework.\" The signal addresses whether stated authority holds under actual pressure — not whether authority is formally documented.",
    evidenceStrengthens: "Evidence of prior decisions being reversed, contested, or abandoned under pressure. Multiple stakeholders claiming authority over the same decision.",
    evidenceWeakens: "Evidence of consistent execution against board decisions without escalation or reversal. Named decision owner with track record.",
    boardPosture: "Ask how the organisation handled the last time a board decision met operational resistance. The answer will clarify whether formal authority translates to effective authority.",
  },
  "authority-diffusion-revenue-pressure": {
    boardRelevance: "The record suggests that commercial pressure may be outrunning decision authority clarity. Where multiple stakeholders hold competing mandates, board-sanctioned decisions face execution risk.",
    anticipatedObjection: "\"This may simply be normal growth pressure.\" The signal does not claim pathology — it flags that authority clarity has not kept pace with commercial pace.",
    evidenceStrengthens: "Evidence that commercial decisions are being made outside board-sanctioned authority. Revenue targets driving decisions without governance sign-off.",
    evidenceWeakens: "Named authority owner with mandate boundary clearly understood by all relevant stakeholders. Evidence that commercial decisions remain within the approved framework.",
    boardPosture: "Request confirmation of the named decision owner for the current phase and the escalation path if that owner is contested. Do not assume this is resolved without evidence.",
  },
  "execution-fragility-cascade": {
    boardRelevance: "Multiple execution failure modes are active simultaneously. Where execution is fragile across multiple systems, board decisions requiring coordinated delivery face elevated risk.",
    anticipatedObjection: "\"Every organisation has execution challenges.\" This signal is triggered by the pattern of multiple simultaneous failure modes, not isolated execution difficulty.",
    evidenceStrengthens: "Evidence of multiple unresolved execution commitments across different domains. Checkpoint records showing repeated blockage.",
    evidenceWeakens: "Evidence of systematic resolution across failure modes. Clear separation between isolated delays and structural fragility.",
    boardPosture: "Ask for a structured account of which failure modes are being addressed and in what sequence. Be cautious of symptomatic explanations that do not address root cause.",
  },
  "narrative-coherence-collapse": {
    boardRelevance: "The stated operating narrative may not reflect observable evidence. Strategy and execution built on incompatible assumptions create board exposure when challenged externally.",
    anticipatedObjection: "\"This may reflect complexity rather than incoherence.\" The signal addresses the gap between stated position and observable evidence — not complexity as such.",
    evidenceStrengthens: "Evidence of contradictions between stated strategy and observable decisions. Board communications that do not account for known operational constraints.",
    evidenceWeakens: "Consistent narrative across board, management, and operational evidence. No material contradictions in the past 90 days.",
    boardPosture: "Request an operating-truth summary that accounts for known contradictions. Do not proceed with board decisions built on a narrative that has not been stress-tested against operational evidence.",
  },
  "stable-drift-false-floor": {
    boardRelevance: "Surface stability may be masking compounding structural fragility. Organisations in this pattern tend to appear resilient until disruption arrives — at which point fragility compounds rapidly.",
    anticipatedObjection: "\"We are performing well.\" This signal addresses structural trajectory, not current performance. Performance and structural resilience are different dimensions.",
    evidenceStrengthens: "Stable or positive surface metrics with deteriorating structural indicators (authority clarity, intervention readiness, narrative coherence) beneath.",
    evidenceWeakens: "Evidence of structural investment alongside performance. Documented stress-testing of execution assumptions.",
    boardPosture: "Commission a structural review that is explicitly separate from the performance review. The two require different inputs and should not be conflated.",
  },
  "second-line-drift-scaling": {
    boardRelevance: "The second line of authority is not scaling with the organisation. Board-level decisions may be executed against an authority structure that has not been redesigned for the current scale.",
    anticipatedObjection: "\"This is a management restructuring matter, not a board matter.\" The signal addresses governance, not management — the board's decisions pass through the second line.",
    evidenceStrengthens: "Evidence that first-line authority is absorbing second-line gaps. Delegation decisions made without formal mandate redesign.",
    evidenceWeakens: "Evidence of formal second-line redesign with clear mandate boundaries. Board confirmation that the governance structure has been reviewed for current scale.",
    boardPosture: "Ask for a governance structure review that addresses second-line authority before the next scaling event. This is a governance task, not a management task.",
  },
  "intelligence-debt-scaling": {
    boardRelevance: "Decision velocity is increasing while institutional evidence quality is not keeping pace. Decisions made at scale without adequate intelligence infrastructure compound risk.",
    anticipatedObjection: "\"We make decisions with the information available.\" This signal addresses the structural investment in intelligence infrastructure, not individual decision quality.",
    evidenceStrengthens: "Evidence that decisions at scale are made without retained institutional memory. Repeated engagement without compounding intelligence.",
    evidenceWeakens: "Evidence of structured intelligence investment commensurate with scale. Decision records showing institutional memory applied across cycles.",
    boardPosture: "Request a review of intelligence infrastructure against current decision velocity. Identify the three most consequential intelligence gaps.",
  },
  "intervention-blocked": {
    boardRelevance: "The organisation may recognise the intervention required but lacks the capacity to receive it. Board-sanctioned interventions failing at the capacity level create governance and commercial exposure.",
    anticipatedObjection: "\"We are working on this.\" The signal distinguishes between awareness of the need and structural capacity to receive the intervention.",
    evidenceStrengthens: "Evidence of agreed interventions failing to execute. Repeated commitment without delivery.",
    evidenceWeakens: "Evidence of completed interventions against similar conditions. Named capacity restoration path with timeline.",
    boardPosture: "Ask what would need to be true structurally for the agreed intervention to be received. Do not authorise execution of an intervention where the capacity blocker has not been named.",
  },
  "founder-identity-operational-lock": {
    boardRelevance: "The founder's operational presence may be embedded in a way that creates governance sensitivity. Succession, delegation, and authority redesign decisions carry elevated complexity in this configuration.",
    anticipatedObjection: "\"The founder is central to the business — that is appropriate at this stage.\" The signal addresses structural embeddedness, not leadership quality.",
    evidenceStrengthens: "Evidence that delegation fails because the founder is structurally irreplaceable in execution, not just leadership. Decision execution that requires founder operational involvement.",
    evidenceWeakens: "Evidence of successful delegation with clear mandate design. Operational decisions executed without founder involvement.",
    boardPosture: "Approach this with care. Treat it as a governance design question, not a performance question. Request a written mandate that separates the founder's decision role from operational presence.",
  },
  "sovereign-trajectory-signal": {
    boardRelevance: "The organisation's structural alignment indicators are positive. The primary risk at this stage is overextension during the growth phase.",
    anticipatedObjection: "\"Good news — no problem here.\" The signal identifies a structural configuration associated with elevated overextension risk specifically during growth.",
    evidenceStrengthens: "Rapid growth decisions without corresponding structural review. Authority and execution structures not stress-tested for scale.",
    evidenceWeakens: "Evidence of structural review commensurate with growth pace. Authority and execution redesign ahead of each growth phase.",
    boardPosture: "Maintain diagnostic rigour through the growth phase. Ensure structural review cadence is maintained — not abandoned because current performance is positive.",
  },
  "multi-session-plateau": {
    boardRelevance: "Repeated engagement has not produced structural progress. The barrier may be capacity, mandate, or sequencing — each indicates a different governance intervention.",
    anticipatedObjection: "\"Institutional change takes time.\" The signal distinguishes between managed change pace and structural plateau — where the same barriers reappear across sessions.",
    evidenceStrengthens: "Evidence of same structural barriers appearing across multiple engagement sessions. Commitments made and not delivered across cycles.",
    evidenceWeakens: "Evidence of structural progress between sessions. Named and resolved barriers from prior cycles.",
    boardPosture: "Ask for an explicit identification of the plateau barrier type. Capacity, mandate, and sequencing each require different board responses.",
  },
};

function SignalExposureCard({ signal }: { signal: SovereignSignalPublicSummary }) {
  const color = SEVERITY_COLOR[signal.severityBand] ?? "rgba(255,255,255,0.45)";
  const border = SEVERITY_BORDER[signal.severityBand] ?? "rgba(255,255,255,0.08)";
  const board = BOARD_RELEVANCE[signal.signalId];

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderLeft: `2px solid ${color}`,
        padding: "20px 22px",
        background: "rgba(255,255,255,0.01)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color, display: "block", marginBottom: "6px" }}>
          Observed institutional signal · {signal.severityBand.toLowerCase()}
        </span>
        <p style={{ ...SERIF, fontSize: "18px", fontWeight: 500, lineHeight: 1.25, color: "#F5F5F5", margin: 0 }}>
          {signal.signalName}
        </p>
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginTop: "4px" }}>
          Evidence: {signal.evidencePosture.replace(/_/g, " ").toLowerCase()} · {signal.confidenceBand.toLowerCase()} · {signal.prevalenceLabel}
        </p>
      </div>

      {/* Board relevance */}
      {board && (
        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "5px" }}>
              Board relevance
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.58)" }}>
              {board.boardRelevance}
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.025)", padding: "12px 14px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "5px" }}>
              Objection anticipated
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
              {board.anticipatedObjection}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(110,231,183,0.40)", marginBottom: "5px" }}>
                Evidence that strengthens
              </p>
              <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>
                {board.evidenceStrengthens}
              </p>
            </div>
            <div>
              <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)", marginBottom: "5px" }}>
                Evidence that weakens
              </p>
              <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>
                {board.evidenceWeakens}
              </p>
            </div>
          </div>

          <div style={{ background: "rgba(201,169,110,0.03)", border: "1px solid rgba(201,169,110,0.12)", padding: "12px 14px" }}>
            <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "5px" }}>
              Recommended board posture
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
              {board.boardPosture}
            </p>
          </div>
        </div>
      )}

      {/* Fallback when no board map */}
      {!board && (
        <div style={{ display: "grid", gap: "10px" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
            {signal.narrativeSummary}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>
            {signal.outcomeDistributionSummary}
          </p>
        </div>
      )}

      {/* Sample caveat */}
      <p style={{ ...MONO, fontSize: "8px", lineHeight: 1.55, color: "rgba(255,255,255,0.15)", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {signal.sampleCaveat}
      </p>
    </div>
  );
}

type Props = {
  assessment: SovereignSignalAssessment;
};

export default function BoardroomSignalExposure({ assessment }: Props) {
  if (assessment.status !== "ASSESSED" || assessment.signals.length === 0) {
    return (
      <div style={{ padding: "20px 22px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "10px" }}>
          Institutional Signal Exposure
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.35)" }}>
          No institutional signals are currently active in the diagnostic record. The evidence does not match any named risk pattern at this time. This is a meaningful finding.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>
            Institutional Signal Exposure
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", maxWidth: "520px" }}>
            {assessment.executiveSummary}
          </p>
        </div>
        {assessment.withheldCount > 0 && (
          <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
            {assessment.withheldCount} pattern{assessment.withheldCount > 1 ? "s" : ""} withheld
          </span>
        )}
      </div>

      {/* Signal cards */}
      <div style={{ display: "grid", gap: "14px" }}>
        {assessment.signals.map((signal) => (
          <SignalExposureCard key={signal.signalId} signal={signal} />
        ))}
      </div>

      {/* Withheld notice */}
      {assessment.withheldCount > 0 && (
        <p style={{ ...MONO, fontSize: "8px", lineHeight: 1.55, color: "rgba(255,255,255,0.18)", marginTop: "14px" }}>
          {assessment.withheldCount} additional pattern{assessment.withheldCount > 1 ? "s were" : " was"} detected but withheld due to evidence posture, role limits, or surface discipline. Withheld patterns are available in the retained oversight record.
        </p>
      )}
    </div>
  );
}
