/**
 * Decision Spine Contract
 *
 * Defines governed external evidence ingestion for EDOS without:
 * - Surveillance risk (consent-bound, privacy-protected)
 * - Authority escalation (ingestion cannot grant authority)
 * - Data overcollection (redaction-bound, quarantine-safe)
 * - Privacy-invasive memory behaviour (audit-locked ingestion history)
 */

export type EvidenceSourceType =
  | "board_minutes"
  | "meeting_notes"
  | "email_thread"
  | "calendar_event"
  | "jira_ticket"
  | "slack_thread"
  | "crm_record"
  | "document_revision"
  | "manual_upload"
  | "system_generated_record";

export type EvidenceSourceTrustTier =
  | "authoritative_record"
  | "corroborated_operational_record"
  | "single_source_operational_record"
  | "informal_signal"
  | "untrusted_or_ambiguous";

export type IngestionConsentMode =
  | "explicit_source_consent"
  | "org_policy_approved"
  | "connector_enabled"
  | "not_consented";

export type EvidenceQuarantineReason =
  | "personal_or_private_material"
  | "protected_category_suspected"
  | "missing_provenance"
  | "redaction_failed"
  | "trust_tier_insufficient"
  | "ambiguous_classification"
  | "legal_hold"
  | "hr_sensitive"
  | "medical_health_data"
  | "financial_personal_data"
  | "unverified_ai_extraction";

export interface DecisionEvidenceSignal {
  signalId: string;
  caseId?: string;
  organisationId?: string;
  sourceType: EvidenceSourceType;
  sourceTrustTier: EvidenceSourceTrustTier;
  sourceReference: string; // URL, ID, timestamp, or identifier
  sourceIdentity?: string; // Who/what produced this
  ingestionAt: string;
  consentMode: IngestionConsentMode;
  rawContent?: unknown; // Before redaction
  redactedContent?: unknown; // After redaction
  redactionReason?: string;
  isPersonalOrNonDecisionMaterial: boolean;
  requiredHumanReview: boolean;
  extractedCommitments: ExtractedCommitment[];
  extractedContradictions: ExtractedContradiction[];
  extractedMandateChanges: ExtractedMandateChange[];
  missingEvidenceIndicators: string[];
  authorityBoundary: {
    ingestionGrantsAuthority: false;
    positiveAuthorityGranted: false;
  };
}

export interface ExtractedCommitment {
  commitmentId: string;
  actor: string;
  commitment: string;
  deadline?: string;
  dependency?: string;
  sourceSignalId: string;
  confidenceBand: "high" | "medium" | "low";
  requiresCorroboration: boolean;
  contradictionCandidates: string[];
  mandateChangeCandidates: string[];
}

export interface ExtractedContradiction {
  contradictionId: string;
  contradiction: string;
  affectedCommitmentIds: string[];
  evidenceSourceIds: string[];
  severityBand: "critical" | "high" | "medium" | "low";
  requiresVerification: boolean;
  sourceSignalId: string;
}

export interface ExtractedMandateChange {
  mandateChangeId: string;
  change: string;
  affectedCommitments: string[];
  sourceSignalId: string;
  effectiveDate?: string;
  requiresAcknowledgement: boolean;
}

export interface EvidenceIngestionRecord {
  recordId: string;
  signal: DecisionEvidenceSignal;
  promotedToMemoryAt?: string;
  promotedToMemoryEventId?: string;
  linkedToDebtAt?: string;
  linkedToDebtRecordIds?: string[];
  linkedToVerificationAt?: string;
  linkedToFalsificationReviewAt?: string;
  redactionAuditEntry?: string;
  humanReviewRequiredReason?: string;
  humanReviewCompletedAt?: string;
  humanReviewOutcome?: "approved_promote" | "approved_quarantine" | "requested_clarification" | "rejected";
  auditLockIds: string[];
}

export interface EvidenceQuarantineRecord {
  quarantineId: string;
  signalId: string;
  organisationId?: string;
  reason: EvidenceQuarantineReason;
  reasonExplanation: string;
  quarantinedAt: string;
  canPromoteWithApproval: boolean;
  approvalRequiredFrom?: string;
  autoExpireAt?: string;
  promotionAttempts: number;
  lastPromotionAttemptAt?: string;
}

export interface DecisionSpineGovernanceState {
  ingestionEnabled: boolean;
  consentRequired: boolean;
  redactionRequired: boolean;
  humanReviewRequired: boolean;
  authorisedSourceTypes: EvidenceSourceType[];
  blockedSourceTypes: EvidenceSourceType[];
  blockedCategories: string[]; // "personal", "hr", "medical", "legal", etc.
  trustTierThreshold: EvidenceSourceTrustTier;
  incidentalRedactionAllowed: boolean;
  failClosedOnClassificationUncertainty: boolean;
  positiveAuthorityGrantedByIngestion: false;
  authorityRestorationByIngestion: false;
}

/**
 * Non-negotiable Decision Spine Invariants
 */
export const DECISION_SPINE_INVARIANTS = {
  NO_INGESTION_WITHOUT_CONSENT:
    "No source evidence may be ingested without explicit consent or org-policy approval",
  NO_PERSONAL_MATERIAL_IN_MEMORY:
    "Personal, private, or protected-category material cannot be promoted into governed memory",
  INFORMAL_SIGNALS_REQUIRE_CORROBORATION:
    "Slack/chat fragments cannot create decision debt without corroboration from authoritative sources",
  NO_AUTHORITY_ESCALATION:
    "Evidence ingestion cannot grant positive authority; remains 0",
  NO_AUTONOMOUS_ACTION:
    "Ingestion cannot trigger autonomous actions; always requires human review or gate passage",
  AMBIGUOUS_EVIDENCE_QUARANTINED:
    "Evidence with uncertain classification is quarantined until explicitly approved",
  REDACTION_FAILS_CLOSED:
    "If redaction cannot classify material safely, ingestion is rejected; do not store ambiguous content",
  PROVENANCE_REQUIRED:
    "Evidence source identity and chain of custody must be traceable",
  HUMAN_REVIEW_PROTECTED_CATEGORIES:
    "Legal, HR, medical, financial personal data must be reviewed before any promotion",
  AI_EXTRACTION_NOT_AUTHORITATIVE:
    "System-generated or AI-extracted records require source-evidence linkage; cannot stand alone as authoritative",
  INGESTION_HISTORY_AUDITED:
    "All ingestion decisions (accept, reject, redact, quarantine) are audit-locked",
  TOPOLOGY_BOUNDARY_PRESERVED:
    "Evidence ingestion does not create exportable derived topology; Phase 5 boundaries maintained",
};
