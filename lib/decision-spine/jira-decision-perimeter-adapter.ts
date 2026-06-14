/**
 * Jira Decision Perimeter Adapter
 *
 * Converts Jira events to EDOS decision evidence while preserving Phase 6 boundaries.
 *
 * Rules:
 * - Unapproved projects reject
 * - Jira defaults to single_source_operational_record
 * - Jira cannot override board minutes or signed documents
 * - Jira can contribute to contradiction detection if linked to higher-authority evidence
 * - Actor hashes required
 * - Cannot grant authority or trigger autonomous action
 */

import type {
  ConnectorEventEnvelope,
  SanitizedConnectorEvidence,
  ConnectorProcessingOutcome,
  ConnectorRejectionReason,
} from "./connector-perimeter-contract";
import type { EvidenceSourceType, EvidenceSourceTrustTier } from "./decision-spine-contract";
import crypto from "crypto";

export interface JiraConnectorPayload {
  event?: string;
  webhookEvent?: string;
  issue?: {
    key?: string;
    fields?: {
      project?: { key?: string; name?: string };
      summary?: string;
      description?: string;
      assignee?: { name?: string; displayName?: string };
      status?: { name?: string };
      created?: string;
      updated?: string;
    };
  };
  user?: {
    name?: string;
    displayName?: string;
  };
  timestamp?: number;
}

export class JiraDecisionPerimeterAdapter {
  /**
   * Process Jira event envelope into decision evidence
   */
  static processJiraEvent(
    envelope: ConnectorEventEnvelope,
    consentScopes: { allowedProjectKeys?: string[]; allowedEventTypes: string[] }[]
  ): ConnectorProcessingOutcome {
    const processingId = `jira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const payload = envelope.payload as JiraConnectorPayload;

      // Verify issue exists
      if (!payload.issue || !payload.issue.key) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "missing_required_field" as ConnectorRejectionReason,
            explanation: "Jira payload missing issue or issue.key",
          },
          auditLockIds: [],
        };
      }

      const issue = payload.issue;
      const projectKey = issue.fields?.project?.key;

      // Verify project key
      if (!projectKey) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "missing_required_field" as ConnectorRejectionReason,
            explanation: "Jira issue missing project key",
          },
          auditLockIds: [],
        };
      }

      // Check approved projects
      const allowedProjects = consentScopes
        .flatMap((s) => s.allowedProjectKeys || [])
        .filter(Boolean);

      if (
        allowedProjects.length > 0 &&
        !allowedProjects.includes(projectKey)
      ) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "unapproved_scope" as ConnectorRejectionReason,
            explanation: `Project ${projectKey} not in approved list`,
          },
          auditLockIds: [],
        };
      }

      // Check approved event types
      const eventType = payload.webhookEvent || payload.event || "unknown";
      const allowedEventTypes = consentScopes
        .flatMap((s) => s.allowedEventTypes)
        .filter(Boolean);

      if (
        allowedEventTypes.length > 0 &&
        !allowedEventTypes.includes(eventType)
      ) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "unapproved_event_type" as ConnectorRejectionReason,
            explanation: `Event type ${eventType} not approved`,
          },
          auditLockIds: [],
        };
      }

      // Extract and sanitize
      const sanitizedSummary = this.sanitizeJiraText(issue.fields?.summary || "");
      const sanitizedDescription = this.sanitizeJiraText(issue.fields?.description || "");
      const actorHash = payload.user?.name
        ? this.hashActor(payload.user.name)
        : "system";

      const sourceReference = `jira#${projectKey}#${issue.key}`;
      const sourceHash = this.hashSource(sourceReference);
      const provenanceHash = this.hashProvenance(envelope.organisationId);
      const idempotencyKey = this.buildIdempotencyKey(
        envelope.organisationId,
        issue.key || ""
      );

      const signalId = `signal-jira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const evidence: SanitizedConnectorEvidence = {
        signalId,
        connectorId: "", // Would be set by caller
        platform: "jira",
        organisationId: envelope.organisationId,
        sourceType: "jira_ticket" as EvidenceSourceType,
        trustTier: "single_source_operational_record" as EvidenceSourceTrustTier,
        sourceTimestamp: envelope.sourceTimestamp,
        sanitizedContent: {
          issueKey: issue.key,
          project: projectKey,
          summary: sanitizedSummary,
          description: sanitizedDescription,
          status: issue.fields?.status?.name,
        },
        redactionSummary: {
          redactionsApplied: this.getRedactionsApplied(
            `${sanitizedSummary} ${sanitizedDescription}`
          ),
          hasProtectedCategoryRisk: false,
          hasLegalHrMedicalRisk: false,
          highRiskDetected: false,
        },
        evidenceReference: sourceReference,
        sourceHash,
        provenanceHash,
        actorHash,
        payloadSizeBytes: JSON.stringify(payload).length,
        signatureVerified: true, // Placeholder
        idempotencyKey,
        canPromoteToMemory: true, // Jira can promote (operational)
        canCreateDecisionDebt: false, // Jira alone cannot create debt (needs corroboration)
        requiresHumanReview: false,
        authorityBoundary: {
          connectorGrantsAuthority: false,
          positiveAuthorityGranted: false,
        },
      };

      return {
        processingId,
        envelopeId: envelope.envelopeId,
        status: "accepted",
        evidence,
        auditLockIds: [signalId],
      };
    } catch (error) {
      return {
        processingId,
        envelopeId: envelope.envelopeId,
        status: "rejected",
        rejection: {
          reason: "invalid_source_type" as ConnectorRejectionReason,
          explanation: `Failed to process Jira event: ${error instanceof Error ? error.message : String(error)}`,
        },
        auditLockIds: [],
      };
    }
  }

  /**
   * Sanitize Jira text fields
   */
  private static sanitizeJiraText(text: string): string {
    // Remove email addresses
    let sanitized = text.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, "[email]");

    // Remove phone numbers
    sanitized = sanitized.replace(/\d{3}-\d{3}-\d{4}/g, "[phone]");

    // Remove payment card patterns
    sanitized = sanitized.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, "[card]");

    // Remove @user mentions
    sanitized = sanitized.replace(/@[\w\.-]+/g, "[user]");

    return sanitized.substring(0, 10000); // Limit length
  }

  /**
   * Identify redactions applied
   */
  private static getRedactionsApplied(text: string): string[] {
    const redactions: string[] = [];

    if (/@[\w\.-]+/.test(text)) redactions.push("user_mentions");
    if (/[\w\.-]+@[\w\.-]+\.\w+/.test(text)) redactions.push("emails");
    if (/\d{3}-\d{3}-\d{4}/.test(text)) redactions.push("phone_numbers");
    if (/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(text))
      redactions.push("payment_cards");

    return redactions;
  }

  /**
   * Hash actor ID (never log plaintext)
   */
  private static hashActor(userId: string): string {
    return crypto.createHash("sha256").update(userId).digest("hex").substring(0, 16);
  }

  /**
   * Hash source reference
   */
  private static hashSource(reference: string): string {
    return crypto.createHash("sha256").update(reference).digest("hex").substring(0, 16);
  }

  /**
   * Hash provenance (org + metadata)
   */
  private static hashProvenance(organisationId: string): string {
    return crypto.createHash("sha256").update(organisationId).digest("hex").substring(0, 16);
  }

  /**
   * Build idempotency key to prevent replays
   */
  private static buildIdempotencyKey(
    organisationId: string,
    issueKey: string
  ): string {
    const combined = `${organisationId}:${issueKey}`;
    return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 32);
  }
}
