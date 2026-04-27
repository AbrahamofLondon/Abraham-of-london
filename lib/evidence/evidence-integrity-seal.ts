/**
 * Evidence Integrity Seal — Defensive Moat
 *
 * Every generated case draft receives an integrity seal.
 * No public case may be marked "verified" without this seal.
 *
 * Seal levels:
 *   BRONZE   — verified outcome, confidence >= 0.85
 *   SILVER   — behavioural/documentary evidence + financial impact
 *   GOLD     — operator-confirmed/documentary evidence + financial impact + contract trace
 *   PLATINUM — repeated pattern confirmed across multiple cases
 *
 * This prevents competitors from copying the language without the audit structure.
 */

import type {
  IntegritySeal,
  IntegritySealLevel,
  VerificationMethod,
} from "./case-study-types";

// ─────────────────────────────────────────────────────────────────────────────
// SEAL THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

const SEAL_THRESHOLDS: Record<IntegritySealLevel, { minConfidence: number; requiredMethods: VerificationMethod[]; requiresFinancialImpact: boolean; requiresContractTrace: boolean; requiresMultipleCases: boolean }> = {
  BRONZE: {
    minConfidence: 0.85,
    requiredMethods: [],
    requiresFinancialImpact: false,
    requiresContractTrace: false,
    requiresMultipleCases: false,
  },
  SILVER: {
    minConfidence: 0.85,
    requiredMethods: ["BEHAVIOURAL", "DOCUMENTARY"],
    requiresFinancialImpact: true,
    requiresContractTrace: false,
    requiresMultipleCases: false,
  },
  GOLD: {
    minConfidence: 0.90,
    requiredMethods: ["OPERATOR_CONFIRMED", "DOCUMENTARY"],
    requiresFinancialImpact: true,
    requiresContractTrace: true,
    requiresMultipleCases: false,
  },
  PLATINUM: {
    minConfidence: 0.95,
    requiredMethods: ["OPERATOR_CONFIRMED", "DOCUMENTARY"],
    requiresFinancialImpact: true,
    requiresContractTrace: true,
    requiresMultipleCases: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEAL GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export type SealInput = {
  confidence: number;
  verificationMethod: VerificationMethod;
  financialImpactGBP: number | null;
  sourceContractId: string | null;
  sourceDecisionId: string | null;
  multipleCasesConfirmed: boolean;
  missingFields: string[];
};

/**
 * Generate an integrity seal for a case draft.
 * Determines the highest achievable seal level based on available evidence.
 */
export function generateIntegritySeal(input: SealInput): IntegritySeal {
  const { confidence, verificationMethod, financialImpactGBP, sourceContractId, sourceDecisionId, multipleCasesConfirmed, missingFields } = input;

  const sourceTraced = !!sourceContractId || !!sourceDecisionId;
  const hasFinancialImpact = financialImpactGBP !== null && financialImpactGBP > 0;

  // Determine seal level (highest achievable)
  let sealLevel: IntegritySealLevel = "BRONZE";

  if (
    confidence >= SEAL_THRESHOLDS.PLATINUM.minConfidence &&
    SEAL_THRESHOLDS.PLATINUM.requiredMethods.includes(verificationMethod) &&
    hasFinancialImpact &&
    sourceTraced &&
    multipleCasesConfirmed
  ) {
    sealLevel = "PLATINUM";
  } else if (
    confidence >= SEAL_THRESHOLDS.GOLD.minConfidence &&
    SEAL_THRESHOLDS.GOLD.requiredMethods.includes(verificationMethod) &&
    hasFinancialImpact &&
    sourceTraced
  ) {
    sealLevel = "GOLD";
  } else if (
    confidence >= SEAL_THRESHOLDS.SILVER.minConfidence &&
    SEAL_THRESHOLDS.SILVER.requiredMethods.some((m) => m === verificationMethod) &&
    hasFinancialImpact
  ) {
    sealLevel = "SILVER";
  } else if (confidence >= SEAL_THRESHOLDS.BRONZE.minConfidence) {
    sealLevel = "BRONZE";
  }

  // Publication allowed only if seal is at least BRONZE and no critical fields missing
  const criticalFields = ["situation", "contradiction", "decision", "intervention", "outcome"];
  const hasCriticalMissing = criticalFields.some((f) => missingFields.includes(f));
  const publicationAllowed = sealLevel !== "BRONZE" && !hasCriticalMissing;

  // Data completeness score (0-100)
  const totalFields = 10;
  const completenessScore = Math.round(((totalFields - missingFields.length) / totalFields) * 100);

  return {
    sealLevel,
    confidence,
    verificationMethod,
    sourceTraced,
    dataCompleteness: completenessScore,
    publicationAllowed,
    missingFields,
  };
}

/**
 * Check if a seal permits publication.
 */
export function sealPermitsPublication(seal: IntegritySeal): boolean {
  return seal.publicationAllowed && seal.sealLevel !== "BRONZE";
}

/**
 * Get the minimum seal level required for publication.
 */
export function minimumPublicationSeal(): IntegritySealLevel {
  return "SILVER";
}

/**
 * Human-readable seal summary.
 */
export function formatSealSummary(seal: IntegritySeal): string {
  const levelLabel = seal.sealLevel.charAt(0) + seal.sealLevel.slice(1).toLowerCase();
  const publishStatus = seal.publicationAllowed ? "Publication permitted" : "Publication not permitted";
  return `${levelLabel} Seal — Confidence: ${Math.round(seal.confidence * 100)}% — ${publishStatus}`;
}
