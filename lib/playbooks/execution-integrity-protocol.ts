/**
 * lib/playbooks/execution-integrity-protocol.ts
 *
 * Execution Integrity Protocol — genuine execution-reliability analysis.
 *
 * The product assesses whether a set of commitments can actually be executed:
 * are owners clear, are dependencies resolvable, where are the failure points,
 * and what is the escalation threshold. It does NOT judge strategy — only the
 * integrity of execution given the commitments supplied.
 *
 * Product-specific (not a generic form): the scoring is driven by commitment
 * structure — ownerless commitments, unresolved/blocked dependencies, deadline
 * proximity, and status/blocker contradictions.
 */

import {
  type Contradiction,
  type PlaybookAction,
  type PlaybookRunResult,
  type PlaybookRunPosture,
  type Severity,
  PLAYBOOK_CLAIM_BOUNDARY,
  maxSeverity,
  requireArray,
} from "./playbook-run-types";

export const EXECUTION_INTEGRITY_PROTOCOL_CODE = "execution_integrity_protocol";

export type CommitmentStatus =
  | "on_track"
  | "at_risk"
  | "blocked"
  | "complete"
  | "unknown";

export interface Commitment {
  id: string;
  statement: string;
  owner?: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  deadline?: string | null;
  /** ids of other commitments this one depends on. */
  dependencies?: string[];
  reviewCadenceDays?: number | null;
  status?: CommitmentStatus;
  /** active blockers; a non-empty list means execution is currently obstructed. */
  blockers?: string[];
}

export interface ExecutionIntegrityInput {
  commitments: Commitment[];
  /** evaluation date for deadline proximity; defaults to today. */
  asOf?: string;
}

export interface CommitmentAssessment {
  id: string;
  ownerClarity: Severity; // LOW = clear owner, HIGH = ownerless
  dependencyRisk: Severity;
  escalationThreshold: "none" | "watch" | "escalate_now";
  isFailurePoint: boolean;
  notes: string[];
}

export interface ExecutionIntegrityFindings {
  assessments: CommitmentAssessment[];
  failurePoints: string[]; // commitment ids
  ownerlessCount: number;
  blockedCount: number;
}

const DAY_MS = 86_400_000;

function daysUntil(deadline: string | null | undefined, asOf: Date): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - asOf.getTime()) / DAY_MS);
}

export function runExecutionIntegrityProtocol(
  input: ExecutionIntegrityInput,
): PlaybookRunResult<ExecutionIntegrityFindings> {
  const commitments = requireArray(input?.commitments, "commitments") as Commitment[];
  const asOf = input?.asOf ? new Date(input.asOf) : new Date();

  const base: Omit<PlaybookRunResult<ExecutionIntegrityFindings>, "posture" | "overallSeverity" | "score"> = {
    playbook: EXECUTION_INTEGRITY_PROTOCOL_CODE,
    findings: { assessments: [], failurePoints: [], ownerlessCount: 0, blockedCount: 0 },
    contradictions: [],
    evidenceGaps: [],
    actions: [],
    claimBoundary: PLAYBOOK_CLAIM_BOUNDARY,
  };

  // Insufficient-evidence case: nothing to assess.
  if (commitments.length === 0) {
    return {
      ...base,
      posture: "INSUFFICIENT_EVIDENCE",
      overallSeverity: "LOW",
      score: null,
      evidenceGaps: ["No commitments supplied — execution integrity cannot be assessed."],
    };
  }

  const knownIds = new Set(commitments.map((c) => c.id));
  const assessments: CommitmentAssessment[] = [];
  const contradictions: Contradiction[] = [];
  const failurePoints: string[] = [];
  const evidenceGaps: string[] = [];
  const severities: Severity[] = [];
  let ownerlessCount = 0;
  let blockedCount = 0;
  let penalty = 0; // aggregate deduction from 100

  for (const c of commitments) {
    const notes: string[] = [];
    const blockers = Array.isArray(c.blockers) ? c.blockers : [];
    const deps = Array.isArray(c.dependencies) ? c.dependencies : [];
    const status: CommitmentStatus = c.status ?? "unknown";

    // Owner clarity
    const hasOwner = Boolean(c.owner && String(c.owner).trim());
    const ownerClarity: Severity = hasOwner ? "LOW" : "HIGH";
    if (!hasOwner) {
      ownerlessCount += 1;
      penalty += 18;
      notes.push("No accountable owner named.");
    }

    // Dependency risk: unresolved (dangling) deps and blocked deps raise risk.
    const danglingDeps = deps.filter((d) => !knownIds.has(d));
    const blockedDeps = deps.filter((d) => {
      const dep = commitments.find((x) => x.id === d);
      return dep && (dep.status === "blocked" || (dep.blockers?.length ?? 0) > 0);
    });
    let dependencyRisk: Severity = "LOW";
    if (danglingDeps.length > 0) {
      dependencyRisk = "HIGH";
      penalty += 10 * danglingDeps.length;
      notes.push(`Depends on unknown commitment(s): ${danglingDeps.join(", ")}.`);
      evidenceGaps.push(`Commitment "${c.id}" references dependency ids not in the set: ${danglingDeps.join(", ")}.`);
    } else if (blockedDeps.length > 0) {
      dependencyRisk = "MEDIUM";
      penalty += 6 * blockedDeps.length;
      notes.push(`Blocked by upstream commitment(s): ${blockedDeps.join(", ")}.`);
    } else if (deps.length >= 3) {
      dependencyRisk = "MEDIUM";
      penalty += 4;
      notes.push("High dependency fan-in (3+).");
    }

    // Deadline proximity
    const dLeft = daysUntil(c.deadline, asOf);
    if (dLeft === null && c.deadline == null) {
      evidenceGaps.push(`Commitment "${c.id}" has no deadline.`);
    }

    // Blocked / failure-point detection
    if (status === "blocked" || blockers.length > 0) {
      blockedCount += 1;
      penalty += 12;
      notes.push(`Currently obstructed${blockers.length ? `: ${blockers.join("; ")}` : ""}.`);
    }

    // Escalation threshold: driven by status + deadline + blockers
    let escalationThreshold: CommitmentAssessment["escalationThreshold"] = "none";
    const nearOrPast = dLeft !== null && dLeft <= 7;
    if ((status === "blocked" || blockers.length > 0) && (nearOrPast || dLeft === null)) {
      escalationThreshold = "escalate_now";
    } else if (status === "at_risk" || status === "blocked" || blockers.length > 0 || nearOrPast) {
      escalationThreshold = "watch";
    }

    // Failure-point: obstructed AND (near/past deadline) → likely to miss.
    const isFailurePoint =
      (status === "blocked" || blockers.length > 0) && (nearOrPast || dLeft === null);
    if (isFailurePoint) failurePoints.push(c.id);

    // Contradiction: marked complete but obstructed or has unresolved deps.
    if (status === "complete" && (blockers.length > 0 || blockedDeps.length > 0 || danglingDeps.length > 0)) {
      contradictions.push({
        ref: c.id,
        detail: `Status is "complete" but the commitment still has ${
          blockers.length ? "active blockers" : "unresolved dependencies"
        }.`,
      });
    }

    const cSeverity = maxSeverity([
      ownerClarity,
      dependencyRisk,
      isFailurePoint ? "CRITICAL" : escalationThreshold === "escalate_now" ? "HIGH" : "LOW",
    ]);
    severities.push(cSeverity);

    assessments.push({ id: c.id, ownerClarity, dependencyRisk, escalationThreshold, isFailurePoint, notes });
  }

  // Actions
  const actions: PlaybookAction[] = [];
  if (ownerlessCount > 0) {
    actions.push({
      action: `Assign a named, accountable owner to ${ownerlessCount} ownerless commitment(s).`,
      rationale: "Execution integrity is undefined without a single accountable owner.",
      severity: "HIGH",
    });
  }
  if (failurePoints.length > 0) {
    actions.push({
      action: `Escalate the ${failurePoints.length} identified failure point(s) now: ${failurePoints.join(", ")}.`,
      rationale: "These commitments are obstructed and at or past their review horizon.",
      severity: "CRITICAL",
    });
  }
  if (contradictions.length > 0) {
    actions.push({
      action: "Reconcile commitments marked complete that still carry blockers or unresolved dependencies.",
      rationale: "A false 'complete' status hides live execution risk.",
      severity: "HIGH",
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const overallSeverity = maxSeverity(severities);

  let posture: PlaybookRunPosture;
  if (contradictions.length > 0) posture = "CONTRADICTORY_INPUT";
  else if (evidenceGaps.length > 0) posture = "PARTIAL";
  else posture = "ACTIONABLE";

  return {
    ...base,
    posture,
    overallSeverity,
    score,
    findings: { assessments, failurePoints, ownerlessCount, blockedCount },
    contradictions,
    evidenceGaps,
    actions,
  };
}
