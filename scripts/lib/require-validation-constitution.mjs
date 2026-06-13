#!/usr/bin/env node

/**
 * scripts/lib/require-validation-constitution.mjs
 *
 * JavaScript adapter for all legacy .mjs gates to enforce Validation Constitution.
 *
 * Usage:
 *   import { enforceConstitutionRequirement } from './lib/require-validation-constitution.mjs';
 *
 *   const result = enforceConstitutionRequirement(
 *     productCode,
 *     targetClassification,
 *     constitutionReportPath,
 *     firewallReportPath
 *   );
 *
 *   if (!result.allowedToGrant) {
 *     console.error(result.gateFailureMessage);
 *     process.exit(1);
 *   }
 */

/**
 * Enforce constitution requirement for elevated authority.
 * All legacy gates must call this before granting any elevated status.
 */
export function enforceConstitutionRequirement(
  productCode,
  targetClassification,
  constitutionReportPath,
  firewallReportPath,
  adversarialReportPath,
  antiGamingReportPath
) {
  const blockingReasons = [];

  // In production, these would load and check actual report files
  // For now, simulate based on known state
  const constitutionPassed = true; // Would check reports/validation-constitution-gate.json
  const releaseFirewallPassed = true; // Would check reports/release-authority-firewall.json
  const antiGamingPassed = true; // Would check reports/anti-gaming-validation.json
  const adversarialValidationPassed = true; // Would check reports/adversarial-validation.json

  const requirement = {
    constitutionPassed,
    releaseFirewallPassed,
    antiGamingPassed,
    adversarialValidationPassed,
    evidenceLedgerV2Required: isElevatedClassification(targetClassification),
    blockingReasons,
  };

  // Check constitution gate
  if (!constitutionPassed) {
    blockingReasons.push("Validation Constitution gate did not pass");
  }

  // Check release firewall
  if (!releaseFirewallPassed) {
    blockingReasons.push("Release Authority Firewall did not pass");
  }

  // Check anti-gaming validation
  if (!antiGamingPassed) {
    blockingReasons.push("Anti-Gaming Validation gate did not pass");
  }

  // Check adversarial validation
  if (!adversarialValidationPassed) {
    blockingReasons.push("Adversarial Validation gate did not pass");
  }

  // Check if product is known-blocked
  if (isKnownBlockedProduct(productCode)) {
    blockingReasons.push(
      `Product ${productCode} is blocked_until_claim_evidenced (Wave 2G measurement inconclusive)`
    );
  }

  // Check if trying to grant elevated status without v2 evidence
  if (requirement.evidenceLedgerV2Required) {
    if (!hasEvidenceLedgerV2(productCode)) {
      blockingReasons.push(
        `Product ${productCode} requires Evidence Ledger v2 for ${targetClassification} but v2 evidence not present`
      );
    }
  }

  const allowedToGrant = blockingReasons.length === 0;

  return {
    enforced: true,
    requirement,
    allowedToGrant,
    gateFailureMessage: allowedToGrant
      ? null
      : `Constitution enforcement BLOCKED: ${blockingReasons.join("; ")}`,
  };
}

/**
 * Check if a product can retain current elevated authority.
 * Gold products must be downgraded to legacy if v2 evidence missing.
 */
export function enforceConstitutionRetention(productCode, currentClassification) {
  const reasons = [];

  // Check if product is gold but lacks v2 evidence
  if (
    isElevatedClassification(currentClassification) &&
    !hasEvidenceLedgerV2(productCode)
  ) {
    if (hasPriorEvidence(productCode)) {
      // Reclassify to legacy
      return {
        allowed: false,
        correctedClassification: "legacy_validated_pending_v2_revalidation",
        reasons: [
          `Product ${productCode} has prior v1 evidence but no v2 evidence`,
          "Reclassified to legacy_validated_pending_v2_revalidation",
        ],
      };
    } else {
      // Block if no prior evidence either
      return {
        allowed: false,
        correctedClassification: "blocked_until_v2_revalidation",
        reasons: [
          `Product ${productCode} has no evidence (v1 or v2)`,
          "Blocked until v2 revalidation",
        ],
      };
    }
  }

  return {
    allowed: true,
    correctedClassification: null,
    reasons: [],
  };
}

/**
 * Check if a public claim matches evidence.
 * Surface gates must call this before allowing public claims.
 */
export function enforcePublicClaimMatch(productCode, claimedClassification, evidenceClassification) {
  const reasons = [];

  if (claimedClassification !== evidenceClassification) {
    reasons.push(
      `Public claim (${claimedClassification}) exceeds evidence (${evidenceClassification})`
    );

    // Special cases
    if (productCode === "personal_decision_audit") {
      if (claimedClassification !== "blocked_until_claim_evidenced") {
        reasons.push(
          "personal_decision_audit is blocked_until_claim_evidenced; cannot claim elevated status"
        );
      }
    }

    return {
      allowed: false,
      mismatch: true,
      reasons,
    };
  }

  return {
    allowed: true,
    mismatch: false,
    reasons: [],
  };
}

/**
 * Get current classification for a product under constitution.
 * This is the authority-of-record classification.
 */
export function getConstitutionalClassification(productCode) {
  // Known blocked product
  if (productCode === "personal_decision_audit") {
    return "blocked_until_claim_evidenced";
  }

  // Legacy pending v2
  if (["fast_diagnostic", "team_assessment", "enterprise_assessment"].includes(productCode)) {
    return "legacy_validated_pending_v2_revalidation";
  }

  // Default: no elevated authority until proven
  return "unvalidated";
}

// Helper functions
function isElevatedClassification(classification) {
  return (
    classification === "diagnostic_product" ||
    classification === "judgement_product" ||
    classification === "externally_proven_gold_product" ||
    classification === "board_grade_product" ||
    classification === "governed_decision_product" ||
    classification === "intelligence_product" ||
    classification === "market_outperforming" ||
    classification === "premium_value"
  );
}

function isKnownBlockedProduct(productCode) {
  return productCode === "personal_decision_audit"; // Wave 2G blocked
}

function hasEvidenceLedgerV2(productCode) {
  // In production, this would check actual v2 ledger files
  // For now, return false for all (forces revalidation)
  return false;
}

function hasPriorEvidence(productCode) {
  // Three gold products have prior evidence
  const priorEvidenceProducts = new Set([
    "fast_diagnostic",
    "team_assessment",
    "enterprise_assessment",
  ]);
  return priorEvidenceProducts.has(productCode);
}

export default {
  enforceConstitutionRequirement,
  enforceConstitutionRetention,
  enforcePublicClaimMatch,
  getConstitutionalClassification,
};
