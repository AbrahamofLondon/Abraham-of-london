import "server-only";

/**
 * Return Brief Generator — creates "return moments" that make inaction visible.
 *
 * Generates a private briefing from execution session state.
 * Fired by trigger logic: FRAGILE/DETERIORATING trajectory, no activity after
 * commitment, recurrence detection, contradiction persistence.
 *
 * This is not a reminder. It is repeated confrontation with unresolved reality.
 */

import { prisma } from "@/lib/prisma.server";
import { buildObservedOutcomeEvidenceFromDB, type OutcomeEvidenceSummary } from "@/lib/outcomes/evidence";
import { findLatestStrategyExecutionRecord } from "@/lib/strategy-room/execution-record";
import { evaluateDecision } from "@/lib/decision/kernel";
import { calculateCostOfInactionClock, type CostOfInactionClockResult } from "@/lib/product/cost-of-inaction-clock";
import { buildCommitmentVerificationStates, type CommitmentVerificationState } from "@/lib/product/commitment-verification";
import { detectPatternRecurrenceV0, type PatternRecurrenceResult } from "@/lib/product/pattern-recurrence";
import {
  extractAssessmentEvidenceCapture,
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import {
  loadPurposeAlignmentEvidence,
  buildReturnBriefPaSection,
} from "@/lib/alignment/evidence-loader";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReturnBriefTrigger =
  | "fragile_trajectory"
  | "deteriorating_trajectory"
  | "no_activity_after_commitment"
  | "recurrence_detected"
  | "contradiction_persistence";

export type ReturnBrief = {
  sessionId: string;
  sessionKey: string;
  generatedAt: string;
  trigger: ReturnBriefTrigger;

  /** Section 1 — Opening (zero softness) */
  opening: string;

  /** Section 2 — Trajectory snapshot */
  trajectory: {
    state: "ASCENDING" | "STAGNANT" | "FRAGILE" | "DETERIORATING";
    reason: string;
  };
  kernel: {
    blocked: boolean;
    reason: string | null;
    activeContradictions: number;
  } | null;

  /** Section 3 — Contradiction re-exposed */
  contradiction: {
    decision: string;
    constraint: string;
    status: string;
  } | null;

  /** Section 4 — Outcome evidence */
  outcomeEvidence: OutcomeEvidenceSummary | null;

  /** Section 5 — Personal delta */
  delta: {
    clarity: string;
    authority: string;
    readiness: string;
  } | null;

  /** Oversight signals */
  costOfInaction?: CostOfInactionClockResult | null;
  verification?: CommitmentVerificationState[] | null;
  recurrence?: PatternRecurrenceResult | null;
  evidenceCarryForward?: {
    source: AssessmentEvidenceCapture;
    verificationStatus?: string;
    failureComparison?: string;
    recurrenceStatus?: string;
    stopSignalStatus?: string;
  } | null;

  /** Purpose Alignment evidence carried forward */
  purposeAlignmentEvidence?: Record<string, unknown> | null;

  /** Section 6 — Direct challenge */
  challenge: string;

  /** Whether this triggers retainer qualification */
  retainerTriggered: boolean;
};

// ─── Trigger evaluation ──────────────────────────────────────────────────────

type ExecutionState = {
  trajectory: string;
  executionRate: number;
  blockRate: number;
  lastUpdated: string;
};

function parseExecutionState(canonical: string | null): ExecutionState | null {
  if (!canonical) return null;
  try {
    const parsed = JSON.parse(canonical);
    return parsed?.executionState ?? null;
  } catch {
    return null;
  }
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function parseCostBasis(text: string | null | undefined): {
  monthlyCostEstimate?: number;
  dailyCostEstimate?: number;
} | null {
  if (!text) return null;
  const amountMatch = text.match(/£\s?([\d,]+(?:\.\d+)?)/i) || text.match(/\b([\d,]+(?:\.\d+)?)\b/);
  if (!amountMatch?.[1]) return null;
  const value = Number(amountMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;

  const normalized = text.toLowerCase();
  if (normalized.includes("day")) {
    return { dailyCostEstimate: value };
  }
  if (normalized.includes("month")) {
    return { monthlyCostEstimate: value };
  }
  return null;
}

function safeEvidenceText(value: string | undefined, max = 180): string | null {
  if (!value) return null;
  if (isUnsafeAssessmentEvidenceText(value)) return "Evidence captured but withheld from display.";
  return summarizeAssessmentEvidenceText(value, max);
}

export function evaluateTrigger(
  executionState: ExecutionState | null,
  decisions: Array<{ status: string; createdAt: Date | string; updatedAt: Date | string }>,
  contradictionCount: number,
): ReturnBriefTrigger | null {
  // Trigger 4 — Contradiction persistence (retainer territory)
  if (contradictionCount >= 3) return "contradiction_persistence";

  if (!executionState) return null;

  // Trigger 1 — FRAGILE or DETERIORATING trajectory
  if (executionState.trajectory === "DETERIORATING") return "deteriorating_trajectory";
  if (executionState.trajectory === "FRAGILE") return "fragile_trajectory";

  // Trigger 2 — No activity after commitment (3+ days)
  if (decisions.length > 0) {
    const latestUpdate = decisions.reduce((latest, d) => {
      const updated = new Date(d.updatedAt).getTime();
      return updated > latest ? updated : latest;
    }, 0);
    const daysSinceActivity = Math.floor((Date.now() - latestUpdate) / (1000 * 60 * 60 * 24));
    const hasPending = decisions.some((d) => d.status === "pending");
    if (hasPending && daysSinceActivity >= 3) return "no_activity_after_commitment";
  }

  return null;
}

// ─── Brief generation ────────────────────────────────────────────────────────

export async function generateReturnBrief(
  executionSessionRef: string,
): Promise<ReturnBrief | null> {
  const session = await prisma.strategyRoomExecutionSession.findFirst({
    where: {
      OR: [
        { id: executionSessionRef },
        { sessionKey: executionSessionRef },
      ],
    },
    include: { decisions: true },
  });

  if (!session) return null;

  const executionState = parseExecutionState(session.canonicalSnapshot);
  const trigger = evaluateTrigger(
    executionState,
    session.decisions.map((d) => ({
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    // Count blocked decisions as contradiction proxy
    session.decisions.filter((d) => d.status === "blocked").length,
  );

  if (!trigger) return null;

  const trajectory = executionState?.trajectory ?? "FRAGILE";
  const executionRecord = await findLatestStrategyExecutionRecord({
    sessionId: session.id,
    email: session.email,
  });
  const decisionText = executionRecord?.decision ?? session.decisionQuestion ?? "the stated decision";
  const constraintText = executionRecord?.conflictResolved ?? session.coreProblem ?? "the primary constraint";
  const pendingCount = session.decisions.filter((d) => d.status === "pending").length;
  const blockedCount = session.decisions.filter((d) => d.status === "blocked").length;
  const executedCount = session.decisions.filter((d) => d.status === "executed").length;
  const kernel = evaluateDecision({
    id: session.id,
    source: "strategy_room",
    condition: session.conditionSummary || constraintText,
    decisionRequired: decisionText,
    evidenceChain: [
      {
        inputSource: "strategy_room",
        observedPattern: constraintText,
        weight: Math.max(0.45, Math.min(1, 0.5 + blockedCount * 0.1)),
        explanation: "Return Brief evaluates the unresolved execution condition against the accumulated strategy state.",
      },
    ],
    internalContradictions: blockedCount > 0
      ? [`${blockedCount} execution decision(s) remain blocked.`]
      : pendingCount > 0
        ? [`${pendingCount} execution decision(s) remain pending.`]
        : [],
    scores: {
      blockedCount,
      pendingCount,
      executedCount,
    },
    signalStrength: blockedCount > 0 ? "STRONG" : pendingCount > 0 ? "MODERATE" : "WEAK",
    sources: [
      { type: "system_computed", count: 1 },
      ...(blockedCount + pendingCount + executedCount > 1 ? [{ type: "multi_respondent" as const, count: blockedCount + pendingCount + executedCount }] : []),
    ],
    authorityType: executionRecord?.authority || undefined,
    expectedOutcome: executionRecord?.firstAction || undefined,
    daysSinceIdentification: daysSince(session.createdAt.toISOString()),
  });

  // Section 1 — Opening
  let opening: string;
  if (executedCount === 0 && pendingCount > 0) {
    opening = "Your decision has not progressed.";
  } else if (blockedCount > executedCount) {
    opening = "More decisions are blocked than executed. The structure has not changed.";
  } else if (trajectory === "ASCENDING") {
    opening = "Progress has been made. It is not yet stable.";
  } else if (trajectory === "DETERIORATING") {
    opening = "The condition is worsening. Execution has stalled and blocked decisions are accumulating.";
  } else {
    opening = "The decision remains open. The constraint has not been resolved.";
  }

  // Section 2 — Trajectory
  let trajectoryReason: string;
  switch (trajectory) {
    case "ASCENDING":
      trajectoryReason = "Execution rate indicates forward movement, but the primary constraint may not yet be resolved.";
      break;
    case "STAGNANT":
      trajectoryReason = "Some decisions have been executed, but the core decision remains unresolved.";
      break;
    case "FRAGILE":
      trajectoryReason = "Execution has not resolved the primary constraint. The condition remains reversible.";
      break;
    case "DETERIORATING":
      trajectoryReason = "Blocked decisions outnumber executed ones. The structural problem is compounding.";
      break;
    default:
      trajectoryReason = "Insufficient execution data to determine trajectory.";
  }

  // Section 3 — Contradiction re-exposed
  const contradiction = decisionText && constraintText
    ? {
        decision: decisionText,
        constraint: constraintText,
        status: blockedCount > 0
          ? `${blockedCount} decision${blockedCount > 1 ? "s" : ""} blocked by this constraint`
          : "The constraint remains active",
      }
    : null;

  // Section 4 — Outcome evidence
  const outcomeEvidence = await buildObservedOutcomeEvidenceFromDB({
    sessionId: session.id,
    organisationKey: session.email ?? undefined,
  });

  const costBasis = parseCostBasis(executionRecord?.timeline || null)
    || parseCostBasis(session.conditionSummary)
    || parseCostBasis(executionRecord?.decision)
    || parseCostBasis(session.decisionQuestion)
    || parseCostBasis(session.coreProblem);
  const costOfInaction = costBasis
    ? calculateCostOfInactionClock({
        ...costBasis,
        startedAt: executionRecord?.createdAt || session.createdAt,
      })
    : null;

  const latestDecision = session.decisions
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const verification = executionRecord
    ? buildCommitmentVerificationStates({
        executionRecord,
        latestDecisionStatus: latestDecision?.status ?? null,
        latestDecisionUpdatedAt: latestDecision?.updatedAt ?? null,
      })
    : null;
  const recurrence = await detectPatternRecurrenceV0({
    email: session.email,
    currentCaseId: session.sessionKey,
    contradiction: constraintText,
    decisionText,
  });

  // ── PURPOSE ALIGNMENT EVIDENCE CARRIED FORWARD ──
  const paEvidence = await loadPurposeAlignmentEvidence({
    email: session.email ?? undefined,
    subjectId: session.id ?? undefined,
  });
  const paSection = buildReturnBriefPaSection(paEvidence);

  // Section 5 — Delta
  const delta = executionState
    ? {
        clarity: executedCount > 0 ? "+1" : "unchanged",
        authority: blockedCount > 0 ? "contested" : "unchanged",
        readiness: trajectory === "DETERIORATING" ? "decreased" : trajectory === "ASCENDING" ? "increased" : "unchanged",
      }
    : null;

  let canonicalSnapshotValue: unknown = session.canonicalSnapshot;
  if (typeof session.canonicalSnapshot === "string") {
    try {
      canonicalSnapshotValue = JSON.parse(session.canonicalSnapshot || "{}");
    } catch {
      canonicalSnapshotValue = null;
    }
  }
  const carryForwardSource = extractAssessmentEvidenceCapture(canonicalSnapshotValue);
  const evidenceCarryForward = Object.keys(carryForwardSource).length > 0
    ? {
        source: carryForwardSource,
        verificationStatus: carryForwardSource.verificationCriteria
          ? outcomeEvidence.processedDecisionCases > 0
            ? `The original evidence suggested success should be proven by ${safeEvidenceText(carryForwardSource.verificationCriteria)}. Current outcome evidence is directional, but the system cannot yet verify that standard directly.`
            : `The original evidence suggested success should be proven by ${safeEvidenceText(carryForwardSource.verificationCriteria)}. The system cannot yet verify it.`
          : undefined,
        failureComparison: carryForwardSource.priorAttempts || carryForwardSource.failureCause
          ? `The original evidence suggested prior correction${carryForwardSource.failureCause ? ` failed because ${safeEvidenceText(carryForwardSource.failureCause)}` : " had already been attempted"}. ${blockedCount > 0 ? "This remains unresolved unless the current execution path breaks that same failure logic." : "The current session has not yet disproved that earlier failure pattern."}`
          : undefined,
        recurrenceStatus: carryForwardSource.recurrenceSignal
          ? recurrence.status === "VERIFIED_RECURRENCE" || recurrence.status === "POSSIBLE_RECURRENCE"
            ? `The original evidence suggested this pattern recurs. Current recurrence checks indicate the pattern is still unresolved.`
            : trajectory === "ASCENDING"
              ? `The original evidence suggested this pattern recurs. Current movement may indicate improvement, but recurrence cannot yet be treated as resolved.`
              : `The original evidence suggested this pattern recurs. The system cannot yet verify that recurrence has stopped.`
          : undefined,
        stopSignalStatus: carryForwardSource.stopSignal
          ? blockedCount > 0 || pendingCount > 0
            ? `The original evidence suggested ${safeEvidenceText(carryForwardSource.stopSignal)} had to stop. This remains unresolved unless that condition has actually stopped.`
            : `The original evidence suggested ${safeEvidenceText(carryForwardSource.stopSignal)} had to stop. The system cannot yet verify that it has stopped.`
          : undefined,
      }
    : null;

  // Section 6 — Direct challenge
  let challenge: string;
  switch (trigger) {
    case "no_activity_after_commitment":
      challenge = "You committed to act. No action has been recorded. What has prevented execution?";
      break;
    case "deteriorating_trajectory":
      challenge = "The condition is worsening. What structural change is required to unblock execution?";
      break;
    case "fragile_trajectory":
      challenge = "The decision remains open. What has prevented execution?";
      break;
    case "recurrence_detected":
      challenge = "This pattern has returned. What was different about the previous resolution that failed to hold?";
      break;
    case "contradiction_persistence":
      challenge = "This is no longer a single decision issue. The pattern is persistent. Without ongoing enforcement, this will continue to recur.";
      break;
    default:
      challenge = "The decision remains open. What has prevented execution?";
  }

  return {
    sessionId: session.id,
    sessionKey: session.sessionKey,
    generatedAt: new Date().toISOString(),
    trigger,
    opening,
    trajectory: {
      state: trajectory as ReturnBrief["trajectory"]["state"],
      reason: kernel.decision.blocked && kernel.decision.reason
        ? `${trajectoryReason} ${kernel.decision.reason}`
        : trajectoryReason,
    },
    kernel: {
      blocked: kernel.decision.blocked,
      reason: kernel.decision.reason ?? null,
      activeContradictions: kernel.graphMetrics.activeContradictions,
    },
    contradiction,
    outcomeEvidence: outcomeEvidence.processedDecisionCases > 0 ? outcomeEvidence : null,
    delta,
    costOfInaction,
    verification,
    recurrence: recurrence.status === "INSUFFICIENT_HISTORY" ? null : recurrence,
    evidenceCarryForward,
    purposeAlignmentEvidence: paSection,
    challenge,
    retainerTriggered: trigger === "contradiction_persistence",
  };
}
