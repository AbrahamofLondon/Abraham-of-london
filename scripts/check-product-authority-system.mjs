#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadProductAuthorityArtifacts } from "./lib/read-product-authority-backbone.mjs";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const ADMIN_SURFACE_PATH = join(ROOT, "pages/admin/product-authority.tsx");
const EXPECTED_TOTAL_PRODUCTS = 43;

const errors = [];
const warnings = [];

const { backbone, ledger } = loadProductAuthorityArtifacts();
const products = backbone.products;

console.log("PRODUCT AUTHORITY SYSTEM CHECK");
console.log("Validating canonical backbone artifacts and admin surface wiring\n");

if (backbone.totalProducts !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Expected ${EXPECTED_TOTAL_PRODUCTS} products, found ${backbone.totalProducts}`);
}

if (products.length !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Backbone product array length is ${products.length}, expected ${EXPECTED_TOTAL_PRODUCTS}`);
}

for (const product of products) {
  const missingFields = [];
  if (!product.productId) missingFields.push("productId");
  if (!product.productName) missingFields.push("productName");
  if (!product.productFamily) missingFields.push("productFamily");
  if (!product.evidence?.evidenceState) missingFields.push("evidence.evidenceState");
  if (!product.ledger?.ledgerStatus) missingFields.push("ledger.ledgerStatus");
  if (!product.genericAiComparison?.state) missingFields.push("genericAiComparison.state");
  if (!product.marketComparison?.state) missingFields.push("marketComparison.state");
  if (!product.antiToy?.state) missingFields.push("antiToy.state");
  if (!product.redTeam?.state) missingFields.push("redTeam.state");
  if (!product.v2Revalidation?.revalidationStatus) missingFields.push("v2Revalidation.revalidationStatus");
  if (!product.fulfilmentQualification?.state) missingFields.push("fulfilmentQualification.state");
  if (!product.releaseFirewall?.state) missingFields.push("releaseFirewall.state");
  if (!product.checkoutAgreement?.state) missingFields.push("checkoutAgreement.state");
  if (!product.authorityClearance?.state) missingFields.push("authorityClearance.state");

  if (missingFields.length > 0) {
    errors.push(`${product.productId}: missing explicit fields: ${missingFields.join(", ")}`);
  }

  if (product.genericAiComparison.state === "passed" && product.genericAiComparison.source === "missing_source") {
    errors.push(`${product.productId}: generic-AI comparison passed with missing source`);
  }

  if (product.marketComparison.state === "passed" && product.marketComparison.source === "missing_source") {
    errors.push(`${product.productId}: market comparison passed with missing source`);
  }

  if (product.antiToy.state === "passed" && product.antiToy.sources.length === 0) {
    errors.push(`${product.productId}: anti-toy passed without product-applicable sources`);
  }

  if (product.redTeam.state === "passed" && product.redTeam.sources.length === 0) {
    errors.push(`${product.productId}: red-team passed without product-applicable sources`);
  }

  if (
    product.authorityClearance.state === "authority_cleared" &&
    (!product.evidence.evidenceLedgerEntryExists || product.ledger.ledgerStatus !== "real_entry")
  ) {
    errors.push(`${product.productId}: authority-cleared without a real ledger entry`);
  }

  if (
    product.authorityClearance.publicClaimPermission &&
    product.authorityClearance.state !== "authority_cleared"
  ) {
    errors.push(`${product.productId}: public claim permission enabled without authority clearance`);
  }
}

const v2BlockedProducts = new Set(["boardroom_brief", "executive_reporting", "boardroom_mode"]);
for (const productId of v2BlockedProducts) {
  const product = products.find((row) => row.productId === productId);
  if (!product) {
    errors.push(`${productId}: missing from backbone`);
    continue;
  }
  if (!["blocked", "evidence_missing"].includes(product.v2Revalidation.revalidationStatus)) {
    errors.push(`${productId}: expected blocked/evidence_missing v2 state, found ${product.v2Revalidation.revalidationStatus}`);
  }
}

if (ledger.totalProducts !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Ledger status report expected ${EXPECTED_TOTAL_PRODUCTS} products, found ${ledger.totalProducts}`);
}

const adminSurfaceSource = readFileSync(ADMIN_SURFACE_PATH, "utf8");
const requiredSurfaceSnippets = [
  "buildProductAuthorityBackboneReport",
  "requireAdminPage",
  "AdminLayout",
  "BackToOperatorCommandCentre",
  "Authority",
  "Evidence",
  "Validation",
  "V2",
  "Anti-Toy",
  "Red-Team",
  "Generic-AI",
  "Market",
  "Fulfilment",
  "Release",
  "Public Claim",
  "Next Required Evidence",
];

for (const snippet of requiredSurfaceSnippets) {
  if (!adminSurfaceSource.includes(snippet)) {
    errors.push(`Admin authority surface missing required snippet: ${snippet}`);
  }
}

if (adminSurfaceSource.includes("ProductAuthorityBadge")) {
  warnings.push("Admin authority surface still references ProductAuthorityBadge.");
}

const result = {
  generatedAt: new Date().toISOString(),
  totalProducts: products.length,
  explicitEvidenceObjects: products.filter((product) => Boolean(product.evidence)).length,
  explicitQualificationStates: products.filter(
    (product) =>
      Boolean(product.genericAiComparison?.state) &&
      Boolean(product.marketComparison?.state) &&
      Boolean(product.antiToy?.state) &&
      Boolean(product.redTeam?.state) &&
      Boolean(product.v2Revalidation?.revalidationStatus) &&
      Boolean(product.authorityClearance?.state),
  ).length,
  authorityCleared: products.filter((product) => product.authorityClearance.state === "authority_cleared").length,
  blocked: products.filter((product) => product.authorityClearance.state === "blocked").length,
  evidenceIncomplete: products.filter((product) => product.authorityClearance.state === "evidence_incomplete").length,
  genericAiRecords: products.length,
  marketRecords: products.length,
  antiToyRecords: products.length,
  redTeamRecords: products.length,
  v2Records: products.length,
  adminSurfaceBackboneWired: adminSurfaceSource.includes("buildProductAuthorityBackboneReport"),
  errors,
  warnings,
  pass: errors.length === 0,
};

writeFileSync(
  join(REPORTS_DIR, "product-authority-system-check.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);

console.log(`Products resolved: ${result.totalProducts}`);
console.log(`Explicit evidence objects: ${result.explicitEvidenceObjects}`);
console.log(`Explicit qualification states: ${result.explicitQualificationStates}`);
console.log(`Authority-cleared: ${result.authorityCleared}`);
console.log(`Blocked: ${result.blocked}`);
console.log(`Evidence-incomplete: ${result.evidenceIncomplete}`);
console.log(`Admin surface wired to backbone: ${result.adminSurfaceBackboneWired ? "yes" : "no"}`);
console.log(`Written: ${join(REPORTS_DIR, "product-authority-system-check.json")}`);

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
