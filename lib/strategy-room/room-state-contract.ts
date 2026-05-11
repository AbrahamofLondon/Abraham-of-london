/**
 * lib/strategy-room/room-state-contract.ts — Canonical Strategy Room state contract.
 *
 * Defines the server-authoritative state of an active Strategy Room session.
 * Used by the execution command surface to render governed case state.
 *
 * Adapts to existing types: StrategyRoomAdmissionResult, LivingCase,
 * EvidenceTier, StageEntry, DecisionExecutionRecord.
 */

import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";
import type { SovereignSignalPublicSummary, SignalEvidencePosture } from "@/lib/sovereign/sovereign-signal-public-dto";

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL PRESSURE — governs intervention posture
// ─────────────────────────────────────────────────────────────────────────────

export type SignalPostureEffect =
  | "REQUIRE_AUTHORITY_CLARIFICATION"
  | "REQUIRE_DECISION_OWNER"
  | "REQUIRE_CHECKPOINT_CONFIRMATION"
  | "RESTRICT_UNTIL_CAPACITY_NAMED"
  | "REQUIRE_EVIDENCE_CLARIFICATION"
  | "FLAG_SPONSOR_ATTENTION"
  | "RECOMMEND_RETAINED_MEMORY"
  | "TRIGGER_RETURN_BRIEF"
  | "FLAG_COUNSEL_SENSITIVITY";

export type SignalPressureItem = {
  signalId: string;
  signalName: string;
  severityBand: SovereignSignalPublicSummary["severityBand"];
  evidencePosture: SignalEvidencePosture;
  /** Why this signal matters for this specific intervention */
  interventionRelevance: string;
  /** What the system now requires before the execution path is confirmed */
  postureConsequence: string;
  /** The governed posture effect — what rule this triggers */
  postureEffect: SignalPostureEffect;
};

export type SignalPressure = {
  /** Whether any signal is blocking or restricting the execution path */
  postureLocked: boolean;
  /** The strongest effect active across all signals */
  dominantEffect: SignalPostureEffect | null;
  /** All active signal pressure items */
  items: SignalPressureItem[];
  /** Summary sentence for display */
  summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOM STATE
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyRoomState = {
  /** Execution session ID */
  sessionId: string;
  /** Living Case ID (journeyKey) */
  caseId: string;
  /** Canonical decision ID */
  decisionId: string | null;

  /** Admission status — ADMITTED users see execution command */
  admissionStatus: "ADMITTED" | "RESTRICTED" | "BLOCKED";
  admissionReasons?: string[];

  /** The decision under governance — user's own words */
  decisionStatement: string;

  /** Evidence state */
  evidenceTier: EvidenceTier;
  completedStages?: StageEntry[];

  /** Authority / mandate */
  authorityStatus?: string | null;
  authorityType?: string | null;

  /** Continuity from signal-continuity derivation */
  continuityStatus?: string | null;
  continuitySummary?: string | null;

  /** Dynamic consequence */
  consequence?: {
    score?: number | null;
    trend?: "STABLE" | "ESCALATING" | "CRITICAL" | null;
    summary?: string | null;
    currentExposure?: number | null;
    previousExposure?: number | null;
  } | null;

  /** Avoidance pattern detection */
  avoidance?: {
    pattern?: string | null;
    severity?: string | null;
    count?: number;
    basis?: string | null;
  } | null;

  /** Escalation triggers */
  escalation?: {
    triggers: Array<{
      triggerType: string;
      message: string;
      createdAt?: string | null;
    }>;
    currentLevel?: string | null;
  } | null;

  /** Execution state — locked decisions, required actions, completion */
  execution: {
    state: "PENDING" | "ACTIVE" | "STALLED" | "COMPLETED" | "FAILED";
    requiredActions: Array<{
      id: string;
      label: string;
      owner?: string | null;
      dueAt?: string | null;
      status: "pending" | "in_progress" | "completed" | "blocked";
    }>;
    lockedDecision?: string | null;
    lockedOwner?: string | null;
    firstAction?: string | null;
  };

  /** Return Brief availability */
  returnBrief?: {
    available: boolean;
    href?: string | null;
    trajectory?: string | null;
  } | null;

  /** Retainer eligibility */
  retainer?: {
    eligible: boolean;
    reason?: string | null;
    tier?: string | null;
  } | null;

  /** Feedback / verification */
  feedback?: {
    verificationPending: boolean;
    nextVerificationAt?: string | null;
    lastFeedbackAt?: string | null;
  } | null;

  /** Counsel escalation status */
  counsel?: {
    status: "NOT_REQUIRED" | "RECOMMENDED" | "REQUIRED" | "PAUSED_PENDING_REVIEW" | "ESCALATED_TO_RETAINER";
    reasons: string[];
    explanation?: string | null;
    systemAction?: string | null;
    repairActions?: string[];
  } | null;

  /**
   * Sovereign signal pressure affecting this intervention.
   * Null when no signals are active or evidence is insufficient.
   * When present, at least one item governs the execution path.
   */
  signalPressure?: SignalPressure | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOM STATE DERIVATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine execution state from decision log entries.
 */
export function deriveExecutionState(
  decisions: Array<{ status?: string }>,
): StrategyRoomState["execution"]["state"] {
  if (decisions.length === 0) return "PENDING";
  const hasCompleted = decisions.some((d) => d.status === "completed" || d.status === "executed");
  const hasBlocked = decisions.some((d) => d.status === "blocked");
  const hasActive = decisions.some((d) => d.status === "active" || d.status === "in_progress");

  if (hasCompleted && !hasBlocked) return "COMPLETED";
  if (hasBlocked) return "STALLED";
  if (hasActive) return "ACTIVE";
  return "PENDING";
}

/**
 * Check if a room state has sufficient data to render execution command.
 * Execution command should only render for ADMITTED sessions with a decision.
 */
export function canRenderExecutionCommand(state: StrategyRoomState): boolean {
  return (
    state.admissionStatus === "ADMITTED" &&
    state.decisionStatement.length > 0 &&
    state.evidenceTier !== "insufficient"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL PRESSURE DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

const SIGNAL_POSTURE_MAP: Record<string, {
  effect: SignalPostureEffect;
  interventionRelevance: string;
  postureConsequence: string;
}> = {
  "authority-collapse-under-pressure": {
    effect: "REQUIRE_AUTHORITY_CLARIFICATION",
    interventionRelevance: "Authority structure has been observed to collapse under pressure. Confirming an execution path before authority is resolved creates a governance gap.",
    postureConsequence: "Authority clarification is required before the execution path can be confirmed. Named authority owner and escalation path must be established.",
  },
  "authority-diffusion-revenue-pressure": {
    effect: "REQUIRE_DECISION_OWNER",
    interventionRelevance: "Commercial pressure is diffusing authority clarity. Multiple stakeholders may be operating under different mandates.",
    postureConsequence: "A named decision owner and escalation owner must be identified before execution proceeds.",
  },
  "execution-fragility-cascade": {
    effect: "REQUIRE_CHECKPOINT_CONFIRMATION",
    interventionRelevance: "Multiple execution failure modes are active simultaneously. Symptomatic fixes without checkpoint confirmation accelerate overall fragility.",
    postureConsequence: "Checkpoint and dependency confirmation is required. Do not sequence symptomatic fixes — address root causes across active failure modes.",
  },
  "intervention-blocked": {
    effect: "RESTRICT_UNTIL_CAPACITY_NAMED",
    interventionRelevance: "The organisation may lack the structural capacity to receive intervention. Proceeding without naming the capacity blocker will produce the same outcome.",
    postureConsequence: "The intervention plan is restricted until the capacity blocker is named and a restoration sequence is agreed.",
  },
  "narrative-coherence-collapse": {
    effect: "REQUIRE_EVIDENCE_CLARIFICATION",
    interventionRelevance: "The stated operating narrative diverges from observable evidence. Board or counsel escalation built on this narrative may be contested.",
    postureConsequence: "Evidence clarification is required before board or counsel escalation. The operating truth must be established before intervention framing proceeds.",
  },
  "second-line-drift-scaling": {
    effect: "FLAG_SPONSOR_ATTENTION",
    interventionRelevance: "Second-line authority is drifting as the organisation scales. The intervention may require second-line redesign, not just first-line execution.",
    postureConsequence: "Sponsor and operator attention flagged. Second-line mandate design should be included in the intervention scope.",
  },
  "intelligence-debt-scaling": {
    effect: "RECOMMEND_RETAINED_MEMORY",
    interventionRelevance: "The organisation is scaling without corresponding intelligence infrastructure. Decisions made now will lack the institutional memory needed to course-correct.",
    postureConsequence: "Retained memory or oversight recommendation required as part of the intervention plan.",
  },
  "multi-session-plateau": {
    effect: "TRIGGER_RETURN_BRIEF",
    interventionRelevance: "Multiple sessions have not produced structural progress. The barrier may be capacity, mandate, or sequencing — each requires a different intervention.",
    postureConsequence: "Return brief and checkpoint challenge triggered. The intervention must identify the barrier type before proceeding.",
  },
  "founder-identity-operational-lock": {
    effect: "FLAG_COUNSEL_SENSITIVITY",
    interventionRelevance: "Founder identity is operationally embedded. Delegation and execution recommendations in this context carry governance sensitivity.",
    postureConsequence: "Boardroom and counsel sensitivity flagged. Written mandate design separating the founder's decision role from operational presence is recommended.",
  },
  "stable-drift-false-floor": {
    effect: "FLAG_SPONSOR_ATTENTION",
    interventionRelevance: "Stability may be masking compounding structural fragility. Intervention assumptions should be stress-tested before confirmation.",
    postureConsequence: "Sponsor attention flagged. A structural stability assessment — separate from the performance review — is recommended before the intervention is confirmed.",
  },
};

const POSTURE_LOCK_EFFECTS: SignalPostureEffect[] = [
  "REQUIRE_AUTHORITY_CLARIFICATION",
  "REQUIRE_DECISION_OWNER",
  "REQUIRE_CHECKPOINT_CONFIRMATION",
  "RESTRICT_UNTIL_CAPACITY_NAMED",
  "REQUIRE_EVIDENCE_CLARIFICATION",
];

const EFFECT_PRIORITY: SignalPostureEffect[] = [
  "RESTRICT_UNTIL_CAPACITY_NAMED",
  "REQUIRE_AUTHORITY_CLARIFICATION",
  "REQUIRE_EVIDENCE_CLARIFICATION",
  "REQUIRE_CHECKPOINT_CONFIRMATION",
  "REQUIRE_DECISION_OWNER",
  "FLAG_COUNSEL_SENSITIVITY",
  "TRIGGER_RETURN_BRIEF",
  "FLAG_SPONSOR_ATTENTION",
  "RECOMMEND_RETAINED_MEMORY",
];

/**
 * Derives signal pressure for the Strategy Room from public-safe signal summaries.
 * Thin-evidence signals (INSUFFICIENT confidence) are excluded from posture effects.
 * Returns null when no actionable signals are present.
 */
export function deriveSignalPressure(
  signals: SovereignSignalPublicSummary[],
): SignalPressure | null {
  const actionable = signals.filter(
    (s) => s.confidenceBand !== "INSUFFICIENT" && SIGNAL_POSTURE_MAP[s.signalId],
  );
  if (actionable.length === 0) return null;

  const items: SignalPressureItem[] = actionable.map((signal) => {
    const map = SIGNAL_POSTURE_MAP[signal.signalId]!;
    return {
      signalId: signal.signalId,
      signalName: signal.signalName,
      severityBand: signal.severityBand,
      evidencePosture: signal.evidencePosture,
      interventionRelevance: map.interventionRelevance,
      postureConsequence: map.postureConsequence,
      postureEffect: map.effect,
    };
  });

  const dominantEffect = EFFECT_PRIORITY.find((e) =>
    items.some((item) => item.postureEffect === e),
  ) ?? null;

  const postureLocked = items.some((item) => POSTURE_LOCK_EFFECTS.includes(item.postureEffect));

  const criticalCount = items.filter((i) => i.severityBand === "CRITICAL").length;
  const alertCount = items.filter((i) => i.severityBand === "ALERT").length;

  const summary = criticalCount > 0
    ? `${criticalCount} critical signal${criticalCount > 1 ? "s are" : " is"} affecting this intervention. The execution path cannot be confirmed until the posture requirement${criticalCount > 1 ? "s are" : " is"} met.`
    : alertCount > 0
      ? `${alertCount} alert-level signal${alertCount > 1 ? "s are" : " is"} influencing the intervention posture. Review the signal pressure before confirming the execution path.`
      : `Signal pressure is present. Review the intervention implications before proceeding.`;

  return { postureLocked, dominantEffect, items, summary };
}

export type { StrategyRoomState as RoomState };
