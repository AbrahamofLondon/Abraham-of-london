#!/usr/bin/env node

/**
 * Generate Product Release Governance Matrix
 *
 * Creates a complete governance matrix for all 43 products
 * including release mode, commercial eligibility, checkout/fulfillment
 * permissions, and boundary requirements.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

console.log("GENERATE PRODUCT RELEASE GOVERNANCE MATRIX");
console.log("==========================================\n");

// Load ProductAuthorityContract
let contract = {};
try {
  const contractPath = join(ROOT, "data", "ProductAuthorityContract.json");
  const contractContent = readFileSync(contractPath, "utf-8");
  contract = JSON.parse(contractContent);
  console.log(`✓ Loaded ProductAuthorityContract with ${Object.keys(contract).length} products\n`);
} catch (e) {
  console.error("❌ Failed to load ProductAuthorityContract:", e.message);
  process.exit(1);
}

const EVIDENCE_BOUNDARIES = {
  decision_support:
    "This is decision-support material, not independently verified authority evidence. It is designed to structure judgment and expose decision risk; it does not grant validated product authority.",
  advisory_review:
    "This is an advisory decision-support review. It is not independently verified authority evidence and should not be treated as a formal audit, certification, or assurance opinion.",
  board_facing_draft:
    "This is board discussion material prepared to support board review. It is not board-approved, board-certified, or investment-grade authority proof.",
  diagnostic_pending_authority:
    "This diagnostic is evidence-reviewed and pending final authority approval. It should be treated as advisory until authority is formally restored.",
  validated_authority_instrument:
    "This is a validated authority instrument. Evidence chain complete. Use per authority specifications.",
  none: "",
};

const GOVERNANCE_MATRIX = {};
let classifiedCount = 0;
let insufficientCount = 0;
let blockedCount = 0;

// Process each product
Object.entries(contract).forEach(([productCode, product]) => {
  const authorityState = product.currentAuthorityState || "unknown";
  let releaseLane = "insufficient_information_requires_review";
  let releaseMode = "internal_only";
  let canGrantAuthority = false;
  let publicClaimAllowed = false;
  let commercialClaimAllowed = false;
  let checkoutAllowed = false;
  let manualFulfilmentAllowed = false;
  let requiredBoundaryVariant = "none";
  let forbiddenClaims = [];
  let allowedClaims = [];
  let revocationConditions = [];
  let evidenceBasis = [];
  let nextAction = "";

  // Classification logic
  if (authorityState === "blocked_until_claim_evidenced" || authorityState === "blocked_until_v2_revalidation") {
    releaseLane = "blocked_claim_unsafe_product";
    releaseMode = "blocked";
    nextAction = "Cannot be sold until authority state changes";
    classifiedCount++;
  } else if (authorityState === "diagnostic_product" || authorityState === "diagnostic_product_pending_evidence_validation") {
    releaseLane = "evidence_limited_commercial_product";
    releaseMode = "manual_fulfilment_only";
    commercialClaimAllowed = true;
    manualFulfilmentAllowed = true;
    checkoutAllowed = false;
    requiredBoundaryVariant = "diagnostic_pending_authority";
    forbiddenClaims = ["validated", "certified", "external proof", "board assurance"];
    allowedClaims = ["advisory review", "evidence-limited", "decision-support"];
    revocationConditions = ["authority_blocked", "gate_failure"];
    nextAction = "Monitor authority restoration eligibility";
    classifiedCount++;
  } else if (authorityState === "externally_proven_gold_product") {
    releaseLane = "validated_authority_product";
    releaseMode = "public_sellable";
    canGrantAuthority = true;
    publicClaimAllowed = true;
    commercialClaimAllowed = true;
    checkoutAllowed = true;
    manualFulfilmentAllowed = true;
    requiredBoundaryVariant = "validated_authority_instrument";
    allowedClaims = ["validated", "certified", "externally proven"];
    revocationConditions = ["gate_failure"];
    nextAction = "Ready for full market positioning";
    classifiedCount++;
  } else if (authorityState === "legacy_validated_pending_v2_revalidation") {
    releaseLane = "eligible_for_restoration_review";
    releaseMode = "manual_fulfilment_only";
    commercialClaimAllowed = true;
    manualFulfilmentAllowed = true;
    checkoutAllowed = false;
    requiredBoundaryVariant = "diagnostic_pending_authority";
    forbiddenClaims = ["validated", "certified", "externally proven"];
    allowedClaims = ["evidence-limited", "pending authority", "advisory"];
    revocationConditions = ["authority_blocked", "gate_failure"];
    nextAction = "Pending owner decision for restoration";
    classifiedCount++;
  } else if (
    authorityState === "measurement_inconclusive" ||
    authorityState === "internal_only" ||
    authorityState === "static_reference"
  ) {
    releaseLane = "insufficient_information_requires_review";
    releaseMode = "internal_only";
    nextAction = "Requires contract entry and evidence classification";
    insufficientCount++;
  } else {
    releaseLane = "insufficient_information_requires_review";
    releaseMode = "internal_only";
    nextAction = `Unknown authority state: ${authorityState}`;
    insufficientCount++;
  }

  GOVERNANCE_MATRIX[productCode] = {
    productCode,
    productName: product.productName || productCode,
    releaseLane,
    authorityState,
    effectiveAuthorityState: commercialClaimAllowed ? "granted" : canGrantAuthority ? "granted" : "suppressed",
    canGrantAuthority,
    publicClaimAllowed,
    commercialClaimAllowed,
    releaseMode,
    checkoutAllowed,
    manualFulfilmentAllowed,
    requiredBoundaryVariant,
    boundaryDescription: EVIDENCE_BOUNDARIES[requiredBoundaryVariant] || "",
    forbiddenClaims,
    allowedClaims,
    requiresFulfilmentAuthorityRecording: commercialClaimAllowed,
    fulfilmentMustRecordBoundaryAcceptance: commercialClaimAllowed,
    manualReviewRequired: releaseLane !== "validated_authority_product",
    revocationConditions,
    evidenceBasis,
    nextAction,
    governanceSnapshot: new Date().toISOString(),
  };
});

console.log("CLASSIFICATION RESULTS\n");
console.log(`✓ Classified into release lanes: ${classifiedCount}`);
console.log(`✗ Requiring review: ${insufficientCount}`);
console.log(`\nTotal products: ${Object.keys(GOVERNANCE_MATRIX).length}/43\n`);

// Lane distribution
const laneDistribution = {};
Object.values(GOVERNANCE_MATRIX).forEach((g) => {
  laneDistribution[g.releaseLane] = (laneDistribution[g.releaseLane] || 0) + 1;
});

console.log("LANE DISTRIBUTION:");
Object.entries(laneDistribution)
  .sort((a, b) => b[1] - a[1])
  .forEach(([lane, count]) => {
    console.log(`  ${lane}: ${count}`);
  });

console.log("\n");

// Write JSON matrix
const matrixJsonPath = join(ROOT, "reports", "product-release-governance-matrix.json");
writeFileSync(matrixJsonPath, JSON.stringify(GOVERNANCE_MATRIX, null, 2));
console.log(`✓ Written to ${matrixJsonPath}\n`);

// Generate Markdown matrix
const mdPath = join(ROOT, "reports", "product-release-governance-matrix.md");
const mdContent = `# Product Release Governance Matrix

**Date:** ${new Date().toISOString().split("T")[0]}
**Total Products:** ${Object.keys(GOVERNANCE_MATRIX).length}
**Classified:** ${classifiedCount}
**Requiring Review:** ${insufficientCount}

## Lane Distribution

| Lane | Count | Status |
|---|---|---|
${Object.entries(laneDistribution)
  .sort((a, b) => b[1] - a[1])
  .map(([lane, count]) => `| ${lane} | ${count} | |`)
  .join("\n")}

## Product Governance Index

${Object.entries(GOVERNANCE_MATRIX)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(
    ([code, g]) => `
### ${g.productName}

**Product Code:** \`${code}\`
**Release Lane:** ${g.releaseLane}
**Release Mode:** ${g.releaseMode}
**Authority State:** ${g.authorityState}

**Commercial:**
- Public Claims Allowed: ${g.publicClaimAllowed ? "✓ Yes" : "✗ No"}
- Commercial Claims Allowed: ${g.commercialClaimAllowed ? "✓ Yes" : "✗ No"}
- Can Grant Authority: ${g.canGrantAuthority ? "✓ Yes" : "✗ No"}

**Sales Channels:**
- Checkout Allowed: ${g.checkoutAllowed ? "✓ Yes" : "✗ No"}
- Manual Fulfillment Allowed: ${g.manualFulfilmentAllowed ? "✓ Yes" : "✗ No"}

**Evidence Boundary:** ${g.requiredBoundaryVariant}

**Allowed Claims:** ${g.allowedClaims.length > 0 ? g.allowedClaims.join(", ") : "None"}
**Forbidden Claims:** ${g.forbiddenClaims.length > 0 ? g.forbiddenClaims.join(", ") : "None"}

**Next Action:** ${g.nextAction}
`
  )
  .join("\n")}
`;

writeFileSync(mdPath, mdContent);
console.log(`✓ Written to ${mdPath}\n`);

console.log("MATRIX GENERATION: COMPLETE");
process.exit(0);
