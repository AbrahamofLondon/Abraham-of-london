/**
 * Case Study Types — Evidence Pipeline
 *
 * Structured types for the automated case study generation system.
 * Every draft is traceable to a verified outcome, contract, and decision.
 * No draft auto-publishes. Human review is required.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY SEAL
// ─────────────────────────────────────────────────────────────────────────────

export type IntegritySealLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type VerificationMethod =
  | "SELF_REPORTED"
  | "BEHAVIOURAL"
  | "DOCUMENTARY"
  | "OPERATOR_CONFIRMED";

export type IntegritySeal = {
  sealLevel: IntegritySealLevel;
  confidence: number;
  verificationMethod: VerificationMethod;
  sourceTraced: boolean;
  dataCompleteness: number;
  publicationAllowed: boolean;
  missingFields: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CASE STUDY DRAFT
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStudyDraftStatus = "draft" | "needs_review" | "approved" | "rejected" | "published";

export type CaseStudyClassification =
  | "authority_failure"
  | "decision_avoidance"
  | "misaligned_reality"
  | "execution_drift"
  | "governance_failure"
  | "structural_contradiction";

export type CaseStudyDraft = {
  id?: string;
  title: string;
  classification: CaseStudyClassification;
  verificationBasis: string;
  confidentialityNotes: string;
  situation: string;
  contradiction: string;
  decision: string;
  intervention: string;
  outcome: string;
  financialImpactGBP: number;
  timeframeDays: number;
  confidence: number;
  sourceOutcomeId: string;
  sourceContractId: string | null;
  sourceDecisionId: string | null;
  recommendedPublicStatus: "publishable" | "needs_review" | "not_publishable";
  integritySeal: IntegritySeal;
  status: CaseStudyDraftStatus;
  publicationAllowed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ELIGIBILITY
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStudyEligibilityResult = {
  eligible: boolean;
  reason?: string;
  missingFields: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION INPUT
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStudyGenerationInput = {
  outcomeId: string;
  anonymisedSector?: string;
  anonymisedOrganisationSize?: string;
  anonymisedRegion?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStudyGenerationResult = {
  ok: true;
  draft: CaseStudyDraft;
} | {
  ok: false;
  reason: string;
  missingFields?: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICATION MAP
// ─────────────────────────────────────────────────────────────────────────────

export const CLASSIFICATION_LABELS: Record<CaseStudyClassification, string> = {
  authority_failure: "Authority Failure — False Ownership Exposed",
  decision_avoidance: "Decision Avoidance — Complexity as Mask",
  misaligned_reality: "Misaligned Reality — Organisational Contradiction",
  execution_drift: "Execution Drift — Commitment Without Action",
  governance_failure: "Governance Failure — Structural Breakdown",
  structural_contradiction: "Structural Contradiction — Systemic Misalignment",
};

export const CLASSIFICATION_DESCRIPTIONS: Record<CaseStudyClassification, string> = {
  authority_failure: "Leadership believed ownership was clear. The team was waiting for direction. Same decision, two realities.",
  decision_avoidance: "A decision framed as complex was in fact avoided. When the option to avoid was removed, resolution came within 24 hours.",
  misaligned_reality: "Leadership scored decision clarity at 82%. The team scored it at 41%. The gap between perception and reality was the problem.",
  execution_drift: "Commitments were made. Actions were not taken. The gap between stated intent and actual behaviour compounded over time.",
  governance_failure: "Decision rights were unclear. Escalation paths were undefined. Structural friction replaced ordered execution.",
  structural_contradiction: "Different parts of the organisation operated from incompatible assumptions. The contradiction was invisible to those inside it.",
};
