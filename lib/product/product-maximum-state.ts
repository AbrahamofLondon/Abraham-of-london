/**
 * Product Maximum-State Model
 *
 * Every product is classified by the strongest claim it can honestly make.
 * This determines the "maximum state" the product is authorized to present.
 *
 * A product must not remain below its maximumAchievableNow state if the upgrade
 * can be completed without external dependency (live payment, webhook, major redesign).
 *
 * The pass must upgrade every locally upgradeable product to its strongest honest state.
 */

export type ProductMaximumState =
  | "static_reference"
  | "signal_product"
  | "diagnostic_product"
  | "judgement_product"
  | "simulation_product"
  | "governed_decision_product"
  | "board_grade_product"
  | "externally_proven_gold_product"
  | "internal_only"
  | "blocked_until_evidence"
  | "dormant"
  | "retired";

export interface ProductStateAssessment {
  productCode: string;
  productFamily: string;
  commercialStatus: string;
  currentClaimedState: ProductMaximumState;
  evidenceSupportedState: ProductMaximumState;
  maximumAchievableNow: ProductMaximumState;
  blockedFromHigherStateBecause: Array<{
    reason: string;
    type: "external_dependency" | "internal_blocker" | "missing_evidence" | "requires_redesign";
  }>;
  immediateUpgradeAvailable: boolean;
  upgradeAppliedThisPass: boolean;
  upgradeAction?: string;
  remainingUpgradePath: Array<{
    nextState: ProductMaximumState;
    blocker: string;
  }>;
  finalStateAfterPass: ProductMaximumState;
  finalStateReason: string;
}

export const STATE_HIERARCHY: ProductMaximumState[] = [
  "static_reference",
  "signal_product",
  "diagnostic_product",
  "judgement_product",
  "simulation_product",
  "governed_decision_product",
  "board_grade_product",
  "externally_proven_gold_product",
];

export function stateRank(state: ProductMaximumState): number {
  const idx = STATE_HIERARCHY.indexOf(state);
  if (state === "internal_only" || state === "blocked_until_evidence" || state === "dormant" || state === "retired") {
    return -1;
  }
  return idx >= 0 ? idx : -1;
}

export function stateIsHigherThan(a: ProductMaximumState, b: ProductMaximumState): boolean {
  return stateRank(a) > stateRank(b);
}

export function describeState(state: ProductMaximumState): string {
  const descriptions: Record<ProductMaximumState, string> = {
    static_reference: "Static reference asset (no computation, no judgement claims)",
    signal_product: "Extracts and signals patterns from input (no causal claim)",
    diagnostic_product: "Produces diagnosis from interpreted signals (no judgement)",
    judgement_product: "Synthesizes judgement from reasoning chain (with reasoning transparency)",
    simulation_product: "Simulates scenarios and models consequences (with alternatives)",
    governed_decision_product: "Decision output under governance review (operator-signed)",
    board_grade_product: "Board-ready output with full reasoning spine and alternatives",
    externally_proven_gold_product: "Gold-standard proven by external benchmark",
    internal_only: "Internal-only product (no customer-facing release)",
    blocked_until_evidence: "Blocked pending required evidence collection",
    dormant: "Dormant product (not actively sold)",
    retired: "Retired/decommissioned product (no surface)",
  };
  return descriptions[state];
}

export function isCustomerFacing(state: ProductMaximumState): boolean {
  return state !== "internal_only" && state !== "blocked_until_evidence" && state !== "dormant" && state !== "retired";
}
