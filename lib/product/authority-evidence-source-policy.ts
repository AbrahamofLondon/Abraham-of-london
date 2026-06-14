/**
 * Authority Evidence Source Policy
 *
 * Defines which artifact types may serve as evidence for authority decisions.
 * Reports are explicitly classified as descriptive-only — they may explain
 * evidence but cannot themselves constitute evidence.
 *
 * Rule: reports_are_descriptive_not_evidence
 *
 * Only artifact classes may support authority decisions:
 * - scenario_artifact
 * - rendered_output_artifact
 * - hash_artifact
 * - ledger_artifact
 * - route_proof_artifact
 * - surface_propagation_artifact
 * - guard_result_artifact
 *
 * Report classes are descriptive-only:
 * - completion_report_descriptive_only
 * - readiness_report_descriptive_only
 * - manual_report_descriptive_only
 */

export type EvidenceSourceType =
  // === ARTIFACT CLASSES (may support authority) ===
  | "scenario_artifact"
  | "rendered_output_artifact"
  | "hash_artifact"
  | "ledger_artifact"
  | "route_proof_artifact"
  | "surface_propagation_artifact"
  | "guard_result_artifact"
  // === DESCRIPTIVE-ONLY CLASSES (may NOT support authority) ===
  | "completion_report_descriptive_only"
  | "readiness_report_descriptive_only"
  | "manual_report_descriptive_only";

export interface EvidenceSource {
  type: EvidenceSourceType;
  path: string;
  description: string;
  canSupportAuthority: boolean;
}

/**
 * All artifact types that may support authority decisions.
 */
export const AUTHORITY_SUPPORTING_TYPES: ReadonlySet<EvidenceSourceType> = new Set([
  "scenario_artifact",
  "rendered_output_artifact",
  "hash_artifact",
  "ledger_artifact",
  "route_proof_artifact",
  "surface_propagation_artifact",
  "guard_result_artifact",
]);

/**
 * All report types that are descriptive-only.
 */
export const DESCRIPTIVE_ONLY_TYPES: ReadonlySet<EvidenceSourceType> = new Set([
  "completion_report_descriptive_only",
  "readiness_report_descriptive_only",
  "manual_report_descriptive_only",
]);

/**
 * Determine whether a source type may support authority decisions.
 */
export function canSupportAuthority(type: EvidenceSourceType): boolean {
  return AUTHORITY_SUPPORTING_TYPES.has(type);
}

/**
 * Classify a file path into an evidence source type.
 */
export function classifyEvidenceSource(filePath: string): EvidenceSource {
  const lower = filePath.toLowerCase();

  // Artifact classifications
  if (lower.includes("/scenarios/") || lower.includes("scenario-set") || lower.includes("scenario_hash")) {
    return { type: "scenario_artifact", path: filePath, description: "Scenario definition or hash artifact", canSupportAuthority: true };
  }
  if (lower.includes("rendered-output") || lower.includes("rendered_output") || lower.includes("output-hash") || lower.includes("output_hash")) {
    return { type: "rendered_output_artifact", path: filePath, description: "Rendered output artifact or hash", canSupportAuthority: true };
  }
  if (lower.includes("hash") || lower.includes("checksum") || lower.endsWith(".sha256") || lower.endsWith(".md5")) {
    return { type: "hash_artifact", path: filePath, description: "Hash or checksum artifact", canSupportAuthority: true };
  }
  if (lower.includes("evidence-ledger") || lower.includes("evidence_ledger") || lower.includes("ledger-v2") || lower.includes("ledger_v2")) {
    return { type: "ledger_artifact", path: filePath, description: "Evidence ledger artifact", canSupportAuthority: true };
  }
  if (lower.includes("route-proof") || lower.includes("route_proof") || lower.includes("routeproof")) {
    return { type: "route_proof_artifact", path: filePath, description: "Route proof artifact", canSupportAuthority: true };
  }
  if (lower.includes("surface-propagation") || lower.includes("surface_propagation") || lower.includes("surfacepropagation")) {
    return { type: "surface_propagation_artifact", path: filePath, description: "Surface propagation artifact", canSupportAuthority: true };
  }
  if (lower.includes("guard-result") || lower.includes("guard_result") || lower.includes("gate-result") || lower.includes("gate_result")) {
    return { type: "guard_result_artifact", path: filePath, description: "Guard or gate result artifact", canSupportAuthority: true };
  }

  // Report classifications (descriptive-only)
  if (lower.includes("/reports/") || lower.includes("\\reports\\")) {
    if (lower.includes("completion") || lower.includes("closure") || lower.includes("closeout")) {
      return { type: "completion_report_descriptive_only", path: filePath, description: "Completion/closure report — descriptive only, not evidence", canSupportAuthority: false };
    }
    if (lower.includes("readiness") || lower.includes("readiness")) {
      return { type: "readiness_report_descriptive_only", path: filePath, description: "Readiness report — descriptive only, not evidence", canSupportAuthority: false };
    }
    return { type: "manual_report_descriptive_only", path: filePath, description: "Report — descriptive only, not evidence", canSupportAuthority: false };
  }

  // Default: manual report
  return { type: "manual_report_descriptive_only", path: filePath, description: "Unclassified source — treated as descriptive only", canSupportAuthority: false };
}

/**
 * Verify that a set of evidence sources contains at least one
 * authority-supporting artifact.
 */
export function hasAuthoritySupportingEvidence(sources: EvidenceSource[]): boolean {
  return sources.some((s) => s.canSupportAuthority);
}

/**
 * Get only the authority-supporting sources from a list.
 */
export function getAuthoritySupportingSources(sources: EvidenceSource[]): EvidenceSource[] {
  return sources.filter((s) => s.canSupportAuthority);
}

/**
 * Get only the descriptive-only sources from a list.
 */
export function getDescriptiveOnlySources(sources: EvidenceSource[]): EvidenceSource[] {
  return sources.filter((s) => !s.canSupportAuthority);
}
