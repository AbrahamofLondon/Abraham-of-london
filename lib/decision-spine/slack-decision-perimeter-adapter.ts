/**
 * Slack Decision Perimeter Adapter
 *
 * Converts Slack events to EDOS decision evidence while preserving Phase 6 boundaries.
 *
 * Rules:
 * - DMs reject
 * - Unapproved channels reject
 * - Slack defaults to informal_signal (cannot create debt alone)
 * - Actor IDs hashed
 * - User identifiers never logged plaintext
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

export interface SlackConnectorPayload {
  type: string;
  event?: {
    type: string;
    channel?: string;
    thread_ts?: string;
    ts?: string;
    user?: string;
    text?: string;
  };
  team_id?: string;
  api_app_id?: string;
  event_id?: string;
  event_time?: number;
}

export class SlackDecisionPerimeterAdapter {
  /**
   * Process Slack event envelope into decision evidence
   */
  static processSlackEvent(
    envelope: ConnectorEventEnvelope,
    consentScopes: { allowedChannelIds?: string[]; allowedEventTypes: string[] }[]
  ): ConnectorProcessingOutcome {
    const processingId = `slack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const payload = envelope.payload as SlackConnectorPayload;

      // Verify event structure
      if (!payload.event) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "missing_required_field" as ConnectorRejectionReason,
            explanation: "Slack payload missing event field",
          },
          auditLockIds: [],
        };
      }

      const event = payload.event;

      // Reject DMs
      if (event.type === "message" && event.channel?.startsWith("D")) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "unapproved_scope" as ConnectorRejectionReason,
            explanation: "DMs rejected; only channels approved",
          },
          auditLockIds: [],
        };
      }

      // Check approved channels
      const allowedChannels = consentScopes
        .flatMap((s) => s.allowedChannelIds || [])
        .filter(Boolean);

      if (
        event.channel &&
        allowedChannels.length > 0 &&
        !allowedChannels.includes(event.channel)
      ) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "unapproved_scope" as ConnectorRejectionReason,
            explanation: `Channel ${event.channel} not in approved list`,
          },
          auditLockIds: [],
        };
      }

      // Check approved event types
      const allowedEventTypes = consentScopes
        .flatMap((s) => s.allowedEventTypes)
        .filter(Boolean);

      if (
        allowedEventTypes.length > 0 &&
        !allowedEventTypes.includes(event.type)
      ) {
        return {
          processingId,
          envelopeId: envelope.envelopeId,
          status: "rejected",
          rejection: {
            reason: "unapproved_event_type" as ConnectorRejectionReason,
            explanation: `Event type ${event.type} not approved`,
          },
          auditLockIds: [],
        };
      }

      // Extract and sanitize
      const sanitizedText = this.sanitizeSlackText(event.text || "");
      const actorHash = event.user ? this.hashActor(event.user) : "system";

      const sourceReference = `slack#${event.channel}#${event.ts}`;
      const sourceHash = this.hashSource(sourceReference);
      const provenanceHash = this.hashProvenance(envelope.organisationId);
      const idempotencyKey = this.buildIdempotencyKey(
        envelope.organisationId,
        event.channel || "",
        event.ts || ""
      );

      const signalId = `signal-slack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const evidence: SanitizedConnectorEvidence = {
        signalId,
        connectorId: "", // Would be set by caller
        platform: "slack",
        organisationId: envelope.organisationId,
        sourceType: "slack_thread" as EvidenceSourceType,
        trustTier: "informal_signal" as EvidenceSourceTrustTier,
        sourceTimestamp: envelope.sourceTimestamp,
        sanitizedContent: {
          message: sanitizedText,
          channel: event.channel,
          hasThread: !!event.thread_ts,
        },
        redactionSummary: {
          redactionsApplied: this.getRedactionsApplied(event.text || ""),
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
        canPromoteToMemory: false, // Slack alone cannot promote
        canCreateDecisionDebt: false, // Slack alone cannot create debt
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
          explanation: `Failed to process Slack event: ${error instanceof Error ? error.message : String(error)}`,
        },
        auditLockIds: [],
      };
    }
  }

  /**
   * Sanitize Slack message text
   */
  private static sanitizeSlackText(text: string): string {
    // Remove email addresses
    let sanitized = text.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, "[email]");

    // Remove phone numbers
    sanitized = sanitized.replace(/\d{3}-\d{3}-\d{4}/g, "[phone]");

    // Remove tokens/secrets (simple pattern)
    sanitized = sanitized.replace(/xox[baprs]-\d+-\d+-[a-zA-Z0-9]+/g, "[token]");

    // Remove @user mentions (preserve # for channels)
    sanitized = sanitized.replace(/<@([A-Z0-9]+)>/g, "[user]");

    return sanitized.substring(0, 5000); // Limit length
  }

  /**
   * Identify redactions applied
   */
  private static getRedactionsApplied(text: string): string[] {
    const redactions: string[] = [];

    if (/@[A-Z0-9]+/.test(text)) redactions.push("user_mentions");
    if (/[\w\.-]+@[\w\.-]+\.\w+/.test(text)) redactions.push("emails");
    if (/\d{3}-\d{3}-\d{4}/.test(text)) redactions.push("phone_numbers");
    if (/xox[baprs]/.test(text)) redactions.push("slack_tokens");

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
    channel: string,
    timestamp: string
  ): string {
    const combined = `${organisationId}:${channel}:${timestamp}`;
    return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 32);
  }
}
