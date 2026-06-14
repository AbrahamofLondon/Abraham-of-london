/**
 * Enterprise Escalation Bridge
 *
 * Guards against unsafe escalation to enterprise decision spine.
 * Escalation cannot activate connectors, create retainer access, or grant authority.
 */

import type { EnterpriseEscalationRequest } from "./professional-console-contract";

/**
 * Request enterprise escalation
 */
export function requestEnterpriseEscalation(
  engagementId: string,
  advisorId: string,
  organisationId: string,
  caseId: string
): EnterpriseEscalationRequest {
  return {
    escalationId: `escalation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    engagementId,
    advisorId,
    organisationId,
    caseId,
    requestedAt: new Date().toISOString(),
    status: "pending_client_consent",
    clientConsentObtained: false,
    advisorVerified: false,
    engagementActive: false,
    ledgerStateVerified: false,
    minimumEvidencePresent: false,
    noUnresolvedHighRiskThreats: false,
    activatesLiveConnectors: false,
    createsRetainerAccess: false,
    grantsAdvisorAuthority: false,
    mutatesToEnterpriseMemoryDirectly: false,
    authorityBoundary: {
      escalationGrantsAuthority: false,
      authorityDelta: 0,
    },
  };
}

/**
 * Evaluate if escalation is ready
 */
export function evaluateEnterpriseEscalationReadiness(
  clientConsent: boolean,
  advisorVerified: boolean,
  engagementActive: boolean,
  ledgerStateVerified: boolean,
  minimumEvidencePresent: boolean,
  noHighRiskThreats: boolean
): {
  ready: boolean;
  blockedReasons: string[];
} {
  const blockedReasons: string[] = [];

  if (!clientConsent) {
    blockedReasons.push("Client organisation consent is required");
  }

  if (!advisorVerified) {
    blockedReasons.push("Advisor must be verified");
  }

  if (!engagementActive) {
    blockedReasons.push("Engagement must be active");
  }

  if (!ledgerStateVerified) {
    blockedReasons.push("Ledger state must be verified or reviewable");
  }

  if (!minimumEvidencePresent) {
    blockedReasons.push("Minimum evidence threshold not met");
  }

  if (!noHighRiskThreats) {
    blockedReasons.push("Unresolved high-risk threats must be cleared");
  }

  return {
    ready: blockedReasons.length === 0,
    blockedReasons,
  };
}

/**
 * Block escalation without client consent
 */
export function blockEscalationWithoutClientConsent(
  escalation: EnterpriseEscalationRequest
): EnterpriseEscalationRequest {
  return {
    ...escalation,
    status: "pending_client_consent",
  };
}

/**
 * Block escalation with broken ledger
 */
export function blockEscalationWithBrokenLedger(
  escalation: EnterpriseEscalationRequest
): EnterpriseEscalationRequest {
  return {
    ...escalation,
    status: "rejected",
    ledgerStateVerified: false,
  };
}

/**
 * Block escalation with unknown ledger
 */
export function blockEscalationWithUnknownLedger(
  escalation: EnterpriseEscalationRequest
): EnterpriseEscalationRequest {
  return {
    ...escalation,
    status: "pending_ledger_verification",
    ledgerStateVerified: false,
  };
}

/**
 * Block escalation with unresolved threats
 */
export function blockEscalationWithUnresolvedThreats(
  escalation: EnterpriseEscalationRequest,
  threatCount: number
): EnterpriseEscalationRequest {
  return {
    ...escalation,
    status: "rejected",
    noUnresolvedHighRiskThreats: false,
  };
}

/**
 * Block escalation without minimum evidence
 */
export function blockEscalationWithoutMinimumEvidence(
  escalation: EnterpriseEscalationRequest
): EnterpriseEscalationRequest {
  return {
    ...escalation,
    status: "rejected",
    minimumEvidencePresent: false,
  };
}

/**
 * Create enterprise escalation audit entry
 */
export function createEnterpriseEscalationAuditEntry(
  escalationId: string,
  engagementId: string,
  advisorId: string,
  organisationId: string,
  action: string,
  reason: string
): {
  auditId: string;
  escalationId: string;
  engagementId: string;
  advisorId: string;
  organisationId: string;
  timestamp: string;
  action: string;
  reason: string;
  authorityDelta: 0;
} {
  return {
    auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    escalationId,
    engagementId,
    advisorId,
    organisationId,
    timestamp: new Date().toISOString(),
    action,
    reason,
    authorityDelta: 0,
  };
}

export const ENTERPRISE_ESCALATION_RULES = {
  CLIENT_CONSENT_MANDATORY: "Enterprise escalation requires client organisation consent",
  ADVISOR_VERIFICATION: "Escalation requires verified advisor (no unverified/suspended advisors)",
  ENGAGEMENT_ACTIVE: "Escalation requires active engagement",
  LEDGER_VERIFICATION: "Escalation requires verified or reviewable ledger state",
  NO_CONNECTOR_ACTIVATION: "Escalation cannot activate live connectors",
  NO_RETAINER_ACCESS: "Escalation cannot create retainer access",
  NO_AUTHORITY_GRANT: "Escalation cannot grant advisor authority",
  NO_DIRECT_MUTATION: "Escalation cannot mutate enterprise memory directly",
  AUTHORITY_ZERO: "Authority delta remains 0 across escalation flows",
  THREAT_RESOLUTION: "Unresolved high-risk threats block escalation",
};
