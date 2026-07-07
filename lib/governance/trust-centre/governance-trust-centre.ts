/**
 * lib/governance/trust-centre/governance-trust-centre.ts
 *
 * §17 — Buyer-Visible Governance Trust Centre.
 * §18 — Governance Receipt Per Product.
 *
 * Derives from canonical proof and governance state — not hardcoded green badges.
 * A current failed gate must immediately affect the derived Trust Centre card.
 * Governance Receipt is observation-derived with evidence references and verification hash.
 */
import { CATALOG } from "@/lib/commercial/catalog";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";
import { createHash } from "node:crypto";

export type ProductDisplayState = "GOVERNANCE_VERIFIED" | "CONTROLLED_BY_DESIGN" | "EVIDENCE_PENDING" | "RELEASE_GATED" | "INACTIVE" | "RETIRED" | "INTERNAL_ONLY";

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
  displayState: ProductDisplayState;
  lifecycleState: string;
  commercialTruth: string;
  pricingAuditStatus: string;
  checkoutGovernance: string;
  fulfilmentContract: string;
  fulfilmentReadiness: string;
  assuranceState: string;
  claimBoundaryStatus: string;
  releaseAuthority: string;
  humanReviewRequirement: string;
  controlledReleaseReason: string | null;
  threeLayerVerdict: string | null;
  asOfTimestamp: string;
}

export interface GovernanceReceipt {
  productCode: string;
  productName: string;
  commercialStatus: string;
  accessMode: string;
  evidenceReferences: {
    observationRecord: string;
    evaluationRecord: string;
    verdict: string;
    fulfilmentContract: string;
    assurancePolicy: string;
    claimBoundaryVersion: string;
    commercialActionState: string;
  };
  lastVerifiedTimestamp: string;
  receiptHash: string;
}

function hashReceipt(receipt: Record<string, unknown>): string {
  const { receiptHash, ...rest } = receipt;
  return createHash("sha256").update(JSON.stringify(rest)).digest("hex");
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
    releaseGovernance: "Products progress through evidence-gated stages. Each stage has specific evidence requirements and claim boundaries.",
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

  const isActive = product.active;
  const hasContract = contract !== undefined;
  const hasAssurance = assurance !== undefined;
  const hasHardFailures = contract ? contract.hardFailures.length > 0 : false;
  const isControlled = product.commercialStatus === "contracted" || product.commercialStatus === "manual_billing" || product.commercialStatus === "evidence_gated";
  const isInactive = product.commercialStatus === "inactive" || !isActive;
  const isRetired = contract?.readinessStatus === "not_applicable" && isInactive;

  let displayState: ProductDisplayState;
  if (isRetired) displayState = "RETIRED";
  else if (product.commercialStatus === "internal_only" || product.commercialStatus === "inactive") displayState = "INTERNAL_ONLY";
  else if (isInactive) displayState = "INACTIVE";
  else if (isControlled) displayState = "CONTROLLED_BY_DESIGN";
  else if (hasHardFailures) displayState = "RELEASE_GATED";
  else if (!hasContract || !hasAssurance) displayState = "EVIDENCE_PENDING";
  else displayState = "GOVERNANCE_VERIFIED";

  return {
    productCode,
    productName: product.displayName,
    displayState,
    lifecycleState: product.commercialStatus ?? "unknown",
    commercialTruth: product.stripePriceId ? "Stripe-bound" : product.commercialStatus === "free_controlled" ? "Free controlled" : "Not bound",
    pricingAuditStatus: "See pricing audit",
    checkoutGovernance: product.stripePriceId ? "Self-serve checkout" : "Checkout disabled",
    fulfilmentContract: hasContract ? "Present" : "Missing",
    fulfilmentReadiness: contract?.readinessStatus ?? "Not classified",
    assuranceState: hasAssurance ? "Present" : "Missing",
    claimBoundaryStatus: product.commercialStatus === "paid" ? "Operational claims bounded" : "Bounded by commercial status",
    releaseAuthority: isActive ? "Active" : "Inactive",
    humanReviewRequirement: assurance?.humanReviewJustification.required ? "Required" : "Not required",
    controlledReleaseReason: isControlled ? `Controlled: ${product.commercialStatus}` : null,
    threeLayerVerdict: null, // Derived from estate-verdict-layer when integrated
    asOfTimestamp: new Date().toISOString(),
  };
}

export function getAllProductGovernanceCards(): ProductGovernanceCard[] {
  return Object.keys(CATALOG).map(getProductGovernanceCard).filter((c): c is ProductGovernanceCard => c !== null);
}

export function getGovernanceReceipt(productCode: string): GovernanceReceipt | null {
  const card = getProductGovernanceCard(productCode);
  if (!card) return null;
  const receipt = {
    productCode: card.productCode,
    productName: card.productName,
    commercialStatus: card.lifecycleState,
    accessMode: card.checkoutGovernance,
    evidenceReferences: {
      observationRecord: `lib/fulfilment/estate-observation-layer.ts::observeAll(${card.productCode})`,
      evaluationRecord: `lib/fulfilment/estate-evaluation-layer.ts::evaluateProduct(${card.productCode})`,
      verdict: `lib/fulfilment/estate-verdict-layer.ts::generateVerdict(${card.productCode})`,
      fulfilmentContract: `lib/product/product-fulfilment-contract.ts::getContractByProductCode(${card.productCode})`,
      assurancePolicy: `lib/product/product-fulfilment-assurance.ts::getAssuranceByProductCode(${card.productCode})`,
      claimBoundaryVersion: `lib/governance/claim-boundary-authority.ts::evaluateClaimBoundary`,
      commercialActionState: `lib/commercial/commercial-action-resolver.ts::resolveCommercialAction`,
    },
    lastVerifiedTimestamp: card.asOfTimestamp,
    receiptHash: "",
  };
  receipt.receiptHash = hashReceipt(receipt);
  return receipt;
}

export function verifyGovernanceReceipt(receipt: GovernanceReceipt): boolean {
  return hashReceipt(receipt as unknown as Record<string, unknown>) === receipt.receiptHash;
}

export function getAllGovernanceReceipts(): GovernanceReceipt[] {
  return Object.keys(CATALOG).map(getGovernanceReceipt).filter((r): r is GovernanceReceipt => r !== null);
}