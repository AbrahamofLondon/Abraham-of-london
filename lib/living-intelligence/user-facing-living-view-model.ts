/**
 * lib/living-intelligence/user-facing-living-view-model.ts
 *
 * Derives a user-safe living view model from existing living-state outputs.
 *
 * This is the bridge between the living-state engine and user-facing surfaces.
 * It ensures that operator-only state, internal repair routes, admin details,
 * and raw governance information are never exposed to end users.
 *
 * Every user-facing assessment/result surface should use this to render a
 * "Living Review" section that answers:
 *   1. What did the system hear?
 *   2. What evidence supports the result?
 *   3. What contradiction or tension was detected?
 *   4. What cannot be inferred?
 *   5. What is the next governed action?
 *   6. What should the user bring back as evidence?
 *   7. Was memory or continuity written?
 *   8. Is the result user-safe?
 *   9. What should not be treated as verified?
 *  10. What changed from previous interaction, if known?
 */

import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserFacingLivingViewModel = {
  objectId: string;
  domain: string;
  title: string;
  summary: string;
  whatTheSystemHeard: string[];
  evidenceStatus: string;
  evidenceLimitations: string[];
  contradictionOrTension: string[];
  cannotInfer: string[];
  nextGovernedActions: Array<{
    label: string;
    description: string;
    userActionRequired: boolean;
    requiresEvidence: boolean;
  }>;
  memory: {
    written: boolean;
    recurrenceKnown: boolean;
    changedSincePrevious: boolean;
    summary: string;
  };
  safety: {
    safeToShowUser: boolean;
    operatorOnlyExcluded: boolean;
    automationNotAllowed: boolean;
  };
};

// ─── Derivation ──────────────────────────────────────────────────────────────

/**
 * Derive a user-safe living view model from a LivingStateObject.
 *
 * Rules:
 *   - Never expose operator-only blockers, internal repair routes, admin-only
 *     state, raw response details from other users, or sponsor/advisor/private
 *     governance information.
 *   - Evidence status is shown honestly — never overclaimed.
 *   - "Cannot infer" boundaries are surfaced to prevent over-trust.
 *   - Next actions are governed, not automated.
 *   - Memory/continuity is shown only when durable.
 */
export function deriveUserFacingLivingViewModel(
  object: LivingStateObject,
): UserFacingLivingViewModel {
  // ── What the system heard ──────────────────────────────────────────────────
  // From supporting evidence — this is what the system derived from user input.
  const whatTheSystemHeard = object.evidence.supportingEvidence
    .filter((s) => s.length > 0 && s.length < 300)
    .slice(0, 3);

  // ── Evidence status ────────────────────────────────────────────────────────
  const evidenceStatus = object.evidence.status;
  const evidenceLimitations = object.evidence.cannotInfer.length > 0
    ? object.evidence.cannotInfer
    : ["This result is based on the information provided. It is not a verified outcome."];

  // ── Contradictions / tensions (user-safe only) ──────────────────────────────
  const contradictionOrTension: string[] = [];
  for (const blocker of object.blockers) {
    // Only surface user-safe blockers — never operator/internal ones.
    if (blocker.severity === "governed_tension" || blocker.severity === "informational") {
      contradictionOrTension.push(blocker.explanation);
    } else if (blocker.severity === "warning" && isUserSafeBlocker(blocker.code)) {
      contradictionOrTension.push(blocker.explanation);
    }
  }

  // ── Cannot infer ───────────────────────────────────────────────────────────
  const cannotInfer = object.evidence.cannotInfer.length > 0
    ? object.evidence.cannotInfer
    : [
        "The system cannot verify this result without additional evidence.",
        "A completed form is not proof of execution or verification.",
      ];

  // ── Next governed actions (user-facing only) ────────────────────────────────
  const nextGovernedActions = object.nextActions
    .filter((a) => a.owner === "user" || a.owner === "client")
    .map((a) => ({
      label: a.label,
      description: a.description,
      userActionRequired: true,
      requiresEvidence: a.requiredEvidence.length > 0,
    }));

  // If no user-facing actions exist, provide a default governed action.
  if (nextGovernedActions.length === 0) {
    nextGovernedActions.push({
      label: "Continue to Decision Centre",
      description: "Review this result in your Decision Centre for the full governed context and next steps.",
      userActionRequired: true,
      requiresEvidence: false,
    });
  }

  // ── Memory / continuity ────────────────────────────────────────────────────
  const memoryWritten = object.memory.recurrenceCount > 1;
  const recurrenceKnown = object.memory.recurrenceCount > 1;
  const changedSincePrevious = object.memory.regressionDetected || object.memory.resolvedSinceLastRun;

  let memorySummary = "This is a new assessment. No prior memory exists for this case.";
  if (memoryWritten && recurrenceKnown) {
    memorySummary = `This pattern has been observed ${object.memory.recurrenceCount} time(s). `;
    if (object.memory.regressionDetected) {
      memorySummary += "The condition has worsened since the last observation.";
    } else if (object.memory.resolvedSinceLastRun) {
      memorySummary += "The condition has improved since the last observation.";
    } else {
      memorySummary += "The pattern is consistent with previous observations.";
    }
  }

  // ── Safety ─────────────────────────────────────────────────────────────────
  const safeToShowUser = object.safeToShowUser;
  const operatorOnlyExcluded = !safeToShowUser || object.blockers.some(
    (b) => b.code === "unsafe_to_show_user",
  );
  const automationNotAllowed = !object.safeToAutomate;

  return {
    objectId: object.id,
    domain: object.domain,
    title: object.title,
    summary: object.userVisibleSummary,
    whatTheSystemHeard,
    evidenceStatus,
    evidenceLimitations,
    contradictionOrTension,
    cannotInfer,
    nextGovernedActions,
    memory: {
      written: memoryWritten,
      recurrenceKnown,
      changedSincePrevious,
      summary: memorySummary,
    },
    safety: {
      safeToShowUser,
      operatorOnlyExcluded,
      automationNotAllowed,
    },
  };
}

/**
 * Derive a user-facing living view model from a free-form assessment context
 * when no LivingStateObject exists yet (e.g., during a live assessment flow).
 */
export function deriveInlineLivingViewModel(params: {
  domain: string;
  title: string;
  summary: string;
  whatTheSystemHeard: string[];
  evidenceStatus: string;
  evidenceLimitations?: string[];
  contradictions?: string[];
  cannotInfer?: string[];
  nextActions?: Array<{ label: string; description: string }>;
  memorySummary?: string;
}): UserFacingLivingViewModel {
  return {
    objectId: `inline-${params.domain}-${Date.now()}`,
    domain: params.domain,
    title: params.title,
    summary: params.summary,
    whatTheSystemHeard: params.whatTheSystemHeard.slice(0, 3),
    evidenceStatus: params.evidenceStatus,
    evidenceLimitations: params.evidenceLimitations ?? [
      "This result is based on the information provided. It is not a verified outcome.",
    ],
    contradictionOrTension: params.contradictions ?? [],
    cannotInfer: params.cannotInfer ?? [
      "The system cannot verify this result without additional evidence.",
      "A completed form is not proof of execution or verification.",
    ],
    nextGovernedActions: (params.nextActions ?? []).map((a) => ({
      label: a.label,
      description: a.description,
      userActionRequired: true,
      requiresEvidence: false,
    })),
    memory: {
      written: false,
      recurrenceKnown: false,
      changedSincePrevious: false,
      summary: params.memorySummary ?? "This is a new assessment. No prior memory exists for this case.",
    },
    safety: {
      safeToShowUser: true,
      operatorOnlyExcluded: true,
      automationNotAllowed: true,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const USER_SAFE_BLOCKER_CODES = new Set([
  "missing_evidence",
  "assessment_without_memory",
  "diagnostic_without_evidence_posture",
]);

function isUserSafeBlocker(code: string): boolean {
  return USER_SAFE_BLOCKER_CODES.has(code);
}
