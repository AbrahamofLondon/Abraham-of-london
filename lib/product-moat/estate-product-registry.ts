/**
 * Estate Product Registry
 *
 * Compile-time representation of all canonical estate product codes.
 * This is the single source of truth for which product codes are valid in the system.
 *
 * Every product code in this registry MUST exist in ProductAuthorityContract.
 * Every product code in ProductAuthorityContract MUST exist in this registry.
 *
 * This enforces compile-time safety: unknown product codes fail the build.
 */

export const ESTATE_PRODUCT_CODES = [
  "assessment_light",
  "assessment_premium",
  "assessment_standard",
  "boardroom_brief",
  "briefs_vault_editorial",
  "competitor_tracker",
  "content_editorial",
  "content_research",
  "content_thought_leadership",
  "decision_instruments",
  "decision_pressure_signal",
  "diagnostic_deep",
  "diagnostic_extended",
  "diagnostic_rapid",
  "enterprise_assessment",
  "executive_reporting",
  "fast_diagnostic",
  "gmi_quarterly",
  "inner_circle",
  "market_intelligence_q1",
  "market_intelligence_q2",
  "market_intelligence_q3",
  "professional",
  "reporting_archive",
  "reporting_custom",
  "reporting_monthly",
  "research_archive",
  "research_custom",
  "research_library",
  "retainer_oversight",
  "signal_watch",
  "strategy_intensive",
  "strategy_retainer",
  "strategy_room",
  "strategy_workshop",
  "support_basic",
  "tools_suite_basic",
  "tools_suite_enterprise",
  "tools_suite_pro",
  "training_certification",
  "training_ongoing",
  "training_workshop",
  "trend_monitor",
] as const;

/**
 * Derive type from registry array
 */
export type EstateProductCode = typeof ESTATE_PRODUCT_CODES[number];

/**
 * Type guard: check if a value is a valid estate product code
 */
export function isEstateProductCode(value: string): value is EstateProductCode {
  return (ESTATE_PRODUCT_CODES as readonly string[]).includes(value);
}

/**
 * Assert a product code is valid, or throw
 */
export function assertEstateProductCode(value: string): EstateProductCode {
  if (!isEstateProductCode(value)) {
    throw new Error(
      `Unknown product code: ${value}. Valid codes are: ${ESTATE_PRODUCT_CODES.join(", ")}`
    );
  }
  return value;
}

/**
 * Get all product codes
 */
export function getEstateProductCodes(): readonly EstateProductCode[] {
  return ESTATE_PRODUCT_CODES;
}

/**
 * Product count by category
 */
export const ESTATE_PRODUCT_DISTRIBUTION = {
  activeMemoryWrite: 5,
  prewiredPendingEvidence: 36,
  auditOnlyBlocked: 2,
  total: 43,
} as const;

/**
 * Invariant: This registry is the compile-time source of truth.
 * The runtime JSON matrix is a report output, not application authority.
 */
export const ESTATE_REGISTRY_INVARIANTS = {
  COMPILE_TIME_AUTHORITY:
    "Estate registry is the compile-time source of truth for valid product codes",
  UNKNOWN_CODES_FAIL_CLOSED: "Unknown product codes cause build/runtime failure",
  RUNTIME_MATRIX_REPORT_ONLY:
    "JSON capability matrix is a generated report, not application authority",
  BIDIRECTIONAL_SYNC_REQUIRED:
    "All ProductAuthorityContract codes must be in this registry; all registry codes must be in contract",
};
