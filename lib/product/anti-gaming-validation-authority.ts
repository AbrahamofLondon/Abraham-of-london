/**
 * lib/product/anti-gaming-validation-authority.ts
 *
 * Anti-Gaming Validation Authority
 *
 * Ensures products cannot be upgraded through measurement manipulation, wording optimization,
 * scorer tweaks, field exposure, or selective benchmark interpretation.
 *
 * Hard rule: Product upgrade requires COMPLETE independent validation chain.
 * Decision-force score alone can NEVER authorize upgrade.
 */

export type GamingRisk =
  | "token_optimisation" // output optimized for scorer tokens without real improvement
  | "scorer_product_coupling" // scorer and product both changed in same pass
  | "field_visibility_gaming" // fields moved to visible locations without proving usefulness
  | "partial_validation_upgrade" // upgraded without full validation chain
  | "manual_classification_override" // classification manually assigned against evidence
  | "scenario_overfitting" // scenarios changed to match product improvements
  | "benchmark_bypass" // anti-toy or red-team skipped due to infrastructure issues;

export interface AntiGamingValidationResult {
  productCode: string;
  validationDate: string;

  // Input state validation
  scenarioSetFrozen: boolean;
  scenarioSetHash: string | null;
  benchmarkIndependentFromProductChange: boolean;
  scorerChangedThisPass: boolean;
  productChangedThisPass: boolean;
  scorerAndProductChangedTogether: boolean;

  // Full validation chain requirements
  antiToyPassed: boolean | null; // null if not run; must be true or upgrade blocked
  redTeamPassed: boolean | null; // null if not run; must be true or upgrade blocked
  genericAiComparisonPassed: boolean | null; // null if not run; must be true or upgrade blocked
  marketComparisonPassed: boolean | null; // null if not run; must be true or upgrade blocked
  decisionForcePassed: boolean | null; // supplementary only; never sufficient alone

  evidenceLedgerComplete: boolean; // scenario hashes, test dates, reviewer names recorded
  claimAuthorityPassed: boolean | null;

  // Derived gates
  validationComplete: boolean; // true only if all required tests ran and passed
  upgradeAllowed: boolean; // true only if validationComplete && no gaming risks

  // Diagnostics
  gamingRisks: GamingRisk[];
  blockingReasons: string[];

  // Integrity checks
  resultStatus: "passed" | "failed" | "measurement_inconclusive";
  previousValidationResult?: AntiGamingValidationResult | null;
}

/**
 * Validate product upgrade against anti-gaming rules
 */
export function validateProductUpgradeNotGamed(
  productCode: string,
  validationResult: Partial<AntiGamingValidationResult>
): AntiGamingValidationResult {
  const result: AntiGamingValidationResult = {
    productCode,
    validationDate: new Date().toISOString(),
    scenarioSetFrozen: validationResult.scenarioSetFrozen ?? false,
    scenarioSetHash: validationResult.scenarioSetHash ?? null,
    benchmarkIndependentFromProductChange: validationResult.benchmarkIndependentFromProductChange ?? false,
    scorerChangedThisPass: validationResult.scorerChangedThisPass ?? false,
    productChangedThisPass: validationResult.productChangedThisPass ?? false,
    scorerAndProductChangedTogether: validationResult.scorerAndProductChangedTogether ?? false,
    antiToyPassed: validationResult.antiToyPassed ?? null,
    redTeamPassed: validationResult.redTeamPassed ?? null,
    genericAiComparisonPassed: validationResult.genericAiComparisonPassed ?? null,
    marketComparisonPassed: validationResult.marketComparisonPassed ?? null,
    decisionForcePassed: validationResult.decisionForcePassed ?? null,
    evidenceLedgerComplete: validationResult.evidenceLedgerComplete ?? false,
    claimAuthorityPassed: validationResult.claimAuthorityPassed ?? null,
    gamingRisks: [],
    blockingReasons: [],
    resultStatus: "failed",
    validationComplete: false,
    upgradeAllowed: false,
  };

  // Detect gaming risks
  if (!result.scenarioSetFrozen) {
    result.gamingRisks.push("scenario_overfitting");
    result.blockingReasons.push("Scenario set not frozen; cannot validate product changes independently");
  }

  if (result.scorerChangedThisPass && result.productChangedThisPass) {
    result.gamingRisks.push("scorer_product_coupling");
    result.blockingReasons.push(
      "Scorer and product both changed in same pass; measurement inconclusive"
    );
  }

  if (result.scorerChangedThisPass && !result.benchmarkIndependentFromProductChange) {
    result.gamingRisks.push("token_optimisation");
    result.blockingReasons.push("Scorer changed; output may be optimised for new scoring tokens");
  }

  // Full validation chain requirements (ALL must pass)
  const validationChainTests = [
    { name: "anti-toy", passed: result.antiToyPassed },
    { name: "red-team", passed: result.redTeamPassed },
    { name: "generic AI comparison", passed: result.genericAiComparisonPassed },
    { name: "market comparison", passed: result.marketComparisonPassed },
  ];

  const failedTests = validationChainTests.filter((t) => t.passed === false || t.passed === null);
  if (failedTests.length > 0) {
    result.gamingRisks.push("benchmark_bypass");
    result.blockingReasons.push(
      `Full validation chain incomplete: ${failedTests.map((t) => t.name).join(", ")} missing or failed`
    );
  }

  // Decision-force score alone is NOT sufficient
  if (result.decisionForcePassed === true && validationChainTests.some((t) => t.passed !== true)) {
    result.gamingRisks.push("partial_validation_upgrade");
    result.blockingReasons.push(
      "Decision-force score alone is not sufficient for upgrade; full validation chain required"
    );
  }

  // Evidence ledger integrity
  if (!result.evidenceLedgerComplete) {
    result.blockingReasons.push("Evidence ledger incomplete; scenario hashes or test metadata missing");
  }

  // Determine overall validation status
  const validationChainPassed = validationChainTests.every((t) => t.passed === true);
  const noGamingRisks = result.gamingRisks.length === 0;
  const everyRequiredTestRan = validationChainTests.every((t) => t.passed !== null);

  if (!everyRequiredTestRan) {
    result.resultStatus = "measurement_inconclusive";
    result.validationComplete = false;
  } else if (validationChainPassed && noGamingRisks) {
    result.resultStatus = "passed";
    result.validationComplete = true;
    result.upgradeAllowed = true;
  } else {
    result.resultStatus = "failed";
    result.validationComplete = true; // all tests ran, but some failed
  }

  return result;
}

/**
 * Check if a product can be upgraded based on validation result
 */
export function canProductBeUpgraded(validation: AntiGamingValidationResult): boolean {
  // Hard rules that ALWAYS block upgrade
  if (validation.scorerAndProductChangedTogether) {
    return false; // measurement inconclusive
  }

  if (validation.gamingRisks.length > 0) {
    return false; // gaming detected
  }

  // Full validation chain must pass
  if (validation.antiToyPassed !== true) {
    return false;
  }
  if (validation.redTeamPassed !== true) {
    return false;
  }
  if (validation.genericAiComparisonPassed !== true) {
    return false;
  }
  if (validation.marketComparisonPassed !== true) {
    return false;
  }

  // Evidence ledger must be complete
  if (!validation.evidenceLedgerComplete) {
    return false;
  }

  // All checks passed
  return true;
}

export default {
  validateProductUpgradeNotGamed,
  canProductBeUpgraded,
};
