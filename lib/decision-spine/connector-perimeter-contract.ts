/**
 * Connector Perimeter Contract
 *
 * Defines the boundary for external connectors (Slack, Jira) to ingest
 * decision evidence without surveillance, privacy violation, or authority escalation.
 *
 * Core doctrine:
 * - EDOS does not monitor people
 * - EDOS governs decision evidence
 * - All connectors are consent-bound and privacy-protected
 * - All outputs are sanitized (no raw payloads, no plaintext identifiers)
 * - All rejections are audit-safe (not null/silent)
 */

import type {
  EvidenceSourceType,
  EvidenceSourceTrustTier,
} from "./decision-spine-contract";

export type ConnectorPlatform = "slack" | "jira";

export interface ConnectorRegistration {
  connectorId: string;
  platform: ConnectorPlatform;
  organisationId: string;
  registeredAt: string;
  isActive: boolean;
  consentScopes: ConnectorConsentScope[];
  signatureSecret?: string; // Placeholder; never log
  lastActivityAt?: string;
}

export interface ConnectorConsentScope {
  organisationId: string;
  scopeId: string;
  platform: ConnectorPlatform;
  allowedChannelIds?: string[]; // Slack
  allowedProjectKeys?: string[]; // Jira
  allowedEventTypes: string[];
  retentionClass: "governance" | "compliance" | "audit";
  approvedAt: string;
  approvedBy: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface ConnectorEventEnvelope {
  envelopeId: string;
  platform: ConnectorPlatform;
  eventType: string;
  sourceTimestamp: string;
  receivedAt: string;
  organisationId: string;
  payload: unknown; // Platform-specific
}

export interface SanitizedConnectorEvidence {
  signalId: string;
  connectorId: string;
  platform: ConnectorPlatform;
  organisationId: string;
  sourceType: EvidenceSourceType;
  trustTier: EvidenceSourceTrustTier;
  sourceTimestamp: string;
  sanitizedContent: unknown; // No user IDs, no credentials, no personal data
  redactionSummary: {
    redactionsApplied: string[]; // ["emails", "credentials", "user_ids"]
    hasProtectedCategoryRisk: boolean;
    hasLegalHrMedicalRisk: boolean;
    highRiskDetected: boolean;
  };
  evidenceReference: string; // Non-PII reference to source (e.g., "slack#channel-name#timestamp")
  sourceHash: string; // Hash of source URI
  provenanceHash: string; // Hash of provenance metadata
  actorHash: string; // Hash of actor ID (not plaintext)
  payloadSizeBytes: number;
  signatureVerified: boolean;
  idempotencyKey: string;
  canPromoteToMemory: boolean;
  canCreateDecisionDebt: boolean;
  requiresHumanReview: boolean;
  authorityBoundary: {
    connectorGrantsAuthority: false;
    positiveAuthorityGranted: false;
  };
}

export interface ConnectorVerificationResult {
  isValid: boolean;
  passed: string[];
  failed: string[];
  reason?: string;
  shouldReject: boolean;
  shouldQuarantine: boolean;
  quarantineReason?: string;
}

export type ConnectorRejectionReason =
  | "unregistered_connector"
  | "inactive_connector"
  | "invalid_signature"
  | "stale_timestamp"
  | "oversized_payload"
  | "unapproved_event_type"
  | "unapproved_scope"
  | "cross_tenant_source"
  | "replay_duplicate"
  | "missing_required_field"
  | "invalid_source_type";

export interface ConnectorQuarantineRecord {
  quarantineId: string;
  connectorId: string;
  organisationId: string;
  eventEnvelopeId: string;
  reason: string;
  quarantinedAt: string;
  canPromoteWithApproval: boolean;
  auditLockIds: string[];
}

export interface ConnectorProcessingOutcome {
  processingId: string;
  envelopeId: string;
  status: "accepted" | "rejected" | "quarantined";
  evidence?: SanitizedConnectorEvidence;
  rejection?: {
    reason: ConnectorRejectionReason;
    explanation: string;
  };
  quarantine?: ConnectorQuarantineRecord;
  auditLockIds: string[];
}

export interface ConnectorActorReference {
  actorHash: string; // Never plaintext user ID
  actorType: "user" | "bot" | "system";
  sourceReference: string; // Non-PII reference
  anonymized: true;
}

export interface ConnectorPayloadBoundary {
  maxPayloadBytes: number; // Reject oversized
  allowedPlatforms: ConnectorPlatform[];
  disallowedEventTypes: string[];
  requiresSignatureVerification: boolean;
  requiresTimestampVerification: boolean;
  timestampToleranceSeconds: number;
}

/**
 * Connector Perimeter Invariants
 */
export const CONNECTOR_PERIMETER_INVARIANTS = {
  PHASE_6_CANONICAL_SOURCES:
    "Only Phase 6 canonical source types (slack_thread, jira_ticket, etc.) allowed",
  PHASE_6_CANONICAL_TRUST:
    "Only Phase 6 trust tiers (authoritative_record through untrusted_or_ambiguous) allowed",
  NO_RAW_PAYLOADS:
    "Connector adapters never persist rawContent; use sanitizedContent only",
  ACTOR_HASHING:
    "Actor IDs must be hashed; never logged in plaintext",
  CONSENT_REQUIRED:
    "Unregistered, inactive, or out-of-scope connectors reject",
  SIGNATURE_VERIFICATION:
    "Invalid or missing signatures reject (or placeholder verification fails)",
  TIMESTAMP_TOLERANCE:
    "Stale events reject (configurable tolerance window)",
  PAYLOAD_SIZE_LIMIT:
    "Oversized payloads reject to prevent DoS",
  IDEMPOTENCY:
    "Replay/duplicate events detected via idempotency key; rejects or deduplicates",
  SLACK_DEFAULT:
    "Slack events default to slack_thread + informal_signal (cannot create debt alone)",
  JIRA_DEFAULT:
    "Jira events default to jira_ticket + single_source_operational_record (cannot override authoritative)",
  REDACTION_REQUIRED:
    "PII, credentials, tokens, protected categories must be redacted before promotion",
  REDACTION_FAILS_CLOSED:
    "If redaction fails, reject storage (do not fallback to raw)",
  AUTHORITY_ZERO:
    "No connector event can grant positive authority; remains 0",
  NO_AUTONOMOUS_ACTION:
    "Connectors cannot trigger autonomous decisions",
  QUARANTINE_SAFE:
    "Rejections and quarantines are audit-locked, not null/silent",
};

/**
 * Default payload boundaries for known platforms
 */
export const CONNECTOR_PAYLOAD_BOUNDARIES: Record<ConnectorPlatform, ConnectorPayloadBoundary> = {
  slack: {
    maxPayloadBytes: 1048576, // 1 MB
    allowedPlatforms: ["slack"],
    disallowedEventTypes: [
      "app_mention",
      "member_joined_channel",
      "member_left_channel",
    ],
    requiresSignatureVerification: true,
    requiresTimestampVerification: true,
    timestampToleranceSeconds: 300, // 5 minutes
  },
  jira: {
    maxPayloadBytes: 2097152, // 2 MB
    allowedPlatforms: ["jira"],
    disallowedEventTypes: [
      "jira:issue_created_timestamp_verification",
      "jira:worklog_created",
    ],
    requiresSignatureVerification: true,
    requiresTimestampVerification: true,
    timestampToleranceSeconds: 300, // 5 minutes
  },
};
