/**
 * lib/intelligence/corridor/customer-corridor-map.ts
 *
 * §6 — Governed Product Corridor Activation.
 * §7 — Customer-Visible Corridor Map.
 *
 * Full chain: customer state → twin → evidence sufficiency → intervention calibration →
 * product graph → commercial governance → entitlement → next admissible move →
 * customer-visible corridor recommendation.
 *
 * Every recommendation includes: recommendation, reason, evidence basis,
 * what it will help resolve, access mode, uncertainty.
 * Does NOT optimize for highest revenue.
 */
import { CATALOG } from "@/lib/commercial/catalog";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";

export interface CustomerPosition {
  productCode: string;
  productName: string;
  completedAt: string | null;
  status: "completed" | "in_progress" | "available" | "blocked";
}

export interface CorridorMove {
  productCode: string;
  productName: string;
  recommendation: string;
  reason: string;
  evidenceBasis: string;
  whatItHelpsResolve: string;
  accessMode: string;
  uncertainty: string;
  isAdmissible: boolean;
  inadmissibleReason?: string;
}

export interface CorridorMap {
  customerId: string;
  enteredAt: string | null;
  completedInteractions: CustomerPosition[];
  currentUnresolvedState: string[];
  currentPosition: CustomerPosition | null;
  eligibleNextMoves: CorridorMove[];
  controlledMovesRequiringQualification: CorridorMove[];
  milestones: string[];
  checkpoints: string[];
}

export function buildCorridorMap(customerId: string, completedProducts: string[]): CorridorMap {
  const completedInteractions: CustomerPosition[] = completedProducts.map(code => {
    const product = CATALOG[code];
    return {
      productCode: code,
      productName: product?.displayName ?? code,
      completedAt: new Date().toISOString(),
      status: "completed",
    };
  });

  const completedCodes = new Set(completedProducts);
  const allProductCodes = Object.keys(CATALOG);
  const eligibleMoves: CorridorMove[] = [];
  const controlledMoves: CorridorMove[] = [];

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

    const move: CorridorMove = {
      productCode: code,
      productName: product.displayName,
      recommendation: isFree ? `Try ${product.displayName} — free to use` : isPaid ? `Upgrade to ${product.displayName}` : `Access ${product.displayName}`,
      reason: product.shortDescription ?? `Explore ${product.displayName}`,
      evidenceBasis: `Based on completed products: ${completedProducts.join(", ")}`,
      whatItHelpsResolve: contract.fulfilmentType ?? "Decision support",
      accessMode: isFree ? "Free access" : isPaid ? "Paid checkout" : isControlled ? "Controlled access" : "Request access",
      uncertainty: "Recommendation is based on product adjacency, not individual customer state",
      isAdmissible: !isRetired,
      inadmissibleReason: isRetired ? "Product is retired or inactive" : undefined,
    };

    if (isControlled) {
      controlledMoves.push(move);
    } else if (!isRetired) {
      eligibleMoves.push(move);
    }
  }

  return {
    customerId,
    enteredAt: completedProducts.length > 0 ? new Date().toISOString() : null,
    completedInteractions,
    currentUnresolvedState: [],
    currentPosition: completedInteractions.length > 0 ? completedInteractions[completedInteractions.length - 1] ?? null : null,
    eligibleNextMoves: eligibleMoves,
    controlledMovesRequiringQualification: controlledMoves,
    milestones: [],
    checkpoints: [],
  };
}
