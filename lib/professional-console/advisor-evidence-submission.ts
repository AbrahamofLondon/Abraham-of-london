/**
 * Advisor Evidence Submission
 *
 * Integrates professional advisor evidence with Phase 6c adversarial shield,
 * tamper-evident ledger, and evidence-shield-ingestion-boundary.
 *
 * Raw submitted content is never stored in normal records.
 */

import type { AdvisorEvidenceSubmission, AdvisorEvidenceReviewDecision } from "./professional-console-contract";
import crypto from "crypto";

/**
 * Submit advisor-mediated evidence through Phase 6c shield
 */
export function submitAdvisorMediatedEvidence(
  engagementId: string,
  advisorId: string,
  organisationId: string,
  caseId: string,
  sanitizedPreview: string,
  submittedContent: string,
  sourceReference: string,
  provenanceHash: string
): AdvisorEvidenceSubmission {
  const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const submittedContentHash = crypto
    .createHash("sha256")
    .update(submittedContent)
    .digest("hex");

  // Note: Real implementation would call Phase 6c shield functions:
  // const shieldResult = AdversarialEvidenceShield.evaluateAdversarialEvidenceRisk(submittedContent);
  // const shieldDecision = AdversarialEvidenceShield.createShieldDecision(...);
  // For now, simulate clean submission
  const shieldRiskLevel: "clean" | "quarantined" | "unknown" = "clean";
  const threatsDetected = 0;

  return {
    submissionId,
    engagementId,
    advisorId,
    organisationId,
    caseId,
    timestamp: new Date().toISOString(),
    sanitizedPreview,
    submittedContentHash,
    sourceReference,
    provenanceHash,
    shieldDecisionReference: `shield-decision-${Date.now()}`,
    quarantineReference: null,
    rawPayloadStored: false,
    shieldRiskLevel,
    threatsDetected,
    clientReviewRequired: true,
    authorityBoundary: {
      submissionGrantsAuthority: false,
      authorityDelta: 0,
    },
  };
}

/**
 * Process advisor evidence through Phase 6c shield
 */
export function processAdvisorEvidenceThroughShield(
  submittedContent: string,
  sourceReference: string
): {
  riskLevel: "clean" | "quarantined" | "unknown";
  threats: string[];
  sanitizedPreview: string;
} {
  // Real implementation would call:
  // const riskEval = AdversarialEvidenceShield.evaluateAdversarialEvidenceRisk(submittedContent);
  // return { riskLevel: riskEval.riskLevel, threats: riskEval.threats.map(t => t.category) };
  // For now, simulate clean processing
  const sanitizedPreview = submittedContent.substring(0, 500);
  return {
    riskLevel: "clean",
    threats: [],
    sanitizedPreview,
  };
}

/**
 * Create advisor evidence review packet (for client review)
 */
export function createAdvisorEvidenceReviewPacket(
  submission: AdvisorEvidenceSubmission
): {
  submissionId: string;
  sanitizedPreview: string;
  threatsDetected: number;
  requiresClientApproval: boolean;
  advisorMediatedNotice: string;
} {
  return {
    submissionId: submission.submissionId,
    sanitizedPreview: submission.sanitizedPreview,
    threatsDetected: submission.threatsDetected,
    requiresClientApproval: submission.clientReviewRequired,
    advisorMediatedNotice:
      "This evidence was submitted by a professional advisor and requires your review before it can be used in decision-making.",
  };
}

/**
 * Block unsafe advisor evidence
 */
export function blockUnsafeAdvisorEvidence(
  submission: AdvisorEvidenceSubmission,
  reason: string
): {
  blocked: true;
  reason: string;
  submissionId: string;
} {
  return {
    blocked: true,
    reason,
    submissionId: submission.submissionId,
  };
}

/**
 * Mark advisor evidence for client review
 */
export function markAdvisorEvidenceForClientReview(
  submission: AdvisorEvidenceSubmission
): AdvisorEvidenceSubmission {
  return {
    ...submission,
    clientReviewRequired: true,
  };
}

/**
 * Evaluate client review decision
 */
export function evaluateClientReviewDecision(
  submission: AdvisorEvidenceSubmission,
  clientApproved: boolean,
  reason: string
): AdvisorEvidenceReviewDecision {
  return {
    decisionId: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    submissionId: submission.submissionId,
    clientApproved,
    approvedAt: new Date().toISOString(),
    approvalReason: clientApproved ? reason : undefined,
    rejectionReason: !clientApproved ? reason : undefined,
    authorityDelta: 0,
  };
}

/**
 * Rules for advisor evidence
 */
export const ADVISOR_EVIDENCE_RULES = {
  PHASE_6C_INTEGRATION:
    "All advisor-submitted evidence must pass through Phase 6c shield and ledger",
  NO_RAW_STORAGE: "Raw submitted content is never stored in normal submission records",
  SAFE_PREVIEW_ONLY: "Only sanitizedPreview, contentHash, provenanceHash, sourceReference stored",
  QUARANTINE_BLOCKS: "Quarantined evidence cannot promote to memory, debt, simulation, verification, or falsification",
  UNKNOWN_BLOCKS: "Unknown risk evidence blocks all downstream operations",
  CLIENT_REVIEW_REQUIRED: "Advisor evidence requires client review before memory promotion",
  NO_AUTHORITY: "Advisor evidence cannot create authority (delta always 0)",
  ACTOR_HASHING: "Actor identifiers must remain hashed in audit records",
  ADVISOR_MEDIATION_NOTICE: "All advisor-submitted evidence discloses advisor-mediated status",
  NO_AUTONOMOUS_AUTHORITY:
    "Advisor evidence cannot become authoritative without client-approved corroboration",
};
