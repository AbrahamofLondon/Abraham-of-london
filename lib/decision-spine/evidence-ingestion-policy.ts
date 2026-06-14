/**
 * Evidence Ingestion Policy
 *
 * Deterministic policy functions for external evidence governance.
 * All decisions are fail-closed: when in doubt, reject or quarantine.
 */

import type {
  EvidenceSourceType,
  EvidenceSourceTrustTier,
  IngestionConsentMode,
  DecisionEvidenceSignal,
  EvidenceQuarantineReason,
} from "./decision-spine-contract";

export class EvidenceIngestionPolicy {
  /**
   * Can this source type be ingested at all?
   */
  static canIngestSource(
    sourceType: EvidenceSourceType,
    consentMode: IngestionConsentMode,
    authorisedTypes: EvidenceSourceType[],
    blockedTypes: EvidenceSourceType[]
  ): boolean {
    // Check if blocked
    if (blockedTypes.includes(sourceType)) {
      return false;
    }

    // Check if authorised
    if (!authorisedTypes.includes(sourceType)) {
      return false;
    }

    // Check consent
    if (
      consentMode === "not_consented" ||
      consentMode === undefined
    ) {
      return false;
    }

    return true;
  }

  /**
   * Classify source trust tier
   */
  static classifySourceTrust(
    sourceType: EvidenceSourceType,
    sourceIdentity?: string,
    isAIGenerated?: boolean
  ): EvidenceSourceTrustTier {
    // AI-generated without source evidence is untrusted
    if (isAIGenerated && !sourceIdentity) {
      return "untrusted_or_ambiguous";
    }

    // Authoritative sources
    if (sourceType === "board_minutes") {
      return "authoritative_record";
    }
    if (sourceType === "document_revision" && sourceIdentity?.includes("signed")) {
      return "authoritative_record";
    }

    // Corroborated operational
    if (
      sourceType === "jira_ticket" ||
      sourceType === "crm_record"
    ) {
      return "corroborated_operational_record";
    }

    // Single-source operational
    if (
      sourceType === "meeting_notes" ||
      sourceType === "email_thread" ||
      sourceType === "calendar_event"
    ) {
      return "single_source_operational_record";
    }

    // Informal signals
    if (sourceType === "slack_thread") {
      return "informal_signal";
    }

    // Manual uploads without provenance
    if (sourceType === "manual_upload" && !sourceIdentity) {
      return "untrusted_or_ambiguous";
    }

    // System-generated without source link
    if (sourceType === "system_generated_record" && !sourceIdentity) {
      return "untrusted_or_ambiguous";
    }

    return "untrusted_or_ambiguous";
  }

  /**
   * Should this evidence be quarantined?
   */
  static shouldQuarantineEvidence(
    signal: Partial<DecisionEvidenceSignal>,
    blockedCategories: string[]
  ): { shouldQuarantine: boolean; reason?: EvidenceQuarantineReason; explanation?: string } {
    // Personal or non-decision material
    if (signal.isPersonalOrNonDecisionMaterial) {
      return {
        shouldQuarantine: true,
        reason: "personal_or_private_material",
        explanation: "Content identified as personal; cannot promote to decision memory",
      };
    }

    // Insufficient trust
    if (
      signal.sourceTrustTier === "informal_signal" ||
      signal.sourceTrustTier === "untrusted_or_ambiguous"
    ) {
      return {
        shouldQuarantine: true,
        reason: "trust_tier_insufficient",
        explanation: "Source trust tier insufficient for immediate promotion",
      };
    }

    // Missing provenance
    if (!signal.sourceIdentity) {
      return {
        shouldQuarantine: true,
        reason: "missing_provenance",
        explanation: "Source identity not provided; chain of custody unclear",
      };
    }

    // Ambiguous classification
    if (signal.requiredHumanReview) {
      return {
        shouldQuarantine: true,
        reason: "ambiguous_classification",
        explanation: "Evidence classification requires human review before promotion",
      };
    }

    return { shouldQuarantine: false };
  }

  /**
   * Should evidence be redacted?
   */
  static shouldRedactEvidence(
    content: unknown,
    sourceType: EvidenceSourceType,
    blockedCategories: string[]
  ): { shouldRedact: boolean; reason?: string } {
    // Email/Slack may contain personal info
    if (sourceType === "email_thread" || sourceType === "slack_thread") {
      return {
        shouldRedact: true,
        reason: "Email and chat may contain incidental personal identifiers",
      };
    }

    // Calendar events may contain personal details
    if (sourceType === "calendar_event") {
      return {
        shouldRedact: true,
        reason: "Calendar events may contain personal time/location/health info",
      };
    }

    // Manual uploads: uncertain
    if (sourceType === "manual_upload") {
      return {
        shouldRedact: true,
        reason: "Manual uploads require redaction assessment for privacy",
      };
    }

    return { shouldRedact: false };
  }

  /**
   * Is this evidence decision-relevant?
   */
  static isDecisionRelevant(
    content: unknown,
    extractedItemCount: number
  ): boolean {
    // If we extracted commits, contradictions, or mandate changes, it's relevant
    if (extractedItemCount > 0) {
      return true;
    }

    // Otherwise, without clear decision signal, not relevant
    return false;
  }

  /**
   * Is this personal or non-decision material?
   */
  static isPersonalOrNonDecisionMaterial(
    sourceType: EvidenceSourceType,
    contentKeywords?: string[]
  ): boolean {
    // Personal metadata in calendar/Slack
    if (sourceType === "calendar_event") {
      return true; // Assume calendar contains personal time
    }

    // Chat messages are often informal/personal
    if (sourceType === "slack_thread") {
      if (!contentKeywords || contentKeywords.length === 0) {
        return true; // No clear decision keywords = likely personal
      }
    }

    return false;
  }

  /**
   * Can this evidence be promoted to memory?
   */
  static canPromoteToMemory(
    signal: Partial<DecisionEvidenceSignal>,
    requiresHumanReview: boolean
  ): boolean {
    // Cannot promote if quarantined
    const quarantine = this.shouldQuarantineEvidence(signal as any, []);
    if (quarantine.shouldQuarantine) {
      return false;
    }

    // Cannot promote without human review completion
    if (requiresHumanReview && !signal.redactedContent) {
      return false;
    }

    // Cannot promote if redaction failed
    if (this.shouldRedactEvidence(signal.rawContent, signal.sourceType as any, [])
      .shouldRedact && !signal.redactedContent) {
      return false;
    }

    // Cannot promote without decision relevance
    if (!this.isDecisionRelevant(signal.redactedContent, 0)) {
      return false;
    }

    return true;
  }

  /**
   * Can this evidence link to decision debt?
   */
  static canLinkToDecisionDebt(
    signal: Partial<DecisionEvidenceSignal>,
    extractedCommitmentCount: number
  ): boolean {
    // Must have extracted commitments
    if (extractedCommitmentCount === 0) {
      return false;
    }

    // Must be in memory first
    if (!this.canPromoteToMemory(signal, false)) {
      return false;
    }

    // Informal signals alone cannot create debt
    if (signal.sourceTrustTier === "informal_signal") {
      // Would need corroboration
      return false;
    }

    return true;
  }

  /**
   * Can this evidence trigger falsification review?
   */
  static canTriggerFalsificationReview(
    signal: Partial<DecisionEvidenceSignal>,
    extractedContradictionCount: number
  ): boolean {
    // Must have extracted contradictions
    if (extractedContradictionCount === 0) {
      return false;
    }

    // Must be authoritative or corroborated
    if (
      signal.sourceTrustTier !== "authoritative_record" &&
      signal.sourceTrustTier !== "corroborated_operational_record"
    ) {
      return false;
    }

    // Must be in memory
    if (!this.canPromoteToMemory(signal, false)) {
      return false;
    }

    return true;
  }
}

/**
 * Deterministic policy enforcement: all decisions documented
 */
export const EVIDENCE_INGESTION_POLICY_RULES = {
  RULE_1_CONSENT_REQUIRED:
    "No evidence may be ingested without explicit consent (explicit_source_consent, org_policy_approved) or connector_enabled by policy",

  RULE_2_NO_PERSONAL_TO_MEMORY:
    "Personal/private material cannot be promoted into governed memory even after redaction",

  RULE_3_INFORMAL_NEEDS_CORROBORATION:
    "Informal signals (Slack/chat) cannot create decision debt without corroboration from authoritative or operational sources",

  RULE_4_FRAGMENTS_CANNOT_OVERRIDE:
    "Email fragments and chat excerpts cannot override board minutes or signed records",

  RULE_5_NO_AUTHORITY_FROM_INGESTION:
    "Ingestion cannot create positive authority; remains 0",

  RULE_6_NO_AUTONOMOUS_ACTION:
    "Ingestion cannot trigger autonomous decisions; always human review gate or policy passage required",

  RULE_7_AMBIGUOUS_QUARANTINE:
    "Evidence with uncertain classification is quarantined until explicitly human-approved",

  RULE_8_PROTECTED_CATEGORY_QUARANTINE:
    "Legal, HR, medical, financial personal data must be quarantined unless explicitly approved by policy",

  RULE_9_REDACTION_FAILS_CLOSED:
    "If redaction cannot safely classify content, ingestion is rejected; do not store ambiguous material",

  RULE_10_PROVENANCE_AUDIT:
    "All ingestion decisions are audit-locked with source identity, decision reason, and timestamp",

  RULE_11_AI_NOT_AUTHORITATIVE:
    "System-generated or AI-extracted records cannot be authoritative without linked source evidence",

  RULE_12_TOPOLOGY_UNCHANGED:
    "Ingestion does not create new exportable derived topology; Phase 5 boundaries preserved",
};
