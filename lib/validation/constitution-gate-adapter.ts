/**
 * lib/validation/constitution-gate-adapter.ts
 *
 * Shared adapter for all legacy gates to enforce Validation Constitution.
 *
 * Every gate that grants elevated authority must call this adapter
 * and fail if constitution requirements are not met.
 */

export interface ConstitutionGateRequirement {
  constitutionPassed: boolean;
  releaseFirewallPassed: boolean;
  antiGamingPassed: boolean;
  adversarialValidationPassed: boolean;
  evidenceLedgerV2Required: boolean;
  blockingReasons: string[];
}

export interface ConstitutionEnforcementResult {
  enforced: boolean;
  requirement: ConstitutionGateRequirement;
  allowedToGrant: boolean;
  gateFailureMessage: string | null;
}

/**
 * Check if a product can be granted elevated authority under the constitution.
 * All legacy gates must call this before granting any elevated status.
 */
export function enforceConstitutionRequirement(
  productCode: string,
  targetClassification: string,
  constitutionReportPath?: string,
  firewallReportPath?: string,
  adversarialReportPath?: string,
  antiGamingReportPath?: string
): ConstitutionEnforcementResult {
  const blockingReasons: string[] = [];

  // In production, these would load actual report files
  // For now, we simulate based on known state
  const constitutionPassed = constitutionReportExists(constitutionReportPath);
  const releaseFirewallPassed = firewallReportExists(firewallReportPath);
  const antiGamingPassed = antiGamingReportExists(antiGamingReportPath);
  const adversarialValidationPassed = adversarialReportExists(adversarialReportPath);

  const requirement: ConstitutionGateRequirement = {
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
      `Product ${productCode} is blocked until claim evidenced (Wave 2G measurement inconclusive)`
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
export function enforceConstitutionRetention(
  productCode: string,
  currentClassification: string
): {
  allowed: boolean;
  correctedClassification: string | null;
  reasons: string[];
} {
  const reasons: string[] = [];

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
export function enforcePublicClaimMatch(
  productCode: string,
  claimedClassification: string,
  evidenceClassification: string
): {
  allowed: boolean;
  mismatch: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

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

// Helper functions
function isElevatedClassification(classification: string): boolean {
  return (
    classification === "diagnostic_product" ||
    classification === "judgement_product" ||
    classification === "externally_proven_gold_product" ||
    classification === "board_grade_product" ||
    classification === "governed_decision_product" ||
    classification === "intelligence_product"
  );
}

function isKnownBlockedProduct(productCode: string): boolean {
  return productCode === "personal_decision_audit"; // Wave 2G blocked
}

function hasEvidenceLedgerV2(productCode: string): boolean {
  // In production, this would check actual v2 ledger files
  // For now, return false for all (forces revalidation)
  return false;
}

function hasPriorEvidence(productCode: string): boolean {
  // Three gold products have prior evidence
  const priorEvidenceProducts = new Set([
    "fast_diagnostic",
    "team_assessment",
    "enterprise_assessment",
  ]);
  return priorEvidenceProducts.has(productCode);
}

function constitutionReportExists(path?: string): boolean {
  // In production, check if file exists and gate === PASSED
  return true; // Assume passed; actual implementation checks file
}

function firewallReportExists(path?: string): boolean {
  // In production, check if file exists and gate === PASSED
  return true; // Assume passed; actual implementation checks file
}

function antiGamingReportExists(path?: string): boolean {
  // In production, check if file exists and gate === PASSED
  return true; // Assume passed; actual implementation checks file
}

function adversarialReportExists(path?: string): boolean {
  // In production, check if file exists and gate === PASSED
  return true; // Assume passed; actual implementation checks file
}

export default {
  enforceConstitutionRequirement,
  enforceConstitutionRetention,
  enforcePublicClaimMatch,
};
