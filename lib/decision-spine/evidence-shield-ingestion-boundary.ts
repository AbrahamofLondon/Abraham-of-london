/**
 * Evidence Shield Ingestion Boundary
 *
 * Integrates Phase 6b connector output (sanitized, redacted, hashed) with
 * Phase 6c adversarial shield and tamper-evident ledger before any downstream use.
 *
 * Shield runs AFTER redaction but BEFORE memory promotion.
 * Shield runs BEFORE decision debt, verification, falsification, simulation.
 * Quarantined or unknown evidence blocks ALL downstream operations.
 */

import type { SanitizedConnectorEvidence } from "./connector-perimeter-contract";
import { AdversarialEvidenceShield } from "./adversarial-evidence-shield";
import { TamperEvidenceLedger } from "./tamper-evident-ledger";
import type { EvidenceShieldDecision } from "./adversarial-evidence-shield";

export interface ShieldedEvidenceRecord {
  signalId: string;
  sanitizedPreview: string;
  shieldDecision: EvidenceShieldDecision;
  ledgerEntry: any;
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

export interface ShieldingAuditRecord {
  auditId: string;
  signalId: string;
  timestamp: string;
  shieldRiskLevel: string;
  threatsDetected: number;
  sanitizedPreview: string;
  promotionBlocked: boolean;
  debtLinkageBlocked: boolean;
  simulationBlocked: boolean;
  verificationBlocked: boolean;
  falsificationBlocked: boolean;
  authorityDelta: 0;
}

/**
 * Process connector evidence through shield and ledger
 */
export function processConnectorEvidenceThroughShield(
  connectorEvidence: SanitizedConnectorEvidence,
  ledgerChainId: string,
  tenantId: string,
  organisationId: string
): {
  shieldedRecord: ShieldedEvidenceRecord | null;
  auditRecord: ShieldingAuditRecord;
  shouldBlock: boolean;
} {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // STEP 1: Extract sanitized content (never raw)
  const sanitizedContent = JSON.stringify(
    connectorEvidence.sanitizedContent || {}
  );

  // STEP 2: Run adversarial shield
  const riskEvaluation = AdversarialEvidenceShield.evaluateAdversarialEvidenceRisk(
    sanitizedContent
  );

  const shieldDecision = AdversarialEvidenceShield.createShieldDecision(
    connectorEvidence.signalId,
    sanitizedContent.substring(0, 500), // Preview only
    riskEvaluation.riskLevel,
    riskEvaluation.threats
  );

  // STEP 3: Create tamper-evident ledger entry
  const ledgerEntry = TamperEvidenceLedger.createEvidenceLedgerEntry(
    `ledger-${ledgerChainId}`,
    ledgerChainId,
    tenantId,
    organisationId,
    "synthetic", // Until production activation
    1, // Sequence would increment in real ledger
    null, // Genesis for this signal
    connectorEvidence.signalId,
    connectorEvidence.sourceType,
    connectorEvidence.sanitizedContent
  );

  // STEP 4: Create shielded record (NO raw payload)
  const isBlocked =
    shieldDecision.riskLevel === "quarantined" ||
    shieldDecision.riskLevel === "unknown";

  const shieldedRecord: ShieldedEvidenceRecord | null = isBlocked
    ? null
    : {
        signalId: connectorEvidence.signalId,
        sanitizedPreview: shieldDecision.sanitizedPreview,
        shieldDecision,
        ledgerEntry,
        canPromoteToMemory: shieldDecision.canPromoteToMemory,
        canCreateDecisionDebt: shieldDecision.canCreateDecisionDebt,
        canFeedPredictiveTwin: shieldDecision.canFeedPredictiveTwin,
        canUpdateVerification: shieldDecision.canUpdateVerification,
        canUpdateFalsification: shieldDecision.canUpdateFalsification,
        authorityBoundary: {
          shieldGrantsAuthority: false,
          authorityDelta: 0,
        },
      };

  // STEP 5: Create audit record (sanitized preview only, no raw content)
  const auditRecord: ShieldingAuditRecord = {
    auditId,
    signalId: connectorEvidence.signalId,
    timestamp,
    shieldRiskLevel: shieldDecision.riskLevel,
    threatsDetected: shieldDecision.threatsDetected.length,
    sanitizedPreview: shieldDecision.sanitizedPreview.substring(0, 200),
    promotionBlocked: isBlocked,
    debtLinkageBlocked: isBlocked,
    simulationBlocked: isBlocked,
    verificationBlocked: isBlocked,
    falsificationBlocked: isBlocked,
    authorityDelta: 0,
  };

  return {
    shieldedRecord,
    auditRecord,
    shouldBlock: isBlocked,
  };
}

/**
 * Downstream blocking checks
 */
export function shouldBlockEvidencePromotion(
  shieldRiskLevel: string
): boolean {
  return shieldRiskLevel === "quarantined" || shieldRiskLevel === "unknown";
}

export function shouldBlockDecisionDebtLinkage(
  shieldRiskLevel: string
): boolean {
  return shieldRiskLevel === "quarantined" || shieldRiskLevel === "unknown";
}

export function shouldBlockPredictiveTwinIngestion(
  shieldRiskLevel: string
): boolean {
  return shieldRiskLevel === "quarantined" || shieldRiskLevel === "unknown";
}

export function shouldBlockVerificationUpdate(
  shieldRiskLevel: string
): boolean {
  return shieldRiskLevel === "quarantined" || shieldRiskLevel === "unknown";
}

export function shouldBlockFalsificationUpdate(
  shieldRiskLevel: string
): boolean {
  return shieldRiskLevel === "quarantined" || shieldRiskLevel === "unknown";
}

/**
 * Create shielded audit record (for logging, never stores raw payload)
 */
export function createShieldedEvidenceAuditRecord(
  signalId: string,
  sanitizedPreview: string,
  threatsDetected: number,
  authorityDelta: 0
): ShieldingAuditRecord {
  return {
    auditId: `audit-${Date.now()}`,
    signalId,
    timestamp: new Date().toISOString(),
    shieldRiskLevel: threatsDetected > 0 ? "quarantined" : "clean",
    threatsDetected,
    sanitizedPreview,
    promotionBlocked: threatsDetected > 0,
    debtLinkageBlocked: threatsDetected > 0,
    simulationBlocked: threatsDetected > 0,
    verificationBlocked: threatsDetected > 0,
    falsificationBlocked: threatsDetected > 0,
    authorityDelta,
  };
}
