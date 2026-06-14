/**
 * Adversarial Evidence Shield
 *
 * Detects and quarantines semantically adversarial evidence before it enters
 * memory, decision debt, verification, falsification, or predictive pipelines.
 *
 * Core doctrine:
 * - EDOS does not trust external text
 * - EDOS does not execute instructions embedded in evidence
 * - Suspicious evidence is quarantined, not "cleaned into trust"
 * - Quarantined evidence cannot promote, link, or feed downstream systems
 */

import type {
  EvidenceSourceType,
  EvidenceSourceTrustTier,
} from "./decision-spine-contract";

export type SemanticThreatCategory =
  | "instruction_override_attempt"
  | "authority_escalation_attempt"
  | "decision_debt_manipulation_attempt"
  | "falsification_registry_manipulation_attempt"
  | "verification_result_manipulation_attempt"
  | "hidden_unicode_or_control_character"
  | "prompt_injection_wrapper"
  | "tool_invocation_attempt"
  | "data_exfiltration_instruction"
  | "chain_of_thought_extraction_attempt"
  | "system_role_impersonation"
  | "excessive_payload_or_format_attack"
  | "unknown_suspicious_semantic_pattern";

export type AdversarialEvidenceRiskLevel = "clean" | "quarantined" | "unknown";

export interface AdversarialThreatSignature {
  category: SemanticThreatCategory;
  detectedAt: string;
  suspiciousText: string; // Sanitized preview, not raw poisoned text
  severity: "critical" | "high" | "medium";
  remediation: string;
}

export interface EvidenceShieldDecision {
  signalId: string;
  riskLevel: AdversarialEvidenceRiskLevel;
  threatsDetected: AdversarialThreatSignature[];
  sanitizedPreview: string;
  quarantineReference: string | null;
  rawPayloadStored: false; // Never store raw poisoned payload here
  canPromoteToMemory: boolean;
  canCreateDecisionDebt: boolean;
  canFeedPredictiveTwin: boolean;
  canUpdateVerification: boolean;
  canUpdateFalsification: boolean;
  authorityBoundary: {
    shieldGrantsAuthority: false;
    authorityDelta: 0;
  };
}

export interface EvidenceShieldResult {
  processingId: string;
  shieldDecision: EvidenceShieldDecision;
  auditEntryId: string;
  timestamp: string;
}

export const ADVERSARIAL_SHIELD_INVARIANTS = {
  NO_INSTRUCTION_OVERRIDE:
    "Instruction overrides are detected and quarantine entire evidence",
  NO_AUTHORITY_ESCALATION:
    "Authority escalation attempts quarantine evidence",
  NO_DEBT_MANIPULATION:
    "Decision debt manipulation attempts quarantine evidence",
  NO_FALSIFICATION_MANIPULATION:
    "Falsification registry tampering quarantines evidence",
  NO_VERIFICATION_MANIPULATION:
    "Verification result manipulation quarantines evidence",
  SUSPICIOUS_NOT_CLEANED:
    "Suspicious evidence is quarantined, never cleaned into trust",
  DOWNSTREAM_BLOCKS:
    "Quarantined and unknown evidence cannot promote, link, or feed downstream",
  NO_RAW_PAYLOAD_STORAGE:
    "Raw poisoned payloads never stored in normal shield records",
  AUTHORITY_ZERO: "Shield cannot grant authority; delta always 0",
};

/**
 * Adversarial Evidence Shield Implementation
 */
export class AdversarialEvidenceShield {
  /**
   * Canonicalize evidence text before pattern matching
   */
  static canonicalizeEvidenceText(rawText: string): string {
    // Remove control characters (preserve CRLF as LF)
    let canonical = rawText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");

    // Normalize Unicode
    canonical = canonical.normalize("NFC");

    // Trim excessive whitespace
    canonical = canonical.replace(/\s+/g, " ").trim();

    return canonical;
  }

  /**
   * Detect hidden Unicode or control characters
   */
  static detectHiddenControlCharacters(text: string): {
    hasHidden: boolean;
    characters: string[];
  } {
    const hidden: string[] = [];

    // Control characters (0x00-0x1F except Tab/LF/CR)
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      if (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D) {
        hidden.push(`U+${code.toString(16).toUpperCase()}`);
      }

      // Unicode directional overrides
      if (code >= 0x200E && code <= 0x200F) {
        hidden.push("LRE/RLE");
      }
      if (code >= 0x202A && code <= 0x202E) {
        hidden.push("LRO/RLO/PDF");
      }
    }

    return {
      hasHidden: hidden.length > 0,
      characters: [...new Set(hidden)],
    };
  }

  /**
   * Detect instruction override attempts
   */
  static detectInstructionOverride(text: string): boolean {
    const overridePatterns = [
      /ignore.*instructions/i,
      /override.*decision/i,
      /execute.*command/i,
      /run.*script/i,
      /process.*as.*code/i,
    ];

    for (const pattern of overridePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect authority escalation attempts
   */
  static detectAuthorityEscalationAttempt(text: string): boolean {
    const escalationPatterns = [
      /grant.*authority/i,
      /set.*authority.*to.*1/i,
      /escalate.*permission/i,
      /elevation.*required/i,
      /bypass.*approval/i,
    ];

    for (const pattern of escalationPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect decision debt manipulation
   */
  static detectDecisionDebtManipulation(text: string): boolean {
    const debtPatterns = [
      /delete.*debt/i,
      /remove.*decision.*debt/i,
      /clear.*debt.*record/i,
      /debt.*reset/i,
    ];

    for (const pattern of debtPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect falsification manipulation
   */
  static detectFalsificationManipulation(text: string): boolean {
    const falsePatterns = [
      /delete.*falsification/i,
      /remove.*error.*record/i,
      /erase.*false/i,
      /clear.*calibration/i,
    ];

    for (const pattern of falsePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect tool invocation attempts
   */
  static detectToolInvocationAttempt(text: string): boolean {
    const toolPatterns = [
      /\[TOOL_CALL\]/i,
      /\$FUNCTION\(/,
      /exec\(/i,
      /system\(/i,
      /shell:/i,
    ];

    for (const pattern of toolPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect data exfiltration instructions
   */
  static detectDataExfiltrationInstruction(text: string): boolean {
    const exfilPatterns = [
      /send.*data.*to/i,
      /export.*to.*external/i,
      /extract.*evidence/i,
      /dump.*database/i,
    ];

    for (const pattern of exfilPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate adversarial evidence risk
   */
  static evaluateAdversarialEvidenceRisk(
    text: string
  ): {
    riskLevel: AdversarialEvidenceRiskLevel;
    threats: AdversarialThreatSignature[];
  } {
    const threats: AdversarialThreatSignature[] = [];
    const canonical = this.canonicalizeEvidenceText(text);

    // Check 1: Hidden characters
    const hiddenCheck = this.detectHiddenControlCharacters(text);
    if (hiddenCheck.hasHidden) {
      threats.push({
        category: "hidden_unicode_or_control_character",
        detectedAt: new Date().toISOString(),
        suspiciousText: `Hidden: ${hiddenCheck.characters.join(", ")}`,
        severity: "high",
        remediation: "Quarantine; review for Unicode bypass attempts",
      });
    }

    // Check 2: Instruction override
    if (this.detectInstructionOverride(canonical)) {
      threats.push({
        category: "instruction_override_attempt",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Instruction override detected",
        severity: "critical",
        remediation: "Quarantine immediately",
      });
    }

    // Check 3: Authority escalation
    if (this.detectAuthorityEscalationAttempt(canonical)) {
      threats.push({
        category: "authority_escalation_attempt",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Authority escalation detected",
        severity: "critical",
        remediation: "Quarantine immediately",
      });
    }

    // Check 4: Decision debt manipulation
    if (this.detectDecisionDebtManipulation(canonical)) {
      threats.push({
        category: "decision_debt_manipulation_attempt",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Decision debt manipulation detected",
        severity: "critical",
        remediation: "Quarantine immediately",
      });
    }

    // Check 5: Falsification manipulation
    if (this.detectFalsificationManipulation(canonical)) {
      threats.push({
        category: "falsification_registry_manipulation_attempt",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Falsification manipulation detected",
        severity: "critical",
        remediation: "Quarantine immediately",
      });
    }

    // Check 6: Tool invocation
    if (this.detectToolInvocationAttempt(canonical)) {
      threats.push({
        category: "tool_invocation_attempt",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Tool invocation detected",
        severity: "high",
        remediation: "Quarantine; review syntax",
      });
    }

    // Check 7: Data exfiltration
    if (this.detectDataExfiltrationInstruction(canonical)) {
      threats.push({
        category: "data_exfiltration_instruction",
        detectedAt: new Date().toISOString(),
        suspiciousText: "Exfiltration instruction detected",
        severity: "critical",
        remediation: "Quarantine immediately",
      });
    }

    // Determine risk level
    let riskLevel: AdversarialEvidenceRiskLevel = "clean";

    if (threats.length > 0) {
      const hasCritical = threats.some((t) => t.severity === "critical");
      riskLevel = hasCritical ? "quarantined" : "quarantined";
    }

    return { riskLevel, threats };
  }

  /**
   * Create shield decision
   */
  static createShieldDecision(
    signalId: string,
    sanitizedPreview: string,
    riskLevel: AdversarialEvidenceRiskLevel,
    threats: AdversarialThreatSignature[]
  ): EvidenceShieldDecision {
    const isQuarantined =
      riskLevel === "quarantined" || riskLevel === "unknown";

    return {
      signalId,
      riskLevel,
      threatsDetected: threats,
      sanitizedPreview,
      quarantineReference: isQuarantined
        ? `quarantine-${signalId}`
        : null,
      rawPayloadStored: false,
      canPromoteToMemory: !isQuarantined,
      canCreateDecisionDebt: !isQuarantined,
      canFeedPredictiveTwin: !isQuarantined,
      canUpdateVerification: !isQuarantined,
      canUpdateFalsification: !isQuarantined,
      authorityBoundary: {
        shieldGrantsAuthority: false,
        authorityDelta: 0,
      },
    };
  }
}
