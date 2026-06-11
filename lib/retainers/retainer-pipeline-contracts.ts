/**
 * lib/retainers/retainer-pipeline-contracts.ts
 *
 * Pure type contracts for the retainer oversight pipeline.
 * No Prisma imports — safe for Vitest without DB.
 *
 * Pipeline stages map across two models:
 *   Pre-contract  → RetainerReadinessEvaluation.readinessClass
 *   Post-contract → RetainerContract.status + OversightReviewCycle.status
 */

// ─── Pipeline stage ───────────────────────────────────────────────────────────

export type RetainerPipelineStage =
  | "NOT_STARTED"
  | "SIGNAL_DETECTED"
  | "READINESS_CANDIDATE"
  | "REVIEW_READY"
  | "ADMIN_REVIEW"
  | "APPROVED_FOR_OFFER"
  | "OFFER_SENT"
  | "CONTRACT_ACTIVE"
  | "CYCLE_OPEN"
  | "CYCLE_COMPLETED"
  | "RENEWAL_DUE"
  | "PAUSED"
  | "CLOSED";

export const PIPELINE_STAGE_LABELS: Record<RetainerPipelineStage, string> = {
  NOT_STARTED:         "Not Started",
  SIGNAL_DETECTED:     "Signal Detected",
  READINESS_CANDIDATE: "Readiness Candidate",
  REVIEW_READY:        "Review Ready",
  ADMIN_REVIEW:        "Under Admin Review",
  APPROVED_FOR_OFFER:  "Approved — Offer Pending",
  OFFER_SENT:          "Offer Sent",
  CONTRACT_ACTIVE:     "Contract Active",
  CYCLE_OPEN:          "Cycle Open",
  CYCLE_COMPLETED:     "Cycle Completed",
  RENEWAL_DUE:         "Renewal Due",
  PAUSED:              "Paused",
  CLOSED:              "Closed",
};

export const PRE_CONTRACT_STAGES: RetainerPipelineStage[] = [
  "NOT_STARTED", "SIGNAL_DETECTED", "READINESS_CANDIDATE",
  "REVIEW_READY", "ADMIN_REVIEW", "APPROVED_FOR_OFFER", "OFFER_SENT",
];

export const POST_CONTRACT_STAGES: RetainerPipelineStage[] = [
  "CONTRACT_ACTIVE", "CYCLE_OPEN", "CYCLE_COMPLETED", "RENEWAL_DUE", "PAUSED", "CLOSED",
];

export function readinessClassToStage(readinessClass: string): RetainerPipelineStage {
  switch (readinessClass) {
    case "CANDIDATE":    return "READINESS_CANDIDATE";
    case "REVIEW_READY": return "REVIEW_READY";
    case "APPROVED":     return "APPROVED_FOR_OFFER";
    case "NOT_READY":
    default:             return "NOT_STARTED";
  }
}

export function contractStatusToStage(
  contractStatus: string,
  hasOpenCycle: boolean,
): RetainerPipelineStage {
  switch (contractStatus) {
    case "ACTIVE":     return hasOpenCycle ? "CYCLE_OPEN" : "CONTRACT_ACTIVE";
    case "PAUSED":     return "PAUSED";
    case "TERMINATED": return "CLOSED";
    default:           return "CONTRACT_ACTIVE";
  }
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export const TIER_LABELS: Record<string, string> = {
  CORE:          "Core Oversight",
  OPERATIONAL:   "Operator Oversight",
  INSTITUTIONAL: "Institutional Oversight",
};

export const TIER_DESCRIPTIONS: Record<string, string> = {
  CORE:          "Single decision thread. Monthly oversight cycle. Drift scan and action ledger.",
  OPERATIONAL:   "Up to three active decision threads. Monthly cycle with escalation protocol.",
  INSTITUTIONAL: "Unlimited decision threads. Full governance continuity. Board-level brief.",
};

// ─── Readiness intake ─────────────────────────────────────────────────────────

export type ReadinessIntakeInput = {
  organisationType: string;
  decisionPressureFrequency: string;
  activeDecisionsCount: string;
  unresolvedRisks: string;
  priorBoardroomOrderId: string;
  priorProductUse: string;
  monthlyOversightNeed: string;
  urgencyLevel: string;
  governanceContext: string;
  contactEmail: string;
  consentToReview: boolean;
};

export type ReadinessIntakeValidationResult =
  | { valid: true }
  | { valid: false; missing: string[] };

const REQUIRED_INTAKE_FIELDS: Array<keyof ReadinessIntakeInput> = [
  "organisationType",
  "decisionPressureFrequency",
  "activeDecisionsCount",
  "unresolvedRisks",
  "monthlyOversightNeed",
  "urgencyLevel",
  "governanceContext",
  "contactEmail",
  "consentToReview",
];

export function validateReadinessIntake(
  input: Partial<ReadinessIntakeInput>,
): ReadinessIntakeValidationResult {
  const missing: string[] = [];
  for (const field of REQUIRED_INTAKE_FIELDS) {
    const v = input[field];
    if (field === "consentToReview") {
      if (v !== true) missing.push(field);
    } else {
      if (!v || (typeof v === "string" && !v.trim())) missing.push(field);
    }
  }
  if (input.contactEmail && typeof input.contactEmail === "string" && !input.contactEmail.includes("@")) {
    if (!missing.includes("contactEmail")) missing.push("contactEmail");
  }
  return missing.length > 0 ? { valid: false, missing } : { valid: true };
}

// ─── Admin action results ─────────────────────────────────────────────────────

export type AdminActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; reason: string };

// ─── Client-safe status ───────────────────────────────────────────────────────

export type ClientSafeCycleStatus = {
  cycleNumber: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  nextCycleDate: string | null;
  clientHealthStatus: string;
  outcomeSummary: string | null;
  clientNotes: string | null;
};

export type ClientSafeContractStatus = {
  contractId: string;
  tier: string;
  tierLabel: string;
  contractStatus: string;
  pipelineStage: RetainerPipelineStage;
  startDate: string;
  currentCycle: ClientSafeCycleStatus | null;
  nextReviewDue: string | null;
  whatIsBeingMonitored: string[];
  whatIsNotYetVerified: string[];
  outstandingCommitments: string[];
};

// Private fields that must never appear in client-safe output
export const CLIENT_SAFE_BLOCKED_FIELDS = [
  "internalNotes", "evaluatorNotes", "adminApprovedBy",
  "adminNotes", "stripeSubscriptionId",
];

export function assertNoInternalFields(obj: Record<string, unknown>): void {
  for (const field of CLIENT_SAFE_BLOCKED_FIELDS) {
    if (field in obj) {
      throw new Error(`INTERNAL_LEAK: field "${field}" found in client-safe output`);
    }
  }
}
