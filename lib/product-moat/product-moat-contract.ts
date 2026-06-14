/**
 * Product Moat Contract
 *
 * Universal interface for all 43 products to access the Enterprise Decision Operating System.
 *
 * Every product resolves to a moat capability record that controls:
 * - Which moat engines it can access
 * - Whether it can write to decision memory
 * - Whether it can read Strategic Twin state
 * - Whether it can trigger consequence verification
 * - Whether it can recommend next products
 *
 * No product directly bypasses this contract.
 * No authority is granted through moat capability.
 * All capability is gated by ProductReleaseReadiness.
 */

export type ProductMoatActivationMode =
  | "active_memory_write"
  | "passive_context_read"
  | "prewired_pending_evidence"
  | "audit_only_blocked"
  | "internal_only";

export interface ProductMoatCapability {
  // Product identity
  productCode: string;
  productName: string;

  // Activation state
  activationMode: ProductMoatActivationMode;

  // Moat engine access permissions
  canReadStrategicTwin: boolean;
  canWriteDecisionMemory: boolean;
  canUpdateStrategicTwin: boolean;
  canTriggerConsequenceVerification: boolean;
  canRunInterventionCalibration: boolean;
  canRecommendNextProduct: boolean;
  canCreateReportingOutput: boolean;

  // Governance context
  authorityState: string;
  readinessStatus: string;
  releaseLane: string;
  releaseMode: string;
  evidencePackageValid?: boolean;

  // Boundary enforcement
  boundaryRequired: boolean;
  boundaryDescription?: string;

  // Gating reason if blocked
  blockedReason?: string;

  // What must happen to activate next level
  nextActivationRequirement?: string;

  // Metadata
  lastVerifiedAt: string;
  requiresReVerificationAt?: string;
}

/**
 * Moat Capability Defaults by Activation Mode
 */
export const MOAT_CAPABILITY_DEFAULTS: Record<
  ProductMoatActivationMode,
  Partial<ProductMoatCapability>
> = {
  active_memory_write: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: true,
    canUpdateStrategicTwin: true,
    canTriggerConsequenceVerification: true,
    canRunInterventionCalibration: true,
    canRecommendNextProduct: true,
    canCreateReportingOutput: true,
    boundaryRequired: true,
    blockedReason: undefined,
  },
  passive_context_read: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
    boundaryRequired: true,
    blockedReason: "Insufficient readiness; read-only context available",
  },
  prewired_pending_evidence: {
    canReadStrategicTwin: false,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
    boundaryRequired: false,
    blockedReason:
      "Product is future-ready but evidence path not yet satisfied",
  },
  audit_only_blocked: {
    canReadStrategicTwin: false,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
    boundaryRequired: false,
    blockedReason: "Product is blocked; audit-only refusal recording allowed",
  },
  internal_only: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
    boundaryRequired: false,
    blockedReason: "Internal infrastructure; not customer-facing",
  },
};

/**
 * Moat Access Control
 * Every moat engine access must flow through this contract.
 */
export interface MoatAccessRequest {
  productCode: string;
  caseId: string;
  requestedEngine: MoatEngine;
  requestType: "read" | "write";
  sourceSurface: string;
}

export type MoatEngine =
  | "decision_memory"
  | "strategic_twin"
  | "consequence_verification"
  | "intervention_calibration"
  | "decision_debt"
  | "falsification_registry"
  | "external_memory"
  | "aggregate_patterns"
  | "authority_escrow"
  | "memory_governance";

export interface MoatAccessDecision {
  productCode: string;
  requestedEngine: MoatEngine;
  accessGranted: boolean;
  reason: string;
  requiresBoundary: boolean;
  boundaryNotice?: string;
}

/**
 * Invariants
 */
export const PRODUCT_MOAT_INVARIANTS = {
  NO_AUTHORITY_GRANT: "Moat capability does not grant authority",
  READINESS_GATES_ALL_ACCESS:
    "All moat access is gated by ProductReleaseReadiness",
  BLOCKED_PRODUCTS_AUDIT_ONLY:
    "Blocked products cannot write to moat engines",
  PREWIRED_NOT_YET_ACTIVE:
    "Prewired products are instantiated but cannot write production memory until evidence gates are satisfied",
  GOVERNANCE_CONTEXT_REQUIRED:
    "All moat writes require governance context (authority state, readiness state, evidence boundary)",
  NO_BYPASS: "No product can bypass moat access control",
  FUTURE_READY_PREWIRED:
    "Future-ready products are pre-wired for eventual activation but remain read-only until readiness gates pass",
};
