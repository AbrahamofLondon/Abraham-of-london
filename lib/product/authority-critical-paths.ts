/**
 * Authority-Critical Paths
 *
 * Defines which paths are authority-bearing. Mock-like material may exist
 * in tests, fixtures, or demos, but must not be reachable from these paths.
 *
 * Rule: No mock, demo, fixture, report, or placeholder may support authority.
 */

/**
 * Authority-critical path categories.
 * Each represents a system component that participates in authority decisions.
 */
export type AuthorityCriticalPath =
  | "product_authority_contract"
  | "evidence_ledger_v2"
  | "rendered_validation_outputs"
  | "scenario_artifacts"
  | "hash_artifacts"
  | "route_proof_artifacts"
  | "surface_propagation_artifacts"
  | "claim_boundary_scans"
  | "no_mock_scans"
  | "authority_grant_firewall"
  | "authority_safety_gate"
  | "effective_authority_resolver";

/**
 * All authority-critical paths.
 */
export const ALL_CRITICAL_PATHS: AuthorityCriticalPath[] = [
  "product_authority_contract",
  "evidence_ledger_v2",
  "rendered_validation_outputs",
  "scenario_artifacts",
  "hash_artifacts",
  "route_proof_artifacts",
  "surface_propagation_artifacts",
  "claim_boundary_scans",
  "no_mock_scans",
  "authority_grant_firewall",
  "authority_safety_gate",
  "effective_authority_resolver",
];

/**
 * File glob patterns that correspond to each authority-critical path.
 */
export const CRITICAL_PATH_PATTERNS: Record<AuthorityCriticalPath, string[]> = {
  product_authority_contract: [
    "lib/product/product-authority-contract.ts",
    "lib/product/product-authority-gate.ts",
    "lib/product/authority-gate-hierarchy.ts",
    "scripts/check-product-authority-contract.mjs",
  ],
  evidence_ledger_v2: [
    "lib/product/evidence-classification.ts",
    "lib/validation/data-source-authority.ts",
    "scripts/generate-v2-evidence-ledger.mjs",
    "scripts/verify-evidence-ledger-artifacts.mjs",
  ],
  rendered_validation_outputs: [
    "lib/product/live-route-output-capture.ts",
    "scripts/capture-live-route-product-output.mjs",
    "scripts/capture-category-route-proof.mjs",
  ],
  scenario_artifacts: [
    "lib/product/scenario-definitions.ts",
    "scripts/validate-team-assessment-v2.mjs",
  ],
  hash_artifacts: [
    "lib/product/hash-utils.ts",
    "scripts/verify-evidence-ledger-artifacts.mjs",
  ],
  route_proof_artifacts: [
    "lib/product/route-proof.ts",
    "scripts/capture-category-route-proof.mjs",
  ],
  surface_propagation_artifacts: [
    "lib/product/surface-propagation.ts",
    "scripts/check-surface-claim-authority.mjs",
    "scripts/check-effective-authority-surfaces.mjs",
  ],
  claim_boundary_scans: [
    "scripts/check-surface-claim-authority.mjs",
    "scripts/scan-product-surface-claims.ts",
    "scripts/check-universal-claim-authority.mjs",
  ],
  no_mock_scans: [
    "scripts/check-no-mock-authority.mjs",
  ],
  authority_grant_firewall: [
    "scripts/check-authority-grant-firewall.mjs",
  ],
  authority_safety_gate: [
    "scripts/check-authority-safety-gate.mjs",
    "scripts/check-authority-safe-language.mjs",
  ],
  effective_authority_resolver: [
    "lib/product/authority-evidence-source-policy.ts",
    "scripts/reconcile-product-authority-truth.mjs",
  ],
};

/**
 * Non-authority paths that are safe for mock/fixture/placeholder content.
 * These include tests, demos, UI form placeholders, and documentation.
 */
export const SAFE_NON_AUTHORITY_PATTERNS = [
  // Test files
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/__tests__/**",
  "**/__mocks__/**",
  // Demo/example content
  "**/demo/**",
  "**/examples/**",
  "**/templates/**",
  // UI form placeholders (not authority-bearing)
  "**/components/ui/**",
  "**/components/form/**",
  // Documentation
  "**/*.md",
  "**/docs/**",
  // Configuration
  "**/*.config.*",
  "**/tailwind.*",
  "**/postcss.*",
];

/**
 * Check if a file path is on an authority-critical path.
 */
export function isOnCriticalPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  for (const patterns of Object.values(CRITICAL_PATH_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern.replace(/\\/g, "/").replace(/^\.\//, ""))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a file path is in a safe non-authority zone.
 */
export function isInSafeZone(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  for (const pattern of SAFE_NON_AUTHORITY_PATTERNS) {
    const globPattern = pattern
      .replace(/\\/g, "/")
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*");
    try {
      if (new RegExp(`^${globPattern}$`).test(normalized)) return true;
    } catch {
      // If regex fails, try simple includes
      if (normalized.includes(pattern.replace(/\\/g, "/").replace("**/", ""))) return true;
    }
  }
  return false;
}

/**
 * Determine whether a finding in a given file is on an authority-critical path.
 * If not on a critical path, it's informational only.
 */
export function isAuthorityPathFinding(filePath: string): boolean {
  return isOnCriticalPath(filePath) && !isInSafeZone(filePath);
}
