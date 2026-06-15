/**
 * lib/living-intelligence/living-state-object-contract.ts
 *
 * Canonical contract for the Living State Object layer.
 *
 * This is an ADDITIVE layer. It does not replace the existing estate-structure
 * contract (estate-state-contract.ts), which remains the deploy-gating safety
 * layer for product / commercial / publication / route / narrative truth.
 *
 * Where the estate-structure layer answers "is the estate internally consistent
 * and safe to ship?", this layer answers a different, operational question for a
 * single meaningful product event:
 *
 *   1. What is this thing?
 *   2. What state is it in?
 *   3. Why is it in that state?
 *   4. What evidence supports that state?
 *   5. What is missing?
 *   6. What is blocked?
 *   7. Who must act?
 *   8. What is safe to automate?
 *   9. What must not proceed?
 *  10. What should the system remember?
 *
 * Every meaningful product event (order, case, assessment result, report,
 * publication, artifact, session, checkout, content item, workflow) becomes a
 * LivingStateObject. Each product area provides a domain adapter; all adapters
 * emit this same shape. The intelligence lives in the engine, never in the
 * presentation layer.
 */

// ─── Domains & Subjects ──────────────────────────────────────────────────────

export type LivingStateDomain =
  | "boardroom"
  | "executive_reporting"
  | "diagnostic"
  | "assessment"
  | "decision_centre"
  | "strategy_room"
  | "gmi"
  | "retainer_oversight"
  | "professional"
  | "commercial"
  | "fulfilment"
  | "content"
  | "user_session"
  | "system";

export type LivingStateSubjectType =
  | "order"
  | "case"
  | "assessment_result"
  | "diagnostic_result"
  | "report"
  | "publication"
  | "artifact"
  | "session"
  | "user_action"
  | "admin_action"
  | "checkout"
  | "content_item"
  | "workflow"
  | "system_surface";

export type LivingStateStage =
  | "created"
  | "started"
  | "submitted"
  | "paid"
  | "intake_started"
  | "intake_complete"
  | "processing"
  | "draft_generated"
  | "artifact_generated"
  | "artifact_incomplete"
  | "awaiting_evidence"
  | "awaiting_verification"
  | "awaiting_consent"
  | "awaiting_review"
  | "ready_for_review"
  | "approved"
  | "published"
  | "delivered"
  | "blocked"
  | "failed"
  | "archived";

// ─── Blockers ────────────────────────────────────────────────────────────────

export type LivingStateBlockerCode =
  | "missing_artifact"
  | "stub_artifact_only"
  | "missing_evidence"
  | "unverified_evidence"
  | "missing_consent"
  | "pending_consent"
  | "publication_not_allowed"
  | "verification_not_allowed"
  | "missing_repair_path"
  | "missing_operator_action"
  | "status_contradiction"
  | "fulfilment_incomplete"
  | "delivery_claim_without_artifact"
  | "paid_without_fulfilment"
  | "draft_without_review_path"
  | "assessment_without_memory"
  | "diagnostic_without_evidence_posture"
  | "component_without_live_state"
  | "route_missing"
  | "owner_decision_required"
  | "unsafe_to_show_user"
  | "unsafe_to_automate"
  | "source_of_truth_conflict"
  | "lifecycle_conflict"
  | "checkout_permission_conflict";

export type LivingStateSeverity =
  | "blocker"
  | "warning"
  | "governed_tension"
  | "informational";

export type LivingStateActor =
  | "user"
  | "operator"
  | "admin"
  | "founder"
  | "system"
  | "reviewer"
  | "client"
  | "advisor";

export type LivingStateBlocker = {
  code: LivingStateBlockerCode;
  label: string;
  severity: LivingStateSeverity;
  explanation: string;
  evidence: string[];
  affectedItems: string[];
  requiredAction: string;
  actionOwner: LivingStateActor;
  canAutomate: boolean;
  repairRoute?: string;
};

// ─── Next Actions ────────────────────────────────────────────────────────────

export type LivingStateActionType =
  | "verify_evidence"
  | "request_consent"
  | "generate_artifact"
  | "regenerate_artifact"
  | "review_draft"
  | "approve_publication"
  | "block_publication"
  | "open_case"
  | "repair_case"
  | "escalate"
  | "create_missing_route"
  | "write_memory"
  | "request_more_evidence"
  | "show_user_result"
  | "show_operator_warning"
  | "do_not_proceed";

export type LivingStateNextAction = {
  label: string;
  description: string;
  owner: LivingStateActor;
  actionType: LivingStateActionType;
  route?: string;
  safeToAutomate: boolean;
  requiredEvidence: string[];
};

// ─── Evidence / Consent / Artifact / Publication ─────────────────────────────

export type LivingStateEvidenceStatus =
  | "verified"
  | "strongly_indicated"
  | "weakly_indicated"
  | "inferred"
  | "unverified"
  | "contradictory"
  | "needs_human_review";

export type LivingStateEvidence = {
  status: LivingStateEvidenceStatus;
  supportingEvidence: string[];
  missingEvidence: string[];
  cannotInfer: string[];
};

export type LivingStateConsentStatus =
  | "granted"
  | "pending"
  | "missing"
  | "not_required";

export type LivingStateConsent = {
  required: boolean;
  status: LivingStateConsentStatus;
  supportingEvidence: string[];
  missing: string[];
};

export type LivingStateArtifactStatus =
  | "not_required"
  | "missing"
  | "stub_only"
  | "draft"
  | "generated"
  | "incomplete"
  | "awaiting_review"
  | "approved"
  | "delivered";

export type LivingStateArtifact = {
  required: boolean;
  status: LivingStateArtifactStatus;
  artifactIds: string[];
  artifactRoutes: string[];
  missing: string[];
};

export type LivingStatePublication = {
  relevant: boolean;
  allowed: boolean;
  reason: string;
  missing: string[];
};

// ─── Memory ──────────────────────────────────────────────────────────────────

export type LivingStateMemory = {
  firstSeen?: string;
  lastSeen?: string;
  recurrenceCount: number;
  previousStage?: LivingStateStage;
  currentStage: LivingStateStage;
  regressionDetected: boolean;
  resolvedSinceLastRun: boolean;
};

// ─── The Living State Object ─────────────────────────────────────────────────

export type LivingStateObject = {
  id: string;
  domain: LivingStateDomain;
  subjectType: LivingStateSubjectType;
  sourceId?: string;
  productCode?: string;
  title: string;

  currentStage: LivingStateStage;
  statusLabel: string;

  userVisibleSummary: string;
  operatorSummary: string;

  evidence: LivingStateEvidence;
  consent: LivingStateConsent;
  artifact: LivingStateArtifact;
  publication: LivingStatePublication;

  blockers: LivingStateBlocker[];
  nextActions: LivingStateNextAction[];

  memory: LivingStateMemory;

  safeToShowUser: boolean;
  safeToShowOperator: boolean;
  safeToAutomate: boolean;

  sourceOfTruth: string[];
  raw?: Record<string, unknown>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Severity ordering for sorting / triage (higher = more urgent). */
export const LIVING_STATE_SEVERITY_RANK: Record<LivingStateSeverity, number> = {
  blocker: 3,
  warning: 2,
  governed_tension: 1,
  informational: 0,
};

/** Stages in which a subject is not safe to treat as complete/approved. */
export const LIVING_STATE_NON_TERMINAL_STAGES: ReadonlySet<LivingStateStage> =
  new Set<LivingStateStage>([
    "created",
    "started",
    "submitted",
    "paid",
    "intake_started",
    "intake_complete",
    "processing",
    "draft_generated",
    "artifact_incomplete",
    "awaiting_evidence",
    "awaiting_verification",
    "awaiting_consent",
    "awaiting_review",
    "ready_for_review",
    "blocked",
    "failed",
  ]);

/** Decisions the system must never infer on its own. */
export const LIVING_STATE_NEVER_INFER: readonly LivingStateActionType[] = [
  "approve_publication",
  "request_consent",
  "verify_evidence",
] as const;
