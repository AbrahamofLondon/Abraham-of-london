/**
 * lib/product/frozen-validation-scenarios.ts
 *
 * Frozen Validation Scenario Registry
 *
 * Ensures scenarios cannot be modified in the same pass as product improvements.
 * If scenarios change, prior validation results are invalidated.
 * Every validation run records scenario hashes for evidence ledger integrity.
 */

import { createHash } from "crypto";

export interface FrozenScenario {
  scenarioId: string;
  product: string;
  version: string; // v1, v2, etc. — increments only when scenario intentionally updated
  frozen: boolean;
  frozenDate: string;
  scenarioHash: string; // SHA256 of scenario input JSON
  description: string;
}

export interface FrozenScenarioRegistry {
  product: string;
  registryDate: string;
  scenarios: FrozenScenario[];
}

/**
 * Compute hash of scenario for integrity verification
 */
export function hashScenario(scenario: Record<string, any>): string {
  const json = JSON.stringify(scenario, Object.keys(scenario).sort());
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Frozen scenarios for personal_decision_audit
 */
const PERSONAL_DECISION_AUDIT_SCENARIOS: FrozenScenario[] = [
  {
    scenarioId: "personal_decision_audit_career_pressure_v1",
    product: "personal_decision_audit",
    version: "v1",
    frozen: true,
    frozenDate: "2026-06-13",
    scenarioHash: "HASH_WILL_BE_COMPUTED_AT_RUNTIME", // Set by hashScenario()
    description: "Career Move Under Financial Pressure",
  },
  {
    scenarioId: "personal_decision_audit_partnership_trust_v1",
    product: "personal_decision_audit",
    version: "v1",
    frozen: true,
    frozenDate: "2026-06-13",
    scenarioHash: "HASH_WILL_BE_COMPUTED_AT_RUNTIME",
    description: "Business Partnership Decision with Trust Uncertainty",
  },
  {
    scenarioId: "personal_decision_audit_family_legal_pressure_v1",
    product: "personal_decision_audit",
    version: "v1",
    frozen: true,
    frozenDate: "2026-06-13",
    scenarioHash: "HASH_WILL_BE_COMPUTED_AT_RUNTIME",
    description: "Family/Legal/Admin Decision with Emotional and Timing Pressure",
  },
];

/**
 * Initialize frozen scenario registry with scenario hashes
 */
export function initializeFrozenScenarioRegistry(scenarios: Record<string, any>[]): FrozenScenarioRegistry {
  const registry: FrozenScenarioRegistry = {
    product: "personal_decision_audit",
    registryDate: new Date().toISOString(),
    scenarios: PERSONAL_DECISION_AUDIT_SCENARIOS.map((scenario, idx) => ({
      ...scenario,
      scenarioHash: idx < scenarios.length ? hashScenario(scenarios[idx]) : scenario.scenarioHash,
    })),
  };

  return registry;
}

/**
 * Verify scenario integrity against frozen registry
 */
export function verifyScenariosMatch(
  currentScenarios: Record<string, any>[],
  frozenRegistry: FrozenScenarioRegistry
): { match: boolean; mismatches: string[] } {
  const mismatches: string[] = [];

  if (currentScenarios.length !== frozenRegistry.scenarios.length) {
    mismatches.push(`Scenario count mismatch: ${currentScenarios.length} current vs ${frozenRegistry.scenarios.length} frozen`);
  }

  for (let i = 0; i < Math.min(currentScenarios.length, frozenRegistry.scenarios.length); i++) {
    const currentHash = hashScenario(currentScenarios[i]);
    const frozenHash = frozenRegistry.scenarios[i]?.scenarioHash;

    if (currentHash !== frozenHash) {
      mismatches.push(
        `Scenario ${i} (${frozenRegistry.scenarios[i]?.scenarioId}) hash mismatch: ${currentHash.substring(0, 8)} vs ${frozenHash?.substring(0, 8)}`
      );
    }
  }

  return {
    match: mismatches.length === 0,
    mismatches,
  };
}

/**
 * Record scenario hashes in evidence ledger
 */
export function recordScenarioHashesToEvidenceLedger(
  product: string,
  scenarios: Record<string, any>[],
  validationRun: string
): Record<string, any> {
  return {
    productCode: product,
    validationRun,
    recordedAt: new Date().toISOString(),
    scenarioCount: scenarios.length,
    scenarioHashes: scenarios.map((s, idx) => ({
      scenarioIndex: idx,
      scenarioHash: hashScenario(s),
      scenarioSize: JSON.stringify(s).length,
    })),
  };
}

export default {
  hashScenario,
  initializeFrozenScenarioRegistry,
  verifyScenariosMatch,
  recordScenarioHashesToEvidenceLedger,
  PERSONAL_DECISION_AUDIT_SCENARIOS,
};
