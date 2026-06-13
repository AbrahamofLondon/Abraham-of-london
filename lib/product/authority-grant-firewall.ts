import type { ProductAuthorityState } from "@/lib/product/product-authority-contract";

export type PositiveAuthorityState =
  | "diagnostic_product"
  | "judgement_product"
  | "externally_proven_gold_product";

export type AuthorityProofCheck =
  | "contract_state_exists"
  | "ledger_entry_exists"
  | "scenario_artifact_exists"
  | "rendered_output_artifact_exists"
  | "scenario_hash_matches"
  | "rendered_output_hash_matches"
  | "validation_run_hash_exists"
  | "quality_tests_exist"
  | "boundary_flags_clean"
  | "route_proof_exists"
  | "surface_propagation_exists"
  | "claim_boundary_scan_passes"
  | "no_mock_scan_passes"
  | "board_facing_guard_passes";

export interface AuthorityGrantFirewallInput {
  productCode: string;
  declaredAuthorityState: ProductAuthorityState;
  requiredChecks: Partial<Record<AuthorityProofCheck, boolean>>;
  boardFacingProduct?: boolean;
}

export interface EffectiveAuthorityStateResult {
  productCode: string;
  declaredAuthorityState: ProductAuthorityState;
  effectiveAuthorityState: ProductAuthorityState;
  authoritySuppressionReason: string | null;
  evidenceProofStatus: "proof_complete" | "proof_incomplete" | "not_positive_authority";
  missingChecks: AuthorityProofCheck[];
}

export const POSITIVE_AUTHORITY_STATES: PositiveAuthorityState[] = [
  "diagnostic_product",
  "judgement_product",
  "externally_proven_gold_product",
];

export const CORE_FIREWALL_CHECKS: AuthorityProofCheck[] = [
  "contract_state_exists",
  "ledger_entry_exists",
  "scenario_artifact_exists",
  "rendered_output_artifact_exists",
  "scenario_hash_matches",
  "rendered_output_hash_matches",
  "validation_run_hash_exists",
  "quality_tests_exist",
  "boundary_flags_clean",
  "route_proof_exists",
  "surface_propagation_exists",
  "claim_boundary_scan_passes",
  "no_mock_scan_passes",
];

export function isPositiveAuthorityState(
  state: ProductAuthorityState
): state is PositiveAuthorityState {
  return POSITIVE_AUTHORITY_STATES.includes(state as PositiveAuthorityState);
}

export function resolveEffectiveAuthorityState(
  input: AuthorityGrantFirewallInput
): EffectiveAuthorityStateResult {
  const requiredChecks = input.boardFacingProduct
    ? [...CORE_FIREWALL_CHECKS, "board_facing_guard_passes" as const]
    : CORE_FIREWALL_CHECKS;

  if (!isPositiveAuthorityState(input.declaredAuthorityState)) {
    return {
      productCode: input.productCode,
      declaredAuthorityState: input.declaredAuthorityState,
      effectiveAuthorityState: input.declaredAuthorityState,
      authoritySuppressionReason: null,
      evidenceProofStatus: "not_positive_authority",
      missingChecks: [],
    };
  }

  const missingChecks = requiredChecks.filter(
    (check) => input.requiredChecks[check] !== true
  );

  if (missingChecks.length === 0) {
    return {
      productCode: input.productCode,
      declaredAuthorityState: input.declaredAuthorityState,
      effectiveAuthorityState: input.declaredAuthorityState,
      authoritySuppressionReason: null,
      evidenceProofStatus: "proof_complete",
      missingChecks,
    };
  }

  return {
    productCode: input.productCode,
    declaredAuthorityState: input.declaredAuthorityState,
    effectiveAuthorityState: "pending_reconciliation",
    authoritySuppressionReason: missingChecks[0] ?? "proof_incomplete",
    evidenceProofStatus: "proof_incomplete",
    missingChecks,
  };
}
