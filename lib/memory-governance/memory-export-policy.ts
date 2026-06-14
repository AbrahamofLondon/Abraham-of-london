/**
 * Memory Export Policy
 *
 * Defines what can be exported (client-owned raw evidence) and what cannot
 * (proprietary EDOS-derived topology, calibration, aggregate patterns).
 *
 * Hard rule: Derived topology export is structurally impossible.
 */

export interface MemoryExportPayload {
  exportId: string;
  organisationId: string;
  requestedAt: string;
  exportedAt: string;

  includedRecords: Array<{
    recordId: string;
    caseId?: string;
    classification: "raw_client_evidence" | "user_provided_memory_event";
    createdAt: string;
    payload: unknown;
    userVisibleDescription: string;
  }>;

  excludedDerivedCategories: Array<{
    classification:
      | "system_derived_topology"
      | "system_calibration_weight"
      | "aggregate_anonymised_pattern"
      | "immutable_audit_log";
    reason: string;
    exampleContent?: string;
  }>;

  derivedIntelligenceExcluded: true;

  humanReadableDescription: string;

  authorityBoundary: {
    exportGrantsAuthority: false;
    positiveAuthorityGranted: false;
  };
}

export interface MemoryExportRequest {
  requestId: string;
  organisationId: string;
  caseId?: string;
  requestedAt: string;
  legalBasis?: string;
  status: "pending" | "approved" | "denied" | "ready_for_download";
  approvedAt?: string;
}

/**
 * Memory Export Policy Enforcement
 */
export class MemoryExportPolicyEnforcer {
  /**
   * Determine if a record is export-eligible
   */
  static isExportEligible(
    classification: string,
    isLocked: boolean,
    lockReasons: string[]
  ): boolean {
    // Raw client evidence is exportable unless locked
    if (classification === "raw_client_evidence" && !isLocked) {
      return true;
    }

    // User-provided memory is exportable unless locked
    if (classification === "user_provided_memory_event" && !isLocked) {
      return true;
    }

    // All derived/audit types are NOT exportable
    if (
      [
        "system_derived_topology",
        "system_calibration_weight",
        "aggregate_anonymised_pattern",
        "immutable_audit_log",
      ].includes(classification)
    ) {
      return false;
    }

    return false;
  }

  /**
   * Build export payload (export-eligible records only)
   */
  static buildExportPayload(
    organisationId: string,
    eligibleRecords: any[],
    excludedRecords: any[]
  ): MemoryExportPayload {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Categorize excluded records
    const excludedByType = new Map<string, number>();
    const excludedReasons = new Map<string, string>();

    for (const record of excludedRecords) {
      const type = record.classification;
      excludedByType.set(type, (excludedByType.get(type) || 0) + 1);

      if (!excludedReasons.has(type)) {
        if (type === "system_derived_topology") {
          excludedReasons.set(
            type,
            "Proprietary system-derived contradiction topology and relational weights"
          );
        } else if (type === "system_calibration_weight") {
          excludedReasons.set(
            type,
            "Proprietary system-derived calibration state and recurrence weighting"
          );
        } else if (type === "aggregate_anonymised_pattern") {
          excludedReasons.set(
            type,
            "Aggregate pattern library derived from cross-client intelligence"
          );
        } else if (type === "immutable_audit_log") {
          excludedReasons.set(
            type,
            "Immutable audit trail required for verification, falsification, and legal retention"
          );
        }
      }
    }

    const excludedDerivedCategories = Array.from(excludedByType.entries()).map(
      ([type, count]) => ({
        classification: type as any,
        reason: excludedReasons.get(type) || "Not exportable",
        count,
      })
    );

    return {
      exportId,
      organisationId,
      requestedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),

      includedRecords: eligibleRecords.map((r) => ({
        recordId: r.recordId,
        caseId: r.caseId,
        classification: r.classification,
        createdAt: r.createdAt,
        payload: r.payload,
        userVisibleDescription: r.userVisibleDescription,
      })),

      excludedDerivedCategories,

      derivedIntelligenceExcluded: true,

      humanReadableDescription: `This export contains ${eligibleRecords.length} client-owned raw evidence and user-provided memory records. ` +
        `Excluded from export: ${excludedByType.size} derived intelligence categories ` +
        `(${excludedDerivedCategories.map((c) => `${c.classification} (${c.count})`).join(", ")}). ` +
        `System-derived topology, calibration weights, and aggregate patterns are proprietary EDOS intelligence ` +
        `and cannot be recreated in another system.`,

      authorityBoundary: {
        exportGrantsAuthority: false,
        positiveAuthorityGranted: false,
      },
    };
  }

  /**
   * Verify export payload does NOT leak derived topology
   */
  static verifyExportPayloadSafety(payload: MemoryExportPayload): boolean {
    // Check that included records are only client-owned types
    const unsafeTypes = payload.includedRecords.some((r) =>
      [
        "system_derived_topology",
        "system_calibration_weight",
        "aggregate_anonymised_pattern",
        "immutable_audit_log",
      ].includes(r.classification)
    );

    if (unsafeTypes) {
      return false;
    }

    // Check that derived intelligence is marked as excluded
    if (!payload.derivedIntelligenceExcluded) {
      return false;
    }

    // Check that authority boundary is correct
    if (payload.authorityBoundary.exportGrantsAuthority) {
      return false;
    }

    return true;
  }
}

/**
 * Hard rule: Derived topology export is structurally impossible
 *
 * This constant documents the architectural constraint that prevents
 * even accidental export of proprietary topology.
 *
 * There is no allowDerivedTopologyExport config option.
 * There is no override switch.
 * Derived topology export would require a separate, explicitly-approved
 * legal/product redesign and new governance route.
 */
export const DERIVED_TOPOLOGY_EXPORT_PROTECTION = {
  status: "STRUCTURALLY_IMPOSSIBLE",
  reason: "Derived topology is not included in export-eligible classifications",
  override_allowed: false,
  requires_redesign: "explicit_product_decision_and_legal_approval",
} as const;
