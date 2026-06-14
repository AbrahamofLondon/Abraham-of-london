/**
 * Shared Capability Memory Bridge
 *
 * Implements governed memory progression from ephemeral surface records
 * through consented case memory to enterprise spine candidacy.
 */

import type {
  CapabilityMemoryRecord,
  MemoryBridgeConsentState,
  MemoryBridgeEligibility,
  MemoryBridgePromotionDecision,
  CaseMemoryStatus,
  CaseEscalationReadiness,
  SharedCapabilityAuditEntry,
  SurfaceOrigin,
  SurfaceMemoryMode,
} from "./shared-memory-bridge-contract";
import crypto from "crypto";

export class SharedMemoryBridge {
  /**
   * Create ephemeral surface record (default for public signals)
   */
  static createEphemeralSurfaceRecord(
    caseId: string,
    organisationId: string,
    surfaceOrigin: SurfaceOrigin,
    sanitizedPreview: string,
    submittedContent: string,
    sourceReference: string,
    provenanceHash: string
  ): CapabilityMemoryRecord {
    const recordId = `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedContentHash = crypto
      .createHash("sha256")
      .update(submittedContent)
      .digest("hex");

    return {
      recordId,
      caseId,
      organisationId,
      surfaceOrigin,
      memoryMode: "ephemeral",
      sanitizedPreview,
      submittedContentHash,
      sourceReference,
      provenanceHash,
      quarantineReference: null,
      rawPayloadStored: false,
      consentState: "not_required",
      eligibility: {
        isEligibleForDurableMemory: false,
        isEligibleForCaseMemory: false,
        isEligibleForEnterpriseReview: false,
        isEligibleForSpineCandidate: false,
        blockedReasons: ["Ephemeral records cannot become durable without consent"],
      },
      eligibilityReason: "Ephemeral surface record; durable memory requires consent",
      authorityBoundary: {
        recordGrantsAuthority: false,
        authorityDelta: 0,
      },
      createdAt: new Date().toISOString(),
      createdBy: "system",
      auditLockIds: [],
    };
  }

  /**
   * Evaluate if surface record is eligible for memory progression
   */
  static evaluateMemoryBridgeEligibility(
    record: CapabilityMemoryRecord,
    hasConsent: boolean,
    shieldRiskLevel: "clean" | "quarantined" | "unknown",
    ledgerVerified: boolean
  ): MemoryBridgeEligibility {
    const blockedReasons: string[] = [];

    // Quarantined or unknown evidence cannot become durable
    if (shieldRiskLevel === "quarantined") {
      blockedReasons.push("Quarantined evidence cannot promote to durable memory");
    }
    if (shieldRiskLevel === "unknown") {
      blockedReasons.push("Unknown risk evidence cannot promote to durable memory");
    }

    // Public signals need consent for durable memory
    if (record.surfaceOrigin === "public_signal" && !hasConsent) {
      blockedReasons.push("Public signal records require explicit consent for durable memory");
    }

    // Playbooks need consent
    if (record.surfaceOrigin === "playbook" && !hasConsent) {
      blockedReasons.push("Paid playbook records require explicit consent for case memory");
    }

    // GMI interactions need consent
    if (record.surfaceOrigin === "gmi_brief" && !hasConsent) {
      blockedReasons.push("GMI brief records require explicit consent for macro-context memory");
    }

    // Enterprise review requires ledger verification
    if (!ledgerVerified) {
      blockedReasons.push("Enterprise review requires verified ledger state");
    }

    return {
      isEligibleForDurableMemory: blockedReasons.length === 0 && shieldRiskLevel === "clean",
      isEligibleForCaseMemory: hasConsent && shieldRiskLevel === "clean",
      isEligibleForEnterpriseReview: hasConsent && ledgerVerified && shieldRiskLevel === "clean",
      isEligibleForSpineCandidate: hasConsent && ledgerVerified && shieldRiskLevel === "clean",
      blockedReasons,
    };
  }

  /**
   * Promote record to consented case memory
   */
  static promoteToConsentedCaseMemory(
    record: CapabilityMemoryRecord,
    hasConsent: boolean,
    shieldRiskLevel: "clean" | "quarantined" | "unknown"
  ): MemoryBridgePromotionDecision {
    const blockedReasons: string[] = [];

    if (!hasConsent) {
      blockedReasons.push("Consent required for case memory promotion");
    }

    if (shieldRiskLevel !== "clean") {
      blockedReasons.push(`Evidence risk level ${shieldRiskLevel} cannot promote to case memory`);
    }

    return {
      recordId: record.recordId,
      currentMode: record.memoryMode,
      targetMode: "consented_case_memory",
      allowed: blockedReasons.length === 0,
      blockedReasons,
      requiredApprovals: !hasConsent ? ["client_consent"] : [],
      authorityDelta: 0,
    };
  }

  /**
   * Block promotion without consent
   */
  static blockPromotionWithoutConsent(
    record: CapabilityMemoryRecord
  ): MemoryBridgePromotionDecision {
    return {
      recordId: record.recordId,
      currentMode: record.memoryMode,
      targetMode: "consented_case_memory",
      allowed: false,
      blockedReasons: ["Consent is mandatory for durable memory promotion"],
      requiredApprovals: ["client_consent"],
      authorityDelta: 0,
    };
  }

  /**
   * Block promotion if evidence is quarantined
   */
  static blockPromotionIfQuarantined(
    record: CapabilityMemoryRecord
  ): MemoryBridgePromotionDecision {
    return {
      recordId: record.recordId,
      currentMode: record.memoryMode,
      targetMode: "consented_case_memory",
      allowed: false,
      blockedReasons: ["Quarantined evidence cannot promote to durable memory"],
      requiredApprovals: [],
      authorityDelta: 0,
    };
  }

  /**
   * Block promotion if evidence is unknown risk
   */
  static blockPromotionIfUnknown(
    record: CapabilityMemoryRecord
  ): MemoryBridgePromotionDecision {
    return {
      recordId: record.recordId,
      currentMode: record.memoryMode,
      targetMode: "consented_case_memory",
      allowed: false,
      blockedReasons: ["Unknown risk evidence cannot promote to durable memory"],
      requiredApprovals: [],
      authorityDelta: 0,
    };
  }

  /**
   * Create memory bridge audit entry
   */
  static createCapabilityMemoryAuditEntry(
    recordId: string,
    caseId: string,
    organisationId: string,
    action: string,
    actor: string,
    sanitizedPreview: string,
    reason: string
  ): SharedCapabilityAuditEntry {
    const actorHash = crypto
      .createHash("sha256")
      .update(actor)
      .digest("hex")
      .substring(0, 16);

    return {
      auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recordId,
      caseId,
      organisationId,
      timestamp: new Date().toISOString(),
      action: action as any,
      actor,
      actorHash,
      sanitizedPreview: sanitizedPreview.substring(0, 200),
      reason,
      authorityDelta: 0,
    };
  }

  /**
   * Evaluate if case is ready for enterprise escalation
   */
  static evaluateCaseEscalationReadiness(
    caseId: string,
    organisationId: string,
    totalEvidenceRecords: number,
    quarantinedCount: number,
    unknownCount: number,
    hasClientConsent: boolean,
    ledgerVerified: boolean
  ): CaseEscalationReadiness {
    const missingApprovals: string[] = [];

    if (!hasClientConsent) {
      missingApprovals.push("client_consent");
    }

    if (!ledgerVerified) {
      missingApprovals.push("ledger_verification");
    }

    return {
      caseId,
      organisationId,
      canEscalateToEnterprise:
        missingApprovals.length === 0 &&
        quarantinedCount === 0 &&
        unknownCount === 0 &&
        totalEvidenceRecords > 0,
      missingApprovals,
      quarantinedEvidenceCount: quarantinedCount,
      unknownRiskEvidenceCount: unknownCount,
      requiresClientConsent: !hasClientConsent,
      requiresAdvisorVerification: false,
      authorityDelta: 0,
    };
  }
}

export const SHARED_MEMORY_BRIDGE_RULES = {
  EPHEMERAL_DEFAULT: "Public signals default to ephemeral; no durable memory without consent",
  CONSENT_REQUIREMENT: "Durable memory requires explicit organisational consent",
  ADVISOR_MEDIATION: "Professional advisor evidence remains advisor-mediated until client review",
  QUARANTINE_BLOCKS: "Quarantined evidence cannot promote to any durable memory state",
  UNKNOWN_BLOCKS: "Unknown risk evidence cannot promote to any durable memory state",
  AUTHORITY_ZERO: "Memory bridge operations do not grant authority (delta always 0)",
  NO_RAW_STORAGE: "Raw submitted content is never stored in normal capability memory records",
  ENTERPRISE_APPROVAL: "Enterprise escalation requires client organisation approval",
  CROSS_CLIENT_ISOLATION: "Client X evidence cannot contaminate Client Y case memory",
};
