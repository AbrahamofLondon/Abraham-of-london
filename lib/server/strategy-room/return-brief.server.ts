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
import { buildObservedOutcomeEvidence, type OutcomeEvidenceSummary } from "@/lib/outcomes/evidence";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReturnBriefTrigger =
  | "fragile_trajectory"
  | "deteriorating_trajectory"
  | "no_activity_after_commitment"
  | "recurrence_detected"
  | "contradiction_persistence";

export type ReturnBrief = {
  sessionId: string;
  generatedAt: string;
  trigger: ReturnBriefTrigger;

  /** Section 1 — Opening (zero softness) */
  opening: string;

  /** Section 2 — Trajectory snapshot */
  trajectory: {
    state: "ASCENDING" | "STAGNANT" | "FRAGILE" | "DETERIORATING";
    reason: string;
  };

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
  executionSessionId: string,
): Promise<ReturnBrief | null> {
  const session = await prisma.strategyRoomExecutionSession.findUnique({
    where: { id: executionSessionId },
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
  const decisionText = session.decisionQuestion ?? "the stated decision";
  const constraintText = session.coreProblem ?? "the primary constraint";
  const pendingCount = session.decisions.filter((d) => d.status === "pending").length;
  const blockedCount = session.decisions.filter((d) => d.status === "blocked").length;
  const executedCount = session.decisions.filter((d) => d.status === "executed").length;

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
  const outcomeEvidence = buildObservedOutcomeEvidence();

  // Section 5 — Delta
  const delta = executionState
    ? {
        clarity: executedCount > 0 ? "+1" : "unchanged",
        authority: blockedCount > 0 ? "contested" : "unchanged",
        readiness: trajectory === "DETERIORATING" ? "decreased" : trajectory === "ASCENDING" ? "increased" : "unchanged",
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
    sessionId: executionSessionId,
    generatedAt: new Date().toISOString(),
    trigger,
    opening,
    trajectory: {
      state: trajectory as ReturnBrief["trajectory"]["state"],
      reason: trajectoryReason,
    },
    contradiction,
    outcomeEvidence: outcomeEvidence.processedDecisionCases > 0 ? outcomeEvidence : null,
    delta,
    challenge,
    retainerTriggered: trigger === "contradiction_persistence",
  };
}
