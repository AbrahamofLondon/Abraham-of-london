/**
 * Rendered Output Substance Policy
 *
 * Defines what counts as a substantive rendered output artifact for
 * Evidence Ledger verification purposes.
 *
 * Minimum requirements for a substantive rendered output:
 * 1. Product-specific identifier
 * 2. Scenario-specific output for each frozen scenario
 * 3. Non-empty generated result for each scenario
 * 4. Evidence boundary statement
 * 5. Non-report-derived flag
 * 6. Non-mock flag
 * 7. Hashable artifact body
 * 8. Sufficient content depth (structured fields, not just status)
 *
 * Acceptable substance checks:
 * - Minimum populated fields per scenario output
 * - Scenario coverage (all frozen scenarios present)
 * - Product-specific terms in output
 * - Decision/result fields present
 * - Evidence boundary fields present
 * - Non-placeholder detection
 */

export interface RenderedOutputSubstanceCheck {
  /** Whether the check passed */
  passed: boolean;
  /** Human-readable detail */
  detail: string;
}

export interface RenderedOutputSubstanceResult {
  /** Overall classification */
  classification: "passed_rendered_output_substance" | "pending_rendered_output_substance" | "failed_placeholder_output" | "failed_report_only_output" | "failed_missing_output";
  /** Individual check results */
  checks: Record<string, RenderedOutputSubstanceCheck>;
  /** Human-readable summary */
  summary: string;
}

/**
 * Minimum number of populated fields required per scenario output
 * to be considered substantive (beyond just status/ID fields).
 */
const MIN_FIELDS_PER_OUTPUT = 6;

/**
 * Fields that indicate a thin/placeholder API response.
 * If output ONLY contains these fields, it's not substantive.
 */
const THIN_FIELDS = new Set(["ok", "status", "id", "diagnosticId", "diagnosticRef", "reportReady", "success", "error"]);

/**
 * Fields that indicate substantive content.
 */
const SUBSTANCE_FIELDS = new Set([
  "summary", "analysis", "findings", "recommendation", "score",
  "evidence", "assessment", "diagnosis", "conclusion", "result",
  "details", "observations", "risks", "actions", "nextSteps",
  "rationale", "confidence", "impact", "severity", "priority",
  "category", "classification", "grade", "signal", "pattern",
]);

/**
 * Product-specific terms that should appear in rendered output.
 */
const PRODUCT_TERMS: Record<string, string[]> = {
  team_assessment: ["team", "alignment", "governance", "decision", "assessment", "diagnostic"],
  enterprise_assessment: ["enterprise", "organisational", "governance", "risk", "assessment"],
  fast_diagnostic: ["diagnostic", "pressure", "decision", "signal", "assessment"],
};

/**
 * Check whether a rendered output artifact is substantive.
 */
export function checkRenderedOutputSubstance(
  output: any,
  productCode: string,
  expectedScenarioCount: number
): RenderedOutputSubstanceResult {
  const checks: Record<string, RenderedOutputSubstanceCheck> = {};
  const productTerms = PRODUCT_TERMS[productCode] ?? [];

  // Check 1: Output must exist and be an object
  checks.exists = {
    passed: Boolean(output && typeof output === "object"),
    detail: output ? "Output object exists" : "Output is null or missing",
  };
  if (!checks.exists.passed) {
    return {
      classification: "failed_missing_output",
      checks,
      summary: "Rendered output artifact is missing or null",
    };
  }

  // Check 2: Must have scenarioResults array
  const scenarioResults = output.scenarioResults ?? [];
  checks.scenarioResults = {
    passed: Array.isArray(scenarioResults) && scenarioResults.length > 0,
    detail: `${scenarioResults.length} scenario result(s) found`,
  };

  // Check 3: Scenario coverage
  checks.scenarioCoverage = {
    passed: scenarioResults.length >= expectedScenarioCount,
    detail: `${scenarioResults.length}/${expectedScenarioCount} scenarios covered`,
  };

  // Check 4: Each scenario must have output with sufficient fields
  let allHaveOutput = true;
  let allHaveSubstance = true;
  let totalFields = 0;
  let substanceFieldsFound = 0;
  let thinOnlyCount = 0;

  for (const sr of scenarioResults) {
    const scenarioOutput = sr.output ?? sr.result ?? {};
    const keys = Object.keys(scenarioOutput);
    totalFields += keys.length;

    // Check if output has substance fields beyond thin fields
    const hasSubstanceFields = keys.some((k) => SUBSTANCE_FIELDS.has(k));
    const isThinOnly = keys.every((k) => THIN_FIELDS.has(k));

    if (isThinOnly) thinOnlyCount++;
    if (hasSubstanceFields) substanceFieldsFound++;
    if (!scenarioOutput || Object.keys(scenarioOutput).length === 0) allHaveOutput = false;
    if (keys.length < MIN_FIELDS_PER_OUTPUT && !hasSubstanceFields) allHaveSubstance = false;
  }

  checks.allScenariosHaveOutput = {
    passed: allHaveOutput,
    detail: allHaveOutput ? "All scenarios have output" : "Some scenarios missing output",
  };

  checks.scenarioOutputDepth = {
    passed: thinOnlyCount === 0 && substanceFieldsFound > 0,
    detail: `${totalFields} total fields across scenarios, ${substanceFieldsFound} scenarios with substance fields, ${thinOnlyCount} thin-only`,
  };

  // Check 5: Product-specific terms
  if (productTerms.length > 0) {
    const outputStr = JSON.stringify(output).toLowerCase();
    const matchedTerms = productTerms.filter((t) => outputStr.includes(t));
    checks.productSpecificTerms = {
      passed: matchedTerms.length >= 2,
      detail: `${matchedTerms.length}/${productTerms.length} product-specific terms matched: ${matchedTerms.join(", ") || "none"}`,
    };
  } else {
    checks.productSpecificTerms = { passed: true, detail: "No product terms defined for this product" };
  }

  // Check 6: Evidence boundary
  const outputStr = JSON.stringify(output).toLowerCase();
  const hasEvidenceBoundary =
    outputStr.includes("evidence") ||
    outputStr.includes("boundary") ||
    outputStr.includes("non-mock") ||
    outputStr.includes("non_report") ||
    output.validationNotes?.length > 0;

  checks.evidenceBoundary = {
    passed: hasEvidenceBoundary,
    detail: hasEvidenceBoundary ? "Evidence boundary present" : "No evidence boundary found",
  };

  // Check 7: Non-mock declaration
  const hasNonMock =
    outputStr.includes("non-mock") ||
    outputStr.includes("non_mock") ||
    output.validationNotes?.some((n: string) => n.toLowerCase().includes("mock") || n.toLowerCase().includes("placeholder") || n.toLowerCase().includes("manual"));

  checks.nonMockDeclaration = {
    passed: hasNonMock,
    detail: hasNonMock ? "Non-mock declaration present" : "No non-mock declaration",
  };

  // Check 8: Non-report-derived
  const hasNonReportDerived =
    outputStr.includes("non-report") ||
    outputStr.includes("non_report") ||
    output.validationNotes?.some((n: string) => n.toLowerCase().includes("report"));

  checks.nonReportDerived = {
    passed: hasNonReportDerived,
    detail: hasNonReportDerived ? "Non-report-derived declaration present" : "No non-report-derived declaration",
  };

  // Check 9: Hashable body
  checks.hashableBody = {
    passed: Boolean(output.hashes?.renderedOutputHash || output.outputHash),
    detail: output.hashes?.renderedOutputHash ? "Hash present" : "No hash found",
  };

  // Determine overall classification
  const criticalChecks = ["exists", "scenarioResults", "allScenariosHaveOutput", "scenarioOutputDepth"];
  const allCriticalPassed = criticalChecks.every((c) => checks[c]?.passed);

  if (!allCriticalPassed) {
    return {
      classification: "pending_rendered_output_substance",
      checks,
      summary: "Rendered output exists but lacks sufficient substance depth",
    };
  }

  // Check for placeholder-only output
  if (thinOnlyCount === scenarioResults.length && scenarioResults.length > 0) {
    return {
      classification: "failed_placeholder_output",
      checks,
      summary: "All scenario outputs are thin placeholder responses (status/ID only)",
    };
  }

  // Check for report-only
  if (output.validationNotes?.some((n: string) => n.toLowerCase().includes("report")) && !hasNonReportDerived) {
    return {
      classification: "failed_report_only_output",
      checks,
      summary: "Output appears to be report-derived, not a validation artifact",
    };
  }

  return {
    classification: "passed_rendered_output_substance",
    checks,
    summary: "Rendered output artifact is substantive",
  };
}
