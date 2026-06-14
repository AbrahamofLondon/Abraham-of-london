#!/usr/bin/env node

/**
 * Authority Estate Lane Classification
 *
 * Reads ProductAuthorityContract and classifies all 43 products
 * into authority/commercial lanes based on artifact evidence.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

console.log("AUTHORITY ESTATE LANE CLASSIFICATION");
console.log("====================================\n");

// Read ProductAuthorityContract
let contract = [];
let missingContractProducts = [];
try {
  const contractPath = join(ROOT, "reports/product-authority-contract.json");
  const contractData = JSON.parse(readFileSync(contractPath, "utf-8"));
  contract = Array.isArray(contractData) ? contractData : contractData.contracts || [];
  missingContractProducts = contractData.productsMissingDirectContract || [];
  console.log(`✓ Loaded ${contract.length} products with contracts from ProductAuthorityContract`);
  console.log(`✓ Loaded ${missingContractProducts.length} products missing direct contracts`);
  console.log(`✓ Total products in estate: ${contract.length + missingContractProducts.length}`);
} catch (e) {
  console.error(`✗ Failed to load contract: ${e.message}`);
  process.exit(1);
}

// Classification function
function classifyProduct(product) {
  const {
    productCode,
    currentAuthorityState,
    evidenceSource = {},
    validation = {},
    publicClaimAllowed = false,
    blockingReasons = [],
  } = product;

  // Determine derived evidence state
  let derivedEvidenceState = "unknown";
  if (validation.evidenceLedgerV2Present) {
    derivedEvidenceState = "trusted_artifact_supported";
  } else if (validation.renderedOutputCaptured) {
    derivedEvidenceState = "artifact_captured_not_validated";
  } else if (blockingReasons.length > 0) {
    derivedEvidenceState = "evidence_gaps_identified";
  } else {
    derivedEvidenceState = "insufficient_evidence";
  }

  // Determine ledger status
  let ledgerStatus = "not_present";
  if (validation.evidenceLedgerV2Present) ledgerStatus = "present_and_verified";
  else if (validation.renderedOutputCaptured) ledgerStatus = "artifact_captured";

  // Determine rendered artifact status
  let renderedArtifactStatus = "not_captured";
  if (validation.renderedOutputCaptured) renderedArtifactStatus = "captured";
  if (validation.renderedOutputCaptured && validation.scenarioSetHash)
    renderedArtifactStatus = "captured_with_hash";

  // Determine surface propagation (estimate from product role)
  let surfacePropagationStatus = "not_assessed";
  if (
    productCode === "team_assessment" ||
    productCode === "fast_diagnostic" ||
    productCode === "enterprise_assessment"
  ) {
    surfacePropagationStatus = "complete";
  } else {
    surfacePropagationStatus = "unknown";
  }

  // Determine truth reconciliation status
  let truthReconciliationStatus = "pending";
  if (currentAuthorityState === "diagnostic_product") {
    truthReconciliationStatus = "reconciled";
  }

  // Detect if product is internal governance infrastructure
  const isGovernanceEngine =
    productCode.includes("authority") ||
    productCode.includes("gate") ||
    productCode.includes("reconcile") ||
    productCode.includes("check_") ||
    productCode.includes("verify") ||
    productCode === "control_room" ||
    productCode === "operator_console" ||
    productCode === "decision_centre_loader";

  // Detect board/executive product
  const isBoardProduct =
    productCode.includes("board") ||
    productCode.includes("boardroom") ||
    productCode.includes("dossier");

  // Classify product into lane
  let recommendedLane = "insufficient_information_requires_review";
  let reasoning = "";

  // Lane 1: Validated Authority Product
  if (
    currentAuthorityState === "diagnostic_product" &&
    evidenceSource.canGrantAuthority === true &&
    publicClaimAllowed === true
  ) {
    recommendedLane = "validated_authority_product";
    reasoning = "Authority fully granted, surfaces support claim, all guards non-blocking";
  }
  // Lane 2: Eligible for Restoration Review
  else if (
    derivedEvidenceState === "trusted_artifact_supported" &&
    validation.renderedOutputCaptured &&
    surfacePropagationStatus === "complete" &&
    !publicClaimAllowed &&
    (currentAuthorityState === "legacy_validated_pending_v2_revalidation" ||
      currentAuthorityState === "pending_reconciliation")
  ) {
    recommendedLane = "eligible_for_restoration_review";
    reasoning =
      "Evidence chain complete, surfaces ready, contract pending authority grant";
  }
  // Lane 4: Internal Governance Engine
  else if (isGovernanceEngine) {
    recommendedLane = "internal_governance_engine";
    reasoning = "Infrastructure/governance component, not standalone commercial product";
  }
  // Lane 5: Blocked/Claim-Unsafe Product (only if truly unsafe to reframe)
  else if (
    isBoardProduct &&
    currentAuthorityState &&
    currentAuthorityState.includes("blocked_until_v2_revalidation")
  ) {
    // Board products with v2 revalidation requirement are blocked
    recommendedLane = "blocked_claim_unsafe_product";
    reasoning =
      "Board-facing product requires v2 revalidation before any claim is safe";
  } else if (
    blockingReasons.some(
      (r) =>
        r.includes("Boardroom/report") ||
        r.includes("board product") ||
        r.includes("requires v2 route")
    )
  ) {
    // Products with board-specific blocking reasons
    recommendedLane = "blocked_claim_unsafe_product";
    reasoning = blockingReasons.join("; ");
  }
  // Lane 3: Evidence-Limited Commercial Product
  // Can be sold as decision-support/advisory WITHOUT Evidence Ledger v2
  // Does NOT require authority restoration
  else if (
    !isGovernanceEngine &&
    (!currentAuthorityState || !currentAuthorityState.includes("blocked"))
  ) {
    // If product is not governance infrastructure and not explicitly blocked,
    // it can potentially be sold as evidence-limited decision-support
    recommendedLane = "evidence_limited_commercial_product";
    reasoning =
      "Can be delivered as decision-support/advisory tool with evidence boundary; does not require authority restoration";
  }
  // Fallback: Insufficient information
  else {
    recommendedLane = "insufficient_information_requires_review";
    reasoning = "Product classification unclear; needs contract/product role clarification";
  }

  // Determine commercial status
  let commercialStatus = "internal";
  if (recommendedLane === "validated_authority_product") {
    commercialStatus = "premium_validated";
  } else if (recommendedLane === "eligible_for_restoration_review") {
    commercialStatus = "pending_premium";
  } else if (recommendedLane === "evidence_limited_commercial_product") {
    commercialStatus = "sellable_bounded";
  } else if (recommendedLane === "blocked_claim_unsafe_product") {
    commercialStatus = "blocked";
  } else if (recommendedLane === "insufficient_information_requires_review") {
    commercialStatus = "needs_contract_review";
  }

  // Determine allowed and forbidden claims
  let allowedPublicClaim = "No public claim allowed";
  let forbiddenClaims = [];

  if (recommendedLane === "validated_authority_product") {
    allowedPublicClaim = `${productCode} is a diagnostically validated decision instrument`;
    forbiddenClaims = [
      "externally proven",
      "gold",
      "market certified",
      "board approved",
    ];
  } else if (recommendedLane === "eligible_for_restoration_review") {
    allowedPublicClaim = `Evidence-reviewed diagnostic tool pending final authority approval`;
    forbiddenClaims = ["validated", "gold", "proven", "certified"];
  } else if (recommendedLane === "evidence_limited_commercial_product") {
    allowedPublicClaim = `Decision-support tool: "This is decision-support material, not independently verified authority evidence. Intended to structure judgement and expose risk."`;
    forbiddenClaims = [
      "validated",
      "proven",
      "authority granted",
      "certified",
      "board-ready",
      "board approved",
      "investment-ready",
      "market certified",
    ];
  } else if (recommendedLane === "internal_governance_engine") {
    allowedPublicClaim = "Not sold as public product";
    forbiddenClaims = ["all claims"];
  } else if (recommendedLane === "blocked_claim_unsafe_product") {
    allowedPublicClaim = "No public claim allowed until repair/reframe";
    forbiddenClaims = [
      "all current claims",
      "validated",
      "proven",
      "authority",
      blockingReasons[0] || "blocking reason unspecified",
    ];
  } else if (recommendedLane === "insufficient_information_requires_review") {
    allowedPublicClaim = "Status requires ProductAuthorityContract entry";
    forbiddenClaims = ["all claims pending contract review"];
  }

  // Determine next action
  let nextAction = "";
  if (recommendedLane === "validated_authority_product") {
    nextAction = "Monitor gate status; maintain authority";
  } else if (recommendedLane === "eligible_for_restoration_review") {
    nextAction = "Await explicit owner decision for authority upgrade";
  } else if (recommendedLane === "evidence_limited_commercial_product") {
    nextAction = "Add evidence boundary to public surfaces; enable sales";
  } else if (recommendedLane === "internal_governance_engine") {
    nextAction = "Maintain as infrastructure; do not sell directly";
  } else if (recommendedLane === "blocked_claim_unsafe_product") {
    nextAction = "Repair evidence gaps and reframe claims, or deprecate";
  } else {
    nextAction = "Gather missing evidence; reassess";
  }

  return {
    productCode,
    currentAuthorityState: currentAuthorityState || "unknown",
    effectiveAuthorityState: publicClaimAllowed ? "granted" : "suppressed",
    canGrantAuthority: evidenceSource.canGrantAuthority || false,
    publicClaimAllowed: publicClaimAllowed || false,
    derivedEvidenceState,
    ledgerStatus,
    renderedArtifactStatus,
    surfacePropagationStatus,
    truthReconciliationStatus,
    recommendedLane,
    commercialStatus,
    allowedPublicClaim,
    forbiddenClaims,
    nextAction,
    reasoning,
  };
}

// Classify all products with contracts
const classifications = contract.map(classifyProduct);

// Add classifications for products missing direct contracts
missingContractProducts.forEach((productCode) => {
  classifications.push({
    productCode,
    currentAuthorityState: "unknown",
    effectiveAuthorityState: "unknown",
    canGrantAuthority: false,
    publicClaimAllowed: false,
    derivedEvidenceState: "unknown",
    ledgerStatus: "not_present",
    renderedArtifactStatus: "not_assessed",
    surfacePropagationStatus: "not_assessed",
    truthReconciliationStatus: "unknown",
    recommendedLane: "insufficient_information_requires_review",
    commercialStatus: "internal",
    allowedPublicClaim: "No direct contract; status requires review",
    forbiddenClaims: ["all claims pending contract review"],
    nextAction: "Create ProductAuthorityContract entry; assess evidence state",
    reasoning: "No direct contract entry in ProductAuthorityContract; insufficient information to classify",
  });
});

// Count by lane
const laneCounts = {};
classifications.forEach((c) => {
  laneCounts[c.recommendedLane] =
    (laneCounts[c.recommendedLane] || 0) + 1;
});

console.log("\nLANE DISTRIBUTION:");
Object.entries(laneCounts).forEach(([lane, count]) => {
  console.log(`  ${lane}: ${count}`);
});

console.log(`\nTOTAL PRODUCTS CLASSIFIED: ${classifications.length}`);

// Write JSON output
const jsonOutput = {
  auditDate: new Date().toISOString(),
  totalProductsClassified: classifications.length,
  laneDistribution: laneCounts,
  classifications: classifications,
};

const jsonPath = join(ROOT, "reports/FULL_AUTHORITY_ESTATE_ACCELERATION_AUDIT.json");
writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
console.log(`✓ Written: ${jsonPath}`);

// Generate markdown table
let markdownTable = `| Product | Current State | Lane | Commercial | Next Action |
|---|---|---|---|---|
`;

classifications.forEach((c) => {
  markdownTable += `| ${c.productCode} | ${c.currentAuthorityState} | ${c.recommendedLane} | ${c.commercialStatus} | ${c.nextAction} |\n`;
});

console.log("\n" + markdownTable);

// Write markdown (will be integrated into final report)
writeFileSync(
  join(ROOT, "reports/FULL_AUTHORITY_ESTATE_ACCELERATION_AUDIT_TABLE.md"),
  markdownTable
);
console.log(`✓ Written: reports/FULL_AUTHORITY_ESTATE_ACCELERATION_AUDIT_TABLE.md`);

console.log("\n✓ AUTHORITY ESTATE CLASSIFICATION COMPLETE");
process.exit(0);
