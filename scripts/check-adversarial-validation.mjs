#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadProductAuthorityArtifacts } from "./lib/read-product-authority-backbone.mjs";

const REPORTS_DIR = join(process.cwd(), "reports");
const EXPECTED_TOTAL_PRODUCTS = 43;
const FORBIDDEN_DEBT_STATES = new Set(["proxy_only", "direct_adapter_missing", "requires_engine_wiring"]);

const { backbone } = loadProductAuthorityArtifacts();
const products = backbone.products;
const errors = [];

console.log("ADVERSARIAL VALIDATION GATE");
console.log("Auditing adversarial adapter verification and explicit source debt states\n");

if (products.length !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Expected ${EXPECTED_TOTAL_PRODUCTS} products, found ${products.length}`);
}

for (const product of products) {
  const record = product.adapterVerification.adversarialValidation;
  if (!record?.state) {
    errors.push(`${product.productId}: missing adversarial validation state`);
    continue;
  }
  if (FORBIDDEN_DEBT_STATES.has(record.state)) {
    errors.push(`${product.productId}: forbidden adversarial debt state ${record.state}`);
  }
  if (record.state !== "source_missing" && !record.directInvocation) {
    errors.push(`${product.productId}: adversarial validation should be direct unless explicitly source_missing`);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  productsReviewed: products.length,
  directInvocations: products.filter(
    (product) => product.adapterVerification.adversarialValidation.directInvocation,
  ).length,
  sourceMissing: products.filter(
    (product) => product.adapterVerification.adversarialValidation.state === "source_missing",
  ).length,
  stateCounts: products.reduce((acc, product) => {
    const state = product.adapterVerification.adversarialValidation.state;
    acc[state] = (acc[state] ?? 0) + 1;
    return acc;
  }, {}),
  blockedProducts: products
    .filter((product) => product.adapterVerification.adversarialValidation.state === "failed")
    .map((product) => ({
      productId: product.productId,
      reasons: product.adapterVerification.adversarialValidation.reasons,
    })),
  errors,
  pass: errors.length === 0,
};

writeFileSync(
  join(REPORTS_DIR, "adversarial-validation.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);

console.log(`Products reviewed: ${result.productsReviewed}`);
console.log(`Direct invocations: ${result.directInvocations}`);
console.log(`Source-missing debt states: ${result.sourceMissing}`);
console.log(`Written: ${join(REPORTS_DIR, "adversarial-validation.json")}`);

if (errors.length > 0) {
  console.log(`Errors: ${errors.length}`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
}

console.log("PASS");
