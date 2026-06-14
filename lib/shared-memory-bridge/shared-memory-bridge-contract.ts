/**
 * Shared Capability Memory Bridge Contract
 *
 * Governs how product surfaces across Abraham of London may create
 * consent-bound, evidence-safe, exportable case memory that can escalate
 * to enterprise decision spine only with explicit organisation approval.
 *
 * Every product surface may begin a case.
 * Only evidence-governed progression may deepen one.
 * Only enterprise qualification may enter the Decision Spine.
 */

export type SurfaceOrigin =
  | "public_signal"
  | "quick_check"
  | "playbook"
  | "gmi_brief"
  | "professional_console"
  | "enterprise_intake"
  | "decision_centre";

export type SurfaceMemoryMode =
  | "ephemeral"
  | "consented_case_memory"
  | "advisor_mediated_case_memory"
  | "enterprise_review_memory"
  | "enterprise_spine_candidate";

export interface CapabilityMemoryRecord {
  recordId: string;
  caseId: string;
  organisationId: string;
  surfaceOrigin: SurfaceOrigin;
  memoryMode: SurfaceMemoryMode;

  // Evidence references (never raw content)
  sanitizedPreview: string;
  submittedContentHash: string;
  sourceReference: string;
  provenanceHash: string;
  quarantineReference: string | null;
  rawPayloadStored: false; // Always false for normal records

  // Consent state
  consentState: MemoryBridgeConsentState;
  consentedAt?: string;
  consentExpiry?: string;

  // Eligibility
  eligibility: MemoryBridgeEligibility;
  eligibilityReason: string;

  // Authority boundary
  authorityBoundary: {
    recordGrantsAuthority: false;
    authorityDelta: 0;
  };

  // Audit
  createdAt: string;
  createdBy: string;
  auditLockIds: string[];
}

export type MemoryBridgeConsentState =
  | "not_required"
  | "awaiting_consent"
  | "consented"
  | "consent_expired"
  | "consent_withdrawn";

export interface MemoryBridgeEligibility {
  isEligibleForDurableMemory: boolean;
  isEligibleForCaseMemory: boolean;
  isEligibleForEnterpriseReview: boolean;
  isEligibleForSpineCandidate: boolean;
  blockedReasons: string[];
}

export interface MemoryBridgePromotionDecision {
  recordId: string;
  currentMode: SurfaceMemoryMode;
  targetMode: SurfaceMemoryMode;
  allowed: boolean;
  blockedReasons: string[];
  requiredApprovals: string[];
  authorityDelta: 0;
}

export interface CaseMemoryStatus {
  caseId: string;
  organisationId: string;
  totalRecords: number;
  ephemeralRecords: number;
  consentedRecords: number;
  advisorMediatedRecords: number;
  enterpriseReviewRecords: number;
  spineCandidateRecords: number;
  quarantinedRecords: number;
  unknownRiskRecords: number;
}

export interface CaseEscalationReadiness {
  caseId: string;
  organisationId: string;
  canEscalateToEnterprise: boolean;
  missingApprovals: string[];
  quarantinedEvidenceCount: number;
  unknownRiskEvidenceCount: number;
  requiresClientConsent: boolean;
  requiresAdvisorVerification: boolean;
  authorityDelta: 0;
}

export interface SharedCapabilityAuditEntry {
  auditId: string;
  recordId: string;
  caseId: string;
  organisationId: string;
  timestamp: string;
  action:
    | "record_created"
    | "memory_mode_promoted"
    | "promotion_blocked"
    | "consent_granted"
    | "consent_expired"
    | "escalation_requested"
    | "escalation_blocked";
  actor: string;
  actorHash: string;
  sanitizedPreview: string; // No raw content
  reason: string;
  authorityDelta: 0;
}

export const SHARED_MEMORY_BRIDGE_INVARIANTS = {
  EPHEMERAL_DEFAULT: "Public surfaces default to ephemeral memory",
  CONSENT_REQUIRED: "Durable memory requires explicit consent",
  ADVISOR_MEDIATED_REVIEW: "Advisor evidence remains mediated until client review",
  ENTERPRISE_APPROVAL: "Enterprise memory requires explicit organisation approval",
  QUARANTINED_BLOCKED: "Quarantined evidence cannot become durable memory",
  UNKNOWN_BLOCKED: "Unknown risk evidence cannot become durable memory",
  AUTHORITY_ZERO: "Memory bridge operations do not grant authority",
  NO_RAW_STORAGE: "Raw submitted content is never stored in normal records",
  AUDIT_SAFETY: "Audit records contain sanitized preview only, never raw content",
  CROSS_CLIENT_ISOLATION: "Client X evidence cannot contaminate Client Y memory",
};
