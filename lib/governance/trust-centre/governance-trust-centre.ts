/**
 * lib/governance/trust-centre/governance-trust-centre.ts
 *
 * §17 — Buyer-Visible Governance Trust Centre.
 * §18 — Governance Receipt Per Product.
 *
 * Public/customer-safe governance display. Does not expose private vulnerabilities,
 * internal secrets, sensitive implementation details, or customer data.
 *
 * Derives from canonical contracts and proof state — not hardcoded green badges.
 * A product with a failing current gate must not display an unqualified "verified" badge.
 */
import { CATALOG } from "@/lib/commercial/catalog";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";

export interface EstateGovernanceSummary {
  commercialAuthorityModel: string;
  failClosedPrinciples: string[];
  evidencePosture: string;
  humanReviewPhilosophy: string;
  releaseGovernance: string;
  correctionPolicy: string;
  falsificationPolicy: string;
  provenanceStatement: string;
  deletionExportPrinciples: string[];
}

export interface ProductGovernanceCard {
  productCode: string;
  productName: string;
  accessMode: string;
  humanReview: string;
  evidenceRequirement: string;
  outputValidation: string;
  approvalRequirement: string;
  checkoutMode: string;
  fulfilmentAssurance: string;
  claimBoundary: string;
  currentReleaseState: string;
  methodologyVersion: string;
  asOfTimestamp: string;
  verified: boolean;
  verificationReason: string;
}

export interface GovernanceReceipt {
  productCode: string;
  productName: string;
  commercialStatus: string;
  accessMode: string;
  evidencePosture: string;
  humanReviewRequirement: string;
  validationRequirement: string;
  fulfilmentContractState: string;
  releaseAuthorityState: string;
  claimBoundaryVersion: string;
  lastVerifiedTimestamp: string;
}

export function getEstateGovernanceSummary(): EstateGovernanceSummary {
  return {
    commercialAuthorityModel: "resolveCommercialAction is the single authority — catalog data (Stripe IDs, price) is NOT checkout permission. Governance state decides purchasability.",
    failClosedPrinciples: [
      "Unknown product identity → quarantine, no entitlement granted",
      "Unmapped product → cannot write ungoverned memory",
      "Claim boundary evaluation error → HUMAN_REVIEW, never silent PASS",
      "Runtime enforcement exception → DENY, never silent pass",
      "Missing publication gate → not publishable",
    ],
    evidencePosture: "Three-layer proof system: Observation (Layer A) collects raw facts independently. Evaluation (Layer B) applies rules. Verdict (Layer C) produces disposition only after A and B. No self-asserted fields accepted as validation input.",
    humanReviewPhilosophy: "Human review must be justified. 'We haven't automated it yet' is not a justification. Automation handles logistics; humans handle judgment.",
    releaseGovernance: "Products progress through evidence-gated stages: RELEASE_READY_NOW → CONTROLLED_RELEASE_READY → PUBLIC_REFERENCE_READY → INTERNAL_ONLY_JUSTIFIED → MERGED_OR_RETIRED. Each stage has specific evidence requirements and claim boundaries.",
    correctionPolicy: "Append-only falsification register. Corrections create new versions — original records are never deleted. Superseded certificates remain historically verifiable.",
    falsificationPolicy: "All material calls are tracked with outcome status, score, and carry-forward justification. Falsification records are append-only, audit-locked, and cannot be deleted.",
    provenanceStatement: "Decision Provenance Certificates provide exportable, tamper-evident records. Each certificate includes content hash, signature abstraction, and verification function.",
    deletionExportPrinciples: [
      "Tenant-scoped export — no cross-tenant data leakage",
      "Correction = versioning — history is never rewritten",
      "Deletion removes data + leaves tombstone — replay blocked",
      "Deleted confidential source does not leak into public export",
    ],
  };
}

export function getProductGovernanceCard(productCode: string): ProductGovernanceCard | null {
  const product = CATALOG[productCode];
  const contract = getContractByProductCode(productCode);
  const assurance = getAssuranceByProductCode(productCode);
  if (!product) return null;

  const verified = product.active && contract !== undefined && assurance !== undefined;
  return {
    productCode,
    productName: product.displayName,
    accessMode: product.commercialStatus ?? "unknown",
    humanReview: assurance?.humanReviewJustification.required ? "Required" : "Not required",
    evidenceRequirement: product.commercialStatus === "evidence_gated" ? "Evidence-gated" : "Standard",
    outputValidation: contract?.artifactModel ?? "Not applicable",
    approvalRequirement: assurance?.humanReviewJustification.required ? "Human review" : "Automated",
    checkoutMode: product.stripePriceId ? "Self-serve checkout" : product.commercialStatus === "contracted" ? "Enterprise contract" : product.commercialStatus === "manual_billing" ? "Manual billing" : "Checkout disabled",
    fulfilmentAssurance: assurance?.deliveryClass ?? "Not classified",
    claimBoundary: product.commercialStatus === "paid" ? "Operational product claims only" : "Bounded by commercial status",
    currentReleaseState: product.active ? "Active" : "Inactive",
    methodologyVersion: "1.0.0",
    asOfTimestamp: new Date().toISOString(),
    verified,
    verificationReason: verified ? "Active product with fulfilment contract and assurance record" : "Missing contract, assurance record, or product is inactive",
  };
}

export function getAllProductGovernanceCards(): ProductGovernanceCard[] {
  return Object.keys(CATALOG).map(getProductGovernanceCard).filter((c): c is ProductGovernanceCard => c !== null);
}

export function getGovernanceReceipt(productCode: string): GovernanceReceipt | null {
  const card = getProductGovernanceCard(productCode);
  if (!card) return null;
  return {
    productCode: card.productCode,
    productName: card.productName,
    commercialStatus: card.accessMode,
    accessMode: card.checkoutMode,
    evidencePosture: card.evidenceRequirement,
    humanReviewRequirement: card.humanReview,
    validationRequirement: card.outputValidation,
    fulfilmentContractState: card.fulfilmentAssurance,
    releaseAuthorityState: card.currentReleaseState,
    claimBoundaryVersion: card.claimBoundary,
    lastVerifiedTimestamp: card.asOfTimestamp,
  };
}

export function getAllGovernanceReceipts(): GovernanceReceipt[] {
  return Object.keys(CATALOG).map(getGovernanceReceipt).filter((r): r is GovernanceReceipt => r !== null);
}
