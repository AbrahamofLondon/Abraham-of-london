/**
 * Memory Governance Contract
 *
 * Defines enterprise-safe memory classification, governance rights, and
 * the distinction between client-owned raw evidence and system-derived intelligence.
 *
 * Non-negotiable principles:
 * - Client owns raw client evidence
 * - Client can access, correct, export, delete eligible records
 * - System-derived topology is not client data
 * - Immutable audit logs retained only where required
 * - Authority remains separate from governance
 */

export type MemoryStorageClassification =
  | "raw_client_evidence"
  | "user_provided_memory_event"
  | "system_derived_topology"
  | "system_calibration_weight"
  | "aggregate_anonymised_pattern"
  | "immutable_audit_log";

export type MemoryGovernanceRight =
  | "view"
  | "correct"
  | "export"
  | "delete_request"
  | "retain_for_audit"
  | "restrict_processing"
  | "pin"
  | "archive";

export interface MemoryGovernanceRecord {
  recordId: string;
  caseId?: string;
  organisationId?: string;
  productCode?: string;

  classification: MemoryStorageClassification;
  createdAt: string;
  lastReviewedAt?: string;

  isLocked: boolean;
  lockReasons: string[];
  retentionExpiresAt?: string;

  exportEligible: boolean;
  deletionEligible: boolean;
  correctionEligible: boolean;

  derivedIntelligence: boolean;
  userVisibleDescription: string;
}

export interface MemoryGovernancePolicy {
  raw_client_evidence: {
    exportEligible: true;
    deletionEligible: true;
    correctionEligible: true;
    description: "Client-owned raw evidence; client has full data rights";
  };

  user_provided_memory_event: {
    exportEligible: true;
    deletionEligible: true;
    correctionEligible: true;
    description: "Client-provided memory event; client has full data rights";
  };

  system_derived_topology: {
    exportEligible: false;
    deletionEligible: false;
    correctionEligible: false;
    description:
      "System-derived contradiction topology, relational weights; proprietary EDOS intelligence";
  };

  system_calibration_weight: {
    exportEligible: false;
    deletionEligible: false;
    correctionEligible: false;
    description: "System-derived calibration state; proprietary EDOS intelligence";
  };

  aggregate_anonymised_pattern: {
    exportEligible: false;
    deletionEligible: false;
    correctionEligible: false;
    description: "Aggregate pattern library across clients; proprietary EDOS intelligence";
  };

  immutable_audit_log: {
    exportEligible: false;
    deletionEligible: false;
    correctionEligible: false;
    description: "Immutable audit trail required for verification, falsification, or legal retention";
  };
}

export const DEFAULT_MEMORY_GOVERNANCE_POLICY: MemoryGovernancePolicy = {
  raw_client_evidence: {
    exportEligible: true,
    deletionEligible: true,
    correctionEligible: true,
    description: "Client-owned raw evidence; client has full data rights",
  },

  user_provided_memory_event: {
    exportEligible: true,
    deletionEligible: true,
    correctionEligible: true,
    description: "Client-provided memory event; client has full data rights",
  },

  system_derived_topology: {
    exportEligible: false,
    deletionEligible: false,
    correctionEligible: false,
    description:
      "System-derived contradiction topology, relational weights; proprietary EDOS intelligence",
  },

  system_calibration_weight: {
    exportEligible: false,
    deletionEligible: false,
    correctionEligible: false,
    description: "System-derived calibration state; proprietary EDOS intelligence",
  },

  aggregate_anonymised_pattern: {
    exportEligible: false,
    deletionEligible: false,
    correctionEligible: false,
    description: "Aggregate pattern library across clients; proprietary EDOS intelligence",
  },

  immutable_audit_log: {
    exportEligible: false,
    deletionEligible: false,
    correctionEligible: false,
    description: "Immutable audit trail required for verification, falsification, or legal retention",
  },
};

export const MEMORY_GOVERNANCE_INVARIANTS = {
  CLIENT_OWNS_RAW_EVIDENCE:
    "Client owns raw client evidence; export-eligible unless restricted by valid legal/audit basis",
  DERIVED_TOPOLOGY_NOT_EXPORTABLE:
    "System-derived topology is proprietary EDOS intelligence; cannot be exported as client data",
  AUDIT_LOGS_PRESERVED:
    "Immutable audit logs retained where required for verification, falsification, or legal retention",
  CORRECTION_APPENDS:
    "Correction requests append governance history; do not silently mutate original records",
  ERASURE_PRESERVES_LOCKED:
    "Erasure deletes eligible records but preserves audit-locked evidence required for verification/falsification/debt",
  DECAY_SKIPS_LOCKED:
    "Memory decay preserves locked records; fails closed if audit-lock status unavailable",
  AUTHORITY_SEPARATE:
    "Memory governance is separate from authority; governance changes do not affect positive authority = 0",
};

export interface MemoryCorrectionRequest {
  requestId: string;
  recordId: string;
  caseId?: string;
  organisationId?: string;
  requestedAt: string;
  reason: string;
  originalValue?: unknown;
  correctionProposed: string;
  status: "pending" | "approved" | "denied";
  processedAt?: string;
}

export interface MemoryErasureRequest {
  requestId: string;
  organisationId?: string;
  caseId?: string;
  recordIds: string[];
  reason: string;
  requestedAt: string;
  legalBasis?: string;
  status: "pending" | "approved" | "denied" | "partial_approved";
  processedAt?: string;
}
