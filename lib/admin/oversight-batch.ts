/**
 * lib/admin/oversight-batch.ts — Batch operation eligibility for oversight review.
 *
 * Wraps the cadence queue with eligibility classification so the batch UI
 * can show which actions are safe for each cycle without individual preview calls.
 *
 * Safe v1 batch actions:
 *   MARK_IN_PROGRESS — start review for DUE/OVERDUE cycles that have a cycleId
 *   MARK_COMPLETED   — complete a cycle that is in REVIEW_IN_PROGRESS
 *   SKIP_WITH_REASON — skip (requires reason string, never skips already-terminal states)
 *
 * NOT in scope for v1 (require per-cycle suppression/brief data):
 *   - Bulk delivery / approve-for-delivery
 *   - Bulk counsel escalation
 *   - Bulk boardroom escalation
 *   - Bulk delete
 */

import type { RetainedCadenceState } from "@/lib/product/retained-cadence-contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OversightBatchAction =
  | "MARK_IN_PROGRESS"
  | "MARK_COMPLETED"
  | "SKIP_WITH_REASON";

export type OversightBatchItem = {
  cycleId: string;
  accountId: string | null;
  organisationId: string | null;
  organisationLabel: string;
  cadenceState: RetainedCadenceState;
  scheduledFor: string | null;
  evidencePosture: string;
  eligibleActions: OversightBatchAction[];
  ineligibleReasons: string[];
};

export type OversightBatchResult = {
  ok: boolean;
  successCount: number;
  failCount: number;
  results: Array<{
    cycleId: string;
    success: boolean;
    error?: string;
  }>;
};

// ─── Eligibility helpers (exported for testing) ───────────────────────────────

const STARTABLE_STATES: ReadonlySet<RetainedCadenceState> = new Set([
  "DUE_SOON",
  "REVIEW_DUE",
  "OVERDUE",
  "CADENCE_BROKEN",
  "MANUAL_OPERATOR_REVIEW",
]);

const TERMINAL_STATES: ReadonlySet<RetainedCadenceState> = new Set([
  "COMPLETED",
  "REVIEW_COMPLETED",
  "SKIPPED_WITH_REASON",
  "REVIEW_SKIPPED",
  "NOT_CONFIGURED",
]);

/**
 * Returns the eligible batch actions for a single queue item.
 * Requires a cycleId — items without one have no eligible actions.
 */
export function classifyBatchEligibility(item: {
  cycleId: string | null;
  cadenceState: RetainedCadenceState;
}): Pick<OversightBatchItem, "eligibleActions" | "ineligibleReasons"> {
  const eligibleActions: OversightBatchAction[] = [];
  const ineligibleReasons: string[] = [];

  if (!item.cycleId) {
    ineligibleReasons.push("No cycle record — create a cycle before taking action");
    return { eligibleActions, ineligibleReasons };
  }

  // MARK_IN_PROGRESS
  if (STARTABLE_STATES.has(item.cadenceState)) {
    eligibleActions.push("MARK_IN_PROGRESS");
  } else if (item.cadenceState === "REVIEW_IN_PROGRESS") {
    ineligibleReasons.push("Already in progress");
  } else if (TERMINAL_STATES.has(item.cadenceState)) {
    ineligibleReasons.push(`Cycle is terminal (${item.cadenceState})`);
  }

  // MARK_COMPLETED
  if (item.cadenceState === "REVIEW_IN_PROGRESS") {
    eligibleActions.push("MARK_COMPLETED");
  }

  // SKIP_WITH_REASON (available unless terminal)
  if (!TERMINAL_STATES.has(item.cadenceState)) {
    eligibleActions.push("SKIP_WITH_REASON");
  } else if (!ineligibleReasons.some((r) => r.includes("terminal"))) {
    ineligibleReasons.push(`Cycle is terminal (${item.cadenceState})`);
  }

  return { eligibleActions, ineligibleReasons };
}

// ─── Queue builder ────────────────────────────────────────────────────────────

/**
 * Builds a batch-ready queue from the cadence service.
 * Excludes NOT_CONFIGURED items (no cycleId, no actions possible).
 */
export async function buildOversightBatchQueue(): Promise<OversightBatchItem[]> {
  const { buildOperatorCadenceQueue } = await import(
    "@/lib/product/retained-cadence-service"
  );
  const queue = await buildOperatorCadenceQueue();

  return queue.all
    .filter((item) => item.cadenceState !== "NOT_CONFIGURED")
    .filter((item) => item.cycleId !== null)
    .map((item) => {
      const { eligibleActions, ineligibleReasons } = classifyBatchEligibility({
        cycleId: item.cycleId,
        cadenceState: item.cadenceState,
      });

      return {
        cycleId: item.cycleId as string,
        accountId: item.accountId ?? null,
        organisationId: item.organisationId ?? null,
        organisationLabel: item.organisationLabel,
        cadenceState: item.cadenceState,
        scheduledFor: item.scheduledFor ?? null,
        evidencePosture: item.evidencePosture,
        eligibleActions,
        ineligibleReasons,
      };
    });
}
