/**
 * lib/validation/data-source-authority.ts
 *
 * Data Source Authority Contract
 *
 * Defines which data sources are allowed to grant authority and in which contexts.
 *
 * Core Doctrine:
 * No hardcoded mock data may grant authority.
 * No static fixture may classify a product.
 * No placeholder may satisfy a validation gate.
 */

export type DataSourceKind =
  | "generated_evidence"
  | "live_route_capture"
  | "rendered_output_hash"
  | "frozen_scenario"
  | "validated_gate_result"
  | "evidence_ledger_v2"
  | "deterministic_adapter"
  | "legacy_evidence"
  | "manual_report"
  | "mock_data"
  | "placeholder"
  | "fixture"
  | "surface_copy"
  | "registry_label";

export interface DataSourceAuthority {
  sourceKind: DataSourceKind;
  canGrantAuthority: boolean;
  canSupportNarrative: boolean;
  canSupportTesting: boolean;
  canSupportDemo: boolean;
  requiresAdditionalEvidence: boolean;
  allowedContexts: string[];
  forbiddenContexts: string[];
  blockingReason?: string;
}

/**
 * Authority sources — only these may grant product authority
 */
export const AUTHORITY_SOURCES: Record<DataSourceKind, DataSourceAuthority> = {
  generated_evidence: {
    sourceKind: "generated_evidence",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  live_route_capture: {
    sourceKind: "live_route_capture",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  rendered_output_hash: {
    sourceKind: "rendered_output_hash",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  frozen_scenario: {
    sourceKind: "frozen_scenario",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: false,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  validated_gate_result: {
    sourceKind: "validated_gate_result",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: false,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  evidence_ledger_v2: {
    sourceKind: "evidence_ledger_v2",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: false,
    requiresAdditionalEvidence: false,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  deterministic_adapter: {
    sourceKind: "deterministic_adapter",
    canGrantAuthority: true,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: true,
    allowedContexts: ["production", "validation", "gates"],
    forbiddenContexts: [],
  },

  legacy_evidence: {
    sourceKind: "legacy_evidence",
    canGrantAuthority: false,
    canSupportNarrative: true,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: true,
    allowedContexts: ["narrative", "transition"],
    forbiddenContexts: ["authority", "classification", "validation"],
    blockingReason: "Legacy evidence requires v2 revalidation for authority",
  },

  manual_report: {
    sourceKind: "manual_report",
    canGrantAuthority: false,
    canSupportNarrative: true,
    canSupportTesting: false,
    canSupportDemo: false,
    requiresAdditionalEvidence: true,
    allowedContexts: ["explanation", "context"],
    forbiddenContexts: ["authority", "validation", "gates"],
    blockingReason: "Manual reports cannot grant authority",
  },

  mock_data: {
    sourceKind: "mock_data",
    canGrantAuthority: false,
    canSupportNarrative: false,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: true,
    allowedContexts: ["test", "fixture", "demo"],
    forbiddenContexts: [
      "authority",
      "classification",
      "validation",
      "gates",
      "production",
      "release",
    ],
    blockingReason: "Mock data cannot participate in authority decisions",
  },

  placeholder: {
    sourceKind: "placeholder",
    canGrantAuthority: false,
    canSupportNarrative: false,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: true,
    allowedContexts: ["dev", "prototype"],
    forbiddenContexts: [
      "authority",
      "classification",
      "validation",
      "gates",
      "production",
    ],
    blockingReason: "Placeholder data cannot grant authority",
  },

  fixture: {
    sourceKind: "fixture",
    canGrantAuthority: false,
    canSupportNarrative: false,
    canSupportTesting: true,
    canSupportDemo: true,
    requiresAdditionalEvidence: true,
    allowedContexts: ["test", "fixture"],
    forbiddenContexts: [
      "authority",
      "classification",
      "validation",
      "gates",
      "production",
    ],
    blockingReason: "Fixture data cannot grant authority",
  },

  surface_copy: {
    sourceKind: "surface_copy",
    canGrantAuthority: false,
    canSupportNarrative: true,
    canSupportTesting: false,
    canSupportDemo: false,
    requiresAdditionalEvidence: true,
    allowedContexts: ["ui", "reporting"],
    forbiddenContexts: ["authority", "classification", "validation", "gates"],
    blockingReason: "Surface copy cannot grant authority",
  },

  registry_label: {
    sourceKind: "registry_label",
    canGrantAuthority: false,
    canSupportNarrative: true,
    canSupportTesting: false,
    canSupportDemo: false,
    requiresAdditionalEvidence: true,
    allowedContexts: ["tracking", "labeling"],
    forbiddenContexts: [
      "authority",
      "classification",
      "validation",
      "gates",
      "release",
    ],
    blockingReason: "Registry labels cannot override evidence-based authority",
  },
};

/**
 * Check if a data source can grant authority
 */
export function canGrantAuthority(sourceKind: DataSourceKind): boolean {
  return AUTHORITY_SOURCES[sourceKind]?.canGrantAuthority === true;
}

/**
 * Get authority contract for a data source
 */
export function getAuthorityContract(
  sourceKind: DataSourceKind
): DataSourceAuthority | null {
  return AUTHORITY_SOURCES[sourceKind] || null;
}

/**
 * Validate that a data source is allowed in a context
 */
export function isAllowedInContext(
  sourceKind: DataSourceKind,
  context: string
): {
  allowed: boolean;
  reason?: string;
} {
  const source = AUTHORITY_SOURCES[sourceKind];
  if (!source) {
    return { allowed: false, reason: "Unknown data source kind" };
  }

  if (source.forbiddenContexts.includes(context)) {
    return {
      allowed: false,
      reason: `${sourceKind} is forbidden in ${context} context`,
    };
  }

  if (
    source.allowedContexts.length > 0 &&
    !source.allowedContexts.includes(context)
  ) {
    return {
      allowed: false,
      reason: `${sourceKind} is not allowed in ${context} context`,
    };
  }

  return { allowed: true };
}

/**
 * Get blocking reason if source cannot grant authority
 */
export function getBlockingReason(sourceKind: DataSourceKind): string | null {
  const source = AUTHORITY_SOURCES[sourceKind];
  if (!source?.canGrantAuthority) {
    return source?.blockingReason || `${sourceKind} cannot grant authority`;
  }
  return null;
}

/**
 * Mock data exception — for unavoidable mock data
 */
export interface MockDataException {
  id: string;
  filePath: string;
  purpose: "test" | "fixture" | "demo" | "local_dev";
  whyUnavoidable: string;
  cannotGrantAuthority: true;
  isolatedFromProduction: boolean;
  expiresAt?: string;
}
