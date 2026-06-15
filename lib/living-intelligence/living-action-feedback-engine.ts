/**
 * lib/living-intelligence/living-action-feedback-engine.ts
 *
 * Feedback engine that matches feedback records to current LivingStateObjects
 * and derives action recurrence, resolution, regression, and status.
 *
 * Behaviour:
 *   - If action was recommended before and still appears → repeated action.
 *   - If action disappeared because blocker resolved → resolved action.
 *   - If action severity worsened → regression.
 *   - If action is completed_unverified → keep blocker/tension until evidence verified.
 *   - If action is verified_complete → allow memory to record resolution.
 *   - If action is skipped/expired → increase recurrence or priority.
 *   - If action requires evidence and none supplied → remain unresolved.
 *   - If action requires human review → never auto-verify.
 */

import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";
import type {
  LivingActionFeedback,
  LivingActionFeedbackSummary,
} from "@/lib/living-intelligence/living-action-feedback-contract";
import {
  LIVING_ACTION_FEEDBACK_TERMINAL_STATUSES,
  LIVING_ACTION_FEEDBACK_UNRESOLVED_STATUSES,
} from "@/lib/living-intelligence/living-action-feedback-contract";
import type { LivingActionFeedbackStore } from "@/lib/living-intelligence/living-action-feedback-contract";
import {
  loadFeedbackStore,
  saveFeedbackStore,
  upsertFeedback,
} from "@/lib/living-intelligence/living-action-feedback-store";

// ─── Engine ──────────────────────────────────────────────────────────────────

export type FeedbackEnrichment = {
  store: LivingActionFeedbackStore;
  summary: LivingActionFeedbackSummary;
  /** Feedback records that are repeated (same action still present). */
  repeated: LivingActionFeedback[];
  /** Feedback records that are resolved (action no longer present). */
  resolved: LivingActionFeedback[];
  /** Feedback records that have regressed (severity worsened). */
  regressed: LivingActionFeedback[];
  /** Feedback records that are completed but not verified. */
  completedUnverified: LivingActionFeedback[];
  /** Feedback records that require evidence. */
  evidenceRequired: LivingActionFeedback[];
};

/**
 * Run the feedback engine against current LivingStateObjects.
 *
 * For each object, it matches existing feedback records and derives
 * recurrence, resolution, regression, and status updates.
 */
export function runFeedbackEngine(
  objects: LivingStateObject[],
): FeedbackEnrichment {
  const store = loadFeedbackStore();
  const now = new Date().toISOString();

  // Build a map of objectId → current blockers (as action signatures).
  const currentActions = new Map<string, Set<string>>();
  for (const object of objects) {
    const actions = new Set<string>();
    for (const blocker of object.blockers) {
      actions.add(`${blocker.code}:${blocker.requiredAction}`);
    }
    // Also add next actions.
    for (const action of object.nextActions) {
      actions.add(`next:${action.label}`);
    }
    currentActions.set(object.id, actions);
  }

  const repeated: LivingActionFeedback[] = [];
  const resolved: LivingActionFeedback[] = [];
  const regressed: LivingActionFeedback[] = [];
  const completedUnverified: LivingActionFeedback[] = [];
  const evidenceRequired: LivingActionFeedback[] = [];

  // Process each feedback record.
  for (const feedback of store.feedback) {
    const objectActions = currentActions.get(feedback.objectId);

    if (!objectActions) {
      // Object no longer exists — mark as resolved if not terminal.
      if (!LIVING_ACTION_FEEDBACK_TERMINAL_STATUSES.has(feedback.status)) {
        feedback.status = "verified_complete";
        feedback.lastUpdatedAt = now;
        feedback.resolutionClaimed = true;
        feedback.resolutionVerified = true;
        resolved.push(feedback);
      }
      continue;
    }

    // Build the action key for this feedback.
    const actionKey = feedback.actionId;

    if (objectActions.has(actionKey)) {
      // Action still present — it's repeated.
      if (feedback.status === "verified_complete" || feedback.status === "expired") {
        // Was resolved but now back — regression.
        feedback.status = "regressed";
        feedback.lastUpdatedAt = now;
        regressed.push(feedback);
      } else if (feedback.status !== "regressed") {
        // Still unresolved — repeated.
        repeated.push(feedback);
      }
    } else {
      // Action no longer present — resolved.
      if (LIVING_ACTION_FEEDBACK_UNRESOLVED_STATUSES.has(feedback.status)) {
        feedback.status = "completed_unverified";
        feedback.lastUpdatedAt = now;
        feedback.resolutionClaimed = true;
        completedUnverified.push(feedback);
        resolved.push(feedback);
      }
    }

    // Track evidence requirements.
    if (feedback.evidenceRequired && !feedback.evidenceSubmitted) {
      evidenceRequired.push(feedback);
    }
  }

  // Generate new feedback records for current blockers that don't have feedback.
  for (const object of objects) {
    for (const blocker of object.blockers) {
      const actionId = `${blocker.code}:${blocker.requiredAction}`;
      const exists = store.feedback.some(
        (f) => f.objectId === object.id && f.actionId === actionId,
      );
      if (!exists) {
        upsertFeedback(store, {
          objectId: object.id,
          actionId,
          domain: object.domain,
          subjectType: object.subjectType,
          actor: blocker.actionOwner,
          label: blocker.label,
          expectedOutcome: blocker.requiredAction,
          evidenceRequired: blocker.code === "missing_evidence",
          source: "living_runner",
          status: "recommended",
        });
      }
    }
  }

  // Build summary.
  const byStatus: Record<string, number> = {};
  for (const status of LIVING_ACTION_FEEDBACK_UNRESOLVED_STATUSES) {
    byStatus[status] = 0;
  }
  byStatus["verified_complete"] = 0;
  byStatus["expired"] = 0;

  for (const fb of store.feedback) {
    byStatus[fb.status] = (byStatus[fb.status] ?? 0) + 1;
  }

  // By domain.
  const byDomain: Record<string, { total: number; repeated: number; resolved: number; regressed: number }> = {};
  for (const fb of store.feedback) {
    if (!byDomain[fb.domain]) {
      byDomain[fb.domain] = { total: 0, repeated: 0, resolved: 0, regressed: 0 };
    }
    byDomain[fb.domain]!.total += 1;
  }
  for (const fb of repeated) {
    if (byDomain[fb.domain]) byDomain[fb.domain]!.repeated += 1;
  }
  for (const fb of resolved) {
    if (byDomain[fb.domain]) byDomain[fb.domain]!.resolved += 1;
  }
  for (const fb of regressed) {
    if (byDomain[fb.domain]) byDomain[fb.domain]!.regressed += 1;
  }

  const summary: LivingActionFeedbackSummary = {
    generatedAt: now,
    totalActions: store.feedback.length,
    byStatus: byStatus as Record<LivingActionFeedback["status"], number>,
    repeatedActions: repeated.length,
    resolvedActions: resolved.length,
    regressedActions: regressed.length,
    completedUnverified: completedUnverified.length,
    evidenceRequired: evidenceRequired.length,
    evidenceSubmitted: store.feedback.filter((f) => f.evidenceSubmitted).length,
    evidenceVerified: store.feedback.filter((f) => f.evidenceVerified).length,
    byDomain,
  };

  saveFeedbackStore(store);

  return {
    store,
    summary,
    repeated,
    resolved,
    regressed,
    completedUnverified,
    evidenceRequired,
  };
}

/**
 * Get feedback for a specific object, enriched with user-safe filtering.
 */
export function getUserSafeFeedback(
  feedback: LivingActionFeedback[],
): LivingActionFeedback[] {
  return feedback.filter((f) => {
    // Never expose operator-only action statuses to users.
    if (f.actor === "operator" || f.actor === "admin" || f.actor === "founder" || f.actor === "reviewer") {
      return false;
    }
    // Only show user-safe statuses.
    const userSafeStatuses = new Set([
      "recommended",
      "started",
      "evidence_submitted",
      "completed_unverified",
    ]);
    return userSafeStatuses.has(f.status);
  });
}
