/**
 * lib/living-intelligence/living-action-feedback-contract.ts
 *
 * Feedback contract for governed actions across the living-state estate.
 *
 * For every governed action, the system tracks:
 *   1. What action was recommended?
 *   2. Who was expected to act?
 *   3. Was the action taken?
 *   4. Was evidence supplied?
 *   5. Did the blocker resolve?
 *   6. Did the same issue repeat?
 *   7. Did severity worsen?
 *   8. Did the user/operator ignore the action?
 *   9. Is human review still required?
 *  10. What should happen next?
 *
 * The system REFUSES to infer:
 *   - action completion from a button click alone
 *   - evidence verification from upload/link presence
 *   - resolution from acknowledgement
 *   - execution from intention
 *   - approval from review page visit
 *   - consent from absence of objection
 *   - readiness from repeated interest
 */

// ─── Status ───────────────────────────────────────────────────────────────────

export type LivingActionFeedbackStatus =
  | "recommended"
  | "acknowledged"
  | "started"
  | "evidence_submitted"
  | "completed_unverified"
  | "verified_complete"
  | "skipped"
  | "blocked"
  | "expired"
  | "regressed";

// ─── Actor ────────────────────────────────────────────────────────────────────

export type LivingActionFeedbackActor =
  | "user"
  | "operator"
  | "admin"
  | "founder"
  | "reviewer"
  | "advisor"
  | "client"
  | "system";

// ─── Source ───────────────────────────────────────────────────────────────────

export type LivingActionFeedbackSource =
  | "user_surface"
  | "operator_surface"
  | "living_runner"
  | "manual_review";

// ─── Feedback record ─────────────────────────────────────────────────────────

export type LivingActionFeedback = {
  id: string;
  objectId: string;
  actionId: string;
  domain: string;
  subjectType: string;
  recommendedAt: string;
  lastUpdatedAt: string;
  status: LivingActionFeedbackStatus;
  actor: LivingActionFeedbackActor;
  label: string;
  expectedOutcome: string;
  evidenceRequired: boolean;
  evidenceSubmitted: boolean;
  evidenceVerified: boolean;
  resolutionClaimed: boolean;
  resolutionVerified: boolean;
  notes?: string;
  source: LivingActionFeedbackSource;
};

// ─── Store shape ─────────────────────────────────────────────────────────────

export type LivingActionFeedbackStore = {
  version: number;
  lastRunAt: string;
  feedback: LivingActionFeedback[];
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export type LivingActionFeedbackSummary = {
  generatedAt: string;
  totalActions: number;
  byStatus: Record<LivingActionFeedbackStatus, number>;
  repeatedActions: number;
  resolvedActions: number;
  regressedActions: number;
  completedUnverified: number;
  evidenceRequired: number;
  evidenceSubmitted: number;
  evidenceVerified: number;
  byDomain: Record<string, {
    total: number;
    repeated: number;
    resolved: number;
    regressed: number;
  }>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const LIVING_ACTION_FEEDBACK_STORE_VERSION = 1;
export const LIVING_ACTION_FEEDBACK_REPORT_PATH = "reports/living-action-feedback.json";
export const LIVING_ACTION_FEEDBACK_SUMMARY_PATH = "reports/living-action-feedback-summary.json";

export const LIVING_ACTION_FEEDBACK_STATUS_ORDER: LivingActionFeedbackStatus[] = [
  "blocked",
  "regressed",
  "skipped",
  "expired",
  "recommended",
  "acknowledged",
  "started",
  "evidence_submitted",
  "completed_unverified",
  "verified_complete",
];

export const LIVING_ACTION_FEEDBACK_TERMINAL_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "verified_complete",
  "expired",
]);

export const LIVING_ACTION_FEEDBACK_UNRESOLVED_STATUSES: ReadonlySet<LivingActionFeedbackStatus> = new Set([
  "recommended",
  "acknowledged",
  "started",
  "evidence_submitted",
  "completed_unverified",
  "skipped",
  "blocked",
  "regressed",
]);
