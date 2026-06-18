#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadProductAuthorityArtifacts } from "./lib/read-product-authority-backbone.mjs";

const REPORTS_DIR = join(process.cwd(), "reports");
const EXPECTED_TOTAL_PRODUCTS = 43;
const VALID_SOURCE_TYPES = new Set([
  "generated_evidence",
  "legacy_evidence",
  "structured_external_evidence",
  "explicit_missing_evidence",
  "explicit_blocked_evidence",
  "reported_summary_only",
]);
const INVALID_SOURCE_TYPES = new Set(["manual_assertion", "registry_label", "surface_claim"]);

const { contract } = loadProductAuthorityArtifacts();
const products = contract.products;
const errors = [];
const warnings = [];

console.log("PRODUCT AUTHORITY CONTRACT CHECK");
console.log("Validating generated authority contracts from the unified resolver\n");

if (contract.totalProducts !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Expected ${EXPECTED_TOTAL_PRODUCTS} contracts, found ${contract.totalProducts}`);
}

if (products.length !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Contract product array length is ${products.length}, expected ${EXPECTED_TOTAL_PRODUCTS}`);
}

for (const product of products) {
  if (product.contractVersion !== "v2") {
    errors.push(`${product.productCode}: contract version must be v2, found ${product.contractVersion}`);
  }

  if (!VALID_SOURCE_TYPES.has(product.evidenceSourceType)) {
    errors.push(`${product.productCode}: invalid or unexpected evidence source type ${product.evidenceSourceType}`);
  }

  if (INVALID_SOURCE_TYPES.has(product.evidenceSourceType)) {
    errors.push(`${product.productCode}: authority contract uses prohibited source type ${product.evidenceSourceType}`);
  }

  if (product.publicClaimAllowed && product.authorityClearanceState !== "authority_cleared") {
    errors.push(`${product.productCode}: public claim allowed without authority_cleared state`);
  }

  if (
    ["blocked", "evidence_incomplete", "revalidation_required", "not_release_eligible", "not_claim_eligible"].includes(
      product.authorityClearanceState,
    ) &&
    (!Array.isArray(product.blockingReasons) || product.blockingReasons.length === 0)
  ) {
    errors.push(`${product.productCode}: blocked contract state without blocking reasons`);
  }

  if (!product.nextEvidenceAction || typeof product.nextEvidenceAction !== "string") {
    errors.push(`${product.productCode}: missing nextEvidenceAction`);
  }

  if (product.validation?.noMockAuthorityPassed !== true) {
    warnings.push(`${product.productCode}: no-mock authority validation is not marked passed in contract output`);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  totalProducts: products.length,
  contractVersionCounts: contract.summary.contractVersionCounts,
  authorityStateCounts: contract.summary.authorityStateCounts,
  authorityClearanceCounts: contract.summary.authorityClearanceCounts,
  evidenceSourceCounts: contract.summary.evidenceSourceCounts,
  publicClaimAllowed: contract.summary.publicClaimAllowed,
  errors,
  warnings,
  pass: errors.length === 0,
};

writeFileSync(
  join(REPORTS_DIR, "product-authority-contract-check.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);

console.log(`Contracts resolved: ${products.length}`);
console.log(`Public claim allowed: ${result.publicClaimAllowed}`);
console.log(`Written: ${join(REPORTS_DIR, "product-authority-contract-check.json")}`);

if (warnings.length > 0) {
  console.log(`Warnings: ${warnings.length}`);
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

if (errors.length > 0) {
  console.log(`Errors: ${errors.length}`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
}

console.log("PASS");
