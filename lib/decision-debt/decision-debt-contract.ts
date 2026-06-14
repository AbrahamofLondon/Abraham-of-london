/**
 * Decision Debt Contract
 *
 * Quantifies the operational and financial cost of unresolved contradictions,
 * delayed decisions, and repeated failures.
 *
 * Decision Debt informs risk assessment and prioritization.
 * Decision Debt does not grant authority.
 *
 * Uses Phase 1B risk framework taxonomy.
 * Never presents invented precision.
 * Shows confidence bounds and calculation basis.
 */

import type { DecisionDebtRiskFramework } from "./decision-debt-risk-framework";

export type DecisionDebtCategory =
  | "execution_delay"
  | "mandate_fracture"
  | "evidence_gap"
  | "governance_exposure"
  | "project_slippage"
  | "commercial_misalignment"
  | "regulatory_risk"
  | "leadership_drift";

export interface DecisionDebtRecord {
  // Identity
  debtId: string;
  caseId: string;
  organisationId?: string;

  // Source
  sourceEventIds: string[];
  contradictionKeys: string[];

  // Category
  debtCategory: DecisionDebtCategory;

  // Framework alignment (must have at least one)
  alignedFrameworks: DecisionDebtRiskFramework[];

  // Financial estimate (optional, must have basis if present)
  estimatedFinancialRange?: {
    low: number;
    high: number;
    currency: string;
    basis: string;
  };

  // Operational severity
  operationalSeverity: "low" | "medium" | "high" | "critical";

  // Debt scoring
  decisionDebtScore: number; // 0-100

  // Confidence in assessment
  confidence: "low" | "medium" | "high";

  // Calculation basis (why this score/estimate)
  calculationBasis: string[];

  // Guard against false precision
  unsupportedPrecisionBlocked: boolean;

  // Timeline
  unresolvedSince: string;
  lastUpdatedAt: string;

  // Audit protection
  auditLockIds: string[];
}

/**
 * Invariants: Decision Debt Does Not Grant Authority
 */
export const DECISION_DEBT_INVARIANTS = {
  INFORMS_RISK:
    "Decision debt informs risk assessment and prioritization",
  DOES_NOT_GRANT_AUTHORITY:
    "Decision debt scoring cannot grant authority or bypass governance",
  FRAMEWORK_REQUIRED:
    "Every decision debt must align to one or more recognized risk frameworks",
  PRECISION_GUARDED:
    "Financial estimates must show calculation basis and confidence bounds",
  CONFIDENCE_REFLECTS_BASIS:
    "Confidence level must reflect strength of supporting evidence",
  AUDIT_LOCKED:
    "Source events are audit-locked to prevent erasure",
  APPEND_ONLY:
    "Debt records are created or updated, never deleted",
};
