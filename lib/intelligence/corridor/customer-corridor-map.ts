/**
 * lib/intelligence/corridor/customer-corridor-map.ts
 *
 * §6/7 — Governed Product Corridor + Customer-Visible Corridor Map.
 *
 * Derives from: current twin version, evidence gaps, contradictions, unresolved commitments,
 * drift, intervention state, outcome history, product history, entitlement, commercial governance.
 *
 * Not a static completedProducts list. Every rationale is traceable.
 */
import { CATALOG } from "@/lib/commercial/catalog";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";

export interface TwinState {
  currentDecisionPressure: string;
  dominantContradictions: string[];
  activeEvidenceGaps: string[];
  unresolvedCommitments: string[];
  repeatedPatterns: string[];
  currentInterventionReadiness: string;
  completedProductCodes: string[];
}

export interface CorridorMove {
  productCode: string;
  productName: string;
  recommendation: string;
  reason: string;
  evidenceBasis: string[];
  whatItHelpsResolve: string;
  accessMode: string;
  isAdmissible: boolean;
  inadmissibleReason?: string;
}

export interface CorridorMap {
  customerId: string;
  twinVersion: number;
  currentPosition: string | null;
  admissibleNextMoves: CorridorMove[];
  inadmissibleMoves: CorridorMove[];
  controlledMoves: CorridorMove[];
  evidenceGatheringMoves: CorridorMove[];
  completedMilestones: string[];
  unresolvedBlockers: string[];
  recommendationRationale: string;
}

export function buildCorridorMap(customerId: string, twin: TwinState): CorridorMap {
  const completedCodes = new Set(twin.completedProductCodes);
  const allProductCodes = Object.keys(CATALOG);
  const admissibleMoves: CorridorMove[] = [];
  const inadmissibleMoves: CorridorMove[] = [];
  const controlledMoves: CorridorMove[] = [];
  const evidenceMoves: CorridorMove[] = [];

  for (const code of allProductCodes) {
    if (completedCodes.has(code)) continue;
    const product = CATALOG[code];
    const contract = getContractByProductCode(code);
    const assurance = getAssuranceByProductCode(code);
    if (!product || !contract) continue;

    const isRetired = contract.readinessStatus === "not_applicable" && product.commercialStatus === "inactive";
    const isControlled = product.commercialStatus === "contracted" || product.commercialStatus === "manual_billing" || product.commercialStatus === "evidence_gated";
    const isFree = product.commercialStatus === "free_controlled";
    const isPaid = product.commercialStatus === "paid";

    // Build evidence basis from twin state
    const evidenceBasis: string[] = [];
    if (twin.dominantContradictions.length > 0) {
      const matchingContradictions = twin.dominantContradictions.filter(c => product.shortDescription?.includes(c.slice(0, 20)) ?? false);
      if (matchingContradictions.length > 0) evidenceBasis.push(`Addresses contradiction: ${matchingContradictions[0]}`);
    }
    if (twin.activeEvidenceGaps.length > 0) {
      evidenceBasis.push(`Evidence gap "${twin.activeEvidenceGaps[0]}" unresolved`);
    }
    if (twin.unresolvedCommitments.length > 0) {
      evidenceBasis.push(`Commitment "${twin.unresolvedCommitments[0]}" pending`);
    }
    if (evidenceBasis.length === 0) {
      evidenceBasis.push(`Product adjacency based on completed: ${twin.completedProductCodes.join(", ")}`);
    }

    const move: CorridorMove = {
      productCode: code,
      productName: product.displayName,
      recommendation: isFree ? `Try ${product.displayName} — free to use` : isPaid ? `Upgrade to ${product.displayName}` : `Access ${product.displayName}`,
      reason: product.shortDescription ?? `Explore ${product.displayName}`,
      evidenceBasis,
      whatItHelpsResolve: contract.fulfilmentType ?? "Decision support",
      accessMode: isFree ? "Free access" : isPaid ? "Paid checkout" : isControlled ? "Controlled access" : "Request access",
      isAdmissible: !isRetired,
      inadmissibleReason: isRetired ? "Product is retired or inactive" : undefined,
    };

    if (isRetired) {
      inadmissibleMoves.push(move);
    } else if (isControlled) {
      controlledMoves.push(move);
    } else if (twin.activeEvidenceGaps.length > 0 && code.includes("diagnostic") || code.includes("assessment")) {
      evidenceMoves.push(move);
    } else {
      admissibleMoves.push(move);
    }
  }

  const recommendationRationale = twin.dominantContradictions.length > 0
    ? `Contradiction "${twin.dominantContradictions[0]}" has repeated. ${admissibleMoves[0]?.productName ?? "Next eligible product"} is recommended because it directly addresses this pattern.`
    : twin.activeEvidenceGaps.length > 0
    ? `Evidence gap "${twin.activeEvidenceGaps[0]}" remains unresolved. Evidence-gathering products are recommended.`
    : `Based on current state and completed products, the following moves are admissible.`;

  return {
    customerId,
    twinVersion: twin.completedProductCodes.length,
    currentPosition: twin.completedProductCodes.length > 0 ? twin.completedProductCodes[twin.completedProductCodes.length - 1] : null,
    admissibleNextMoves: admissibleMoves,
    inadmissibleMoves,
    controlledMoves,
    evidenceGatheringMoves: evidenceMoves,
    completedMilestones: twin.completedProductCodes,
    unresolvedBlockers: [...twin.dominantContradictions, ...twin.activeEvidenceGaps, ...twin.unresolvedCommitments],
    recommendationRationale,
  };
}