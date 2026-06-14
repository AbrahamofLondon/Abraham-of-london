/**
 * Professional Console Contract
 *
 * Governs professional advisor engagement with the EDOS boundary.
 *
 * Advisors can bring evidence to the gate.
 * They cannot become the gate.
 */

export type AdvisorVerificationStatus =
  | "verified"
  | "unverified"
  | "suspended";

export type AdvisorLicenseTier =
  | "junior"
  | "senior"
  | "principal";

export interface ProfessionalAdvisor {
  advisorId: string;
  name: string;
  email: string;
  licenseId: string;
  licenseTier: AdvisorLicenseTier;
  verificationStatus: AdvisorVerificationStatus;
  verifiedAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  privileges: AdvisorPrivilege[];
  createdAt: string;
}

export type EngagementStatus =
  | "active"
  | "suspended"
  | "concluded";

export interface ProfessionalEngagement {
  engagementId: string;
  advisorId: string;
  organisationId: string;
  clientName: string;
  caseId: string;
  status: EngagementStatus;
  startedAt: string;
  suspendedAt?: string;
  concludedAt?: string;
  tenantId: string;
  tenantBoundary: {
    organisationBoundaryEnforced: true;
    advisorCannotMixClients: true;
  };
}

export type AdvisorPrivilege =
  | "view_engagement"
  | "run_instruments"
  | "submit_evidence_for_review"
  | "compile_brief"
  | "request_enterprise_escalation";

export interface AdvisorEvidenceSubmission {
  submissionId: string;
  engagementId: string;
  advisorId: string;
  organisationId: string;
  caseId: string;
  timestamp: string;

  // Evidence references (never raw)
  sanitizedPreview: string;
  submittedContentHash: string;
  sourceReference: string;
  provenanceHash: string;
  shieldDecisionReference: string;
  ledgerEntryId?: string;
  quarantineReference: string | null;
  rawPayloadStored: false;

  // Shield status
  shieldRiskLevel: "clean" | "quarantined" | "unknown";
  threatsDetected: number;

  // Review status
  clientReviewRequired: boolean;
  clientReviewDecision?: AdvisorEvidenceReviewDecision;
  clientReviewedAt?: string;

  // Authority boundary
  authorityBoundary: {
    submissionGrantsAuthority: false;
    authorityDelta: 0;
  };
}

export interface AdvisorEvidenceReviewDecision {
  decisionId: string;
  submissionId: string;
  clientApproved: boolean;
  approvedAt: string;
  approvalReason?: string;
  rejectionReason?: string;
  authorityDelta: 0;
}

export interface AdvisorCompiledBrief {
  briefId: string;
  engagementId: string;
  advisorId: string;
  organisationId: string;
  caseId: string;
  compiledAt: string;

  // Brief sections
  likelyObjections: string[];
  evidenceWeaknesses: string[];
  decisionRisks: string[];
  tradeOffs: string[];
  nextAdmissibleMoves: string[];
  escalationReadiness: string;
  ledgerIntegrityStatus: "verified" | "broken" | "unknown";
  unresolvedQuarantineCount: number;
  advisorMediatedEvidenceNotice: string;

  // Disclosures
  disclosesAdvisorMediation: true;
  disclosesLedgerState: true;
  claimsLegalValidity: false;
  claimsCertainty: false;

  // Authority boundary
  authorityBoundary: {
    briefGrantsAuthority: false;
    authorityDelta: 0;
  };
}

export type EnterpriseEscalationStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "pending_client_consent"
  | "pending_ledger_verification";

export interface EnterpriseEscalationRequest {
  escalationId: string;
  engagementId: string;
  advisorId: string;
  organisationId: string;
  caseId: string;
  requestedAt: string;
  status: EnterpriseEscalationStatus;

  // Readiness checks
  clientConsentObtained: boolean;
  advisorVerified: boolean;
  engagementActive: boolean;
  ledgerStateVerified: boolean;
  minimumEvidencePresent: boolean;
  noUnresolvedHighRiskThreats: boolean;

  // Cannot activate
  activatesLiveConnectors: false;
  createsRetainerAccess: false;
  grantsAdvisorAuthority: false;
  mutatesToEnterpriseMemoryDirectly: false;

  // Authority boundary
  authorityBoundary: {
    escalationGrantsAuthority: false;
    authorityDelta: 0;
  };

  reviewedAt?: string;
  reviewReason?: string;
}

export interface ProfessionalConsoleAuditEntry {
  auditId: string;
  engagementId: string;
  advisorId: string;
  organisationId: string;
  timestamp: string;
  action:
    | "advisor_created"
    | "advisor_verified"
    | "advisor_suspended"
    | "engagement_created"
    | "engagement_active"
    | "engagement_suspended"
    | "engagement_concluded"
    | "evidence_submitted"
    | "evidence_reviewed"
    | "brief_compiled"
    | "escalation_requested"
    | "escalation_approved"
    | "escalation_rejected"
    | "boundary_violation_attempted";
  actor: string;
  actorHash: string;
  sanitizedPreview: string; // No raw content
  reason: string;
  authorityDelta: 0;
}

export const PROFESSIONAL_CONSOLE_INVARIANTS = {
  UNVERIFIED_CANNOT_ENGAGE: "Unverified advisors cannot create engagements",
  SUSPENDED_CANNOT_ENGAGE: "Suspended advisors cannot create engagements",
  NO_LEDGER_MUTATION: "Advisors cannot directly mutate enterprise ledgers",
  NO_AUTHORITY_CREATION: "Advisor operations cannot create authority",
  EVIDENCE_CORROBORATION: "Advisor evidence cannot become authoritative without client-approved corroboration",
  ONE_ENGAGEMENT_RULE: "One engagement = one advisor + one client org + one engagementId",
  CROSS_CLIENT_ISOLATION: "Advisor A cannot access Advisor B engagement; cannot mix Client X into Client Y",
  AUDIT_SAFETY: "Professional console audit records contain sanitized preview only, never raw content",
  AUTHORITY_ZERO: "Authority delta remains 0 across all professional console flows",
};
