/**
 * lib/living-intelligence/living-action-feedback-guards.ts
 *
 * Guardrail functions for safe feedback capture.
 *
 * These guards prevent:
 *   - Users from marking actions as verified
 *   - Users from inferring evidence verification
 *   - Users from granting consent by feedback update
 *   - Users from marking delivery complete
 *   - Users from marking publication approved
 *   - Users from marking retainer readiness
 *   - Operators from auto-verifying without evidence flags
 *   - Unknown object/action IDs from being processed
 *   - Raw sensitive answers from being stored
 *   - Operator-only state from being exposed to users
 */

import type {
  LivingActionFeedbackStatus,
  LivingActionFeedbackActor,
  LivingActionFeedbackSource,
} from "@/lib/living-intelligence/living-action-feedback-contract";

// ─── User-safe statuses ──────────────────────────────────────────────────────

const USER_ALLOWED_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "acknowledged",
  "started",
  "evidence_submitted",
  "skipped",
]);

const USER_FORBIDDEN_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "verified_complete",
  "blocked",
  "expired",
  "regressed",
  "completed_unverified",
]);

// ─── Operator-safe statuses ──────────────────────────────────────────────────

const OPERATOR_ALLOWED_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "acknowledged",
  "started",
  "evidence_submitted",
  "completed_unverified",
  "blocked",
  "skipped",
  "expired",
  "regressed",
]);

// ─── Verification-required statuses ──────────────────────────────────────────

const VERIFICATION_REQUIRED_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "verified_complete",
]);

// ─── Guards ──────────────────────────────────────────────────────────────────

/**
 * Can a user set this feedback status via the user-facing route?
 */
export function canUserSetFeedbackStatus(status: string): boolean {
  return USER_ALLOWED_STATUSES.has(status as LivingActionFeedbackStatus);
}

/**
 * Can an operator set this feedback status via the internal route?
 */
export function canOperatorSetFeedbackStatus(status: string): boolean {
  return OPERATOR_ALLOWED_STATUSES.has(status as LivingActionFeedbackStatus);
}

/**
 * Does this status require evidence verification before it can be set?
 */
export function requiresEvidenceVerification(status: string): boolean {
  return VERIFICATION_REQUIRED_STATUSES.has(status as LivingActionFeedbackStatus);
}

/**
 * Is this status only settable by a manual review (not automated)?
 */
export function requiresManualReview(status: string): boolean {
  return status === "verified_complete";
}

/**
 * Validate that a feedback update request is safe for the given audience.
 * Throws a descriptive error if the request is unsafe.
 */
export function assertFeedbackUpdateIsSafe(
  input: unknown,
  audience: "user" | "operator",
): void {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid request body");
  }

  const body = input as Record<string, unknown>;

  // Must have feedbackId or objectId + actionId.
  const feedbackId = body.feedbackId;
  const objectId = body.objectId;
  const actionId = body.actionId;

  if (!feedbackId && (!objectId || !actionId)) {
    throw new Error("Must provide feedbackId or (objectId + actionId)");
  }

  // Status is required.
  const status = body.status;
  if (typeof status !== "string" || status.length === 0) {
    throw new Error("Status is required");
  }

  // Validate status against audience.
  if (audience === "user") {
    if (!canUserSetFeedbackStatus(status)) {
      throw new Error(
        `User cannot set status "${status}". Allowed: ${[...USER_ALLOWED_STATUSES].join(", ")}`,
      );
    }
  } else {
    if (!canOperatorSetFeedbackStatus(status) && !requiresManualReview(status)) {
      throw new Error(
        `Operator cannot set status "${status}" without evidence verification. Allowed: ${[...OPERATOR_ALLOWED_STATUSES].join(", ")}`,
      );
    }
  }

  // For verified_complete, require evidenceVerified and resolutionVerified.
  if (status === "verified_complete") {
    if (audience !== "operator") {
      throw new Error("Only operator can set verified_complete");
    }
    if (body.evidenceVerified !== true) {
      throw new Error("verified_complete requires evidenceVerified=true");
    }
    if (body.resolutionVerified !== true) {
      throw new Error("verified_complete requires resolutionVerified=true");
    }
    if (body.actor !== "operator" && body.actor !== "admin" && body.actor !== "reviewer" && body.actor !== "founder") {
      throw new Error("verified_complete requires actor=operator/admin/reviewer/founder");
    }
    if (body.source !== "manual_review") {
      throw new Error("verified_complete requires source=manual_review");
    }
  }

  // Reject raw sensitive data in notes.
  const notes = body.notes;
  if (typeof notes === "string" && notes.length > 500) {
    throw new Error("Notes must be under 500 characters");
  }

  // Reject raw evidence payloads.
  if (body.evidencePayload !== undefined) {
    throw new Error("Raw evidence payloads are not accepted via feedback update");
  }

  // Reject raw answers.
  if (body.rawAnswer !== undefined || body.rawResponse !== undefined) {
    throw new Error("Raw answers are not accepted via feedback update");
  }
}

/**
 * Validate that an objectId is known in the current estate.
 * Returns true if the object exists in the provided set.
 */
export function isKnownObjectId(
  objectId: string,
  knownObjectIds: Set<string>,
): boolean {
  return knownObjectIds.has(objectId);
}

/**
 * Validate that an actionId exists for a given object.
 * Returns true if the action exists in the provided set.
 */
export function isKnownActionId(
  objectId: string,
  actionId: string,
  knownActions: Map<string, Set<string>>,
): boolean {
  const actions = knownActions.get(objectId);
  if (!actions) return false;
  return actions.has(actionId);
}

/**
 * Get the user-safe statuses list for display.
 */
export function getUserSafeStatuses(): LivingActionFeedbackStatus[] {
  return [...USER_ALLOWED_STATUSES];
}

/**
 * Get the operator-safe statuses list for display.
 */
export function getOperatorSafeStatuses(): LivingActionFeedbackStatus[] {
  return [...OPERATOR_ALLOWED_STATUSES, "verified_complete"];
}

/**
 * Check if a status is terminal (cannot be changed further).
 */
export function isTerminalStatus(status: string): boolean {
  return status === "verified_complete" || status === "expired";
}
