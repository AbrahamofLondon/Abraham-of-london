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

console.log("VALIDATION CONSTITUTION GATE");
console.log("Auditing direct constitution verification across the product estate\n");

if (products.length !== EXPECTED_TOTAL_PRODUCTS) {
  errors.push(`Expected ${EXPECTED_TOTAL_PRODUCTS} products, found ${products.length}`);
}

for (const product of products) {
  const record = product.adapterVerification.validationConstitution;
  if (!record?.state) {
    errors.push(`${product.productId}: missing validation constitution state`);
    continue;
  }
  if (!record.directInvocation) {
    errors.push(`${product.productId}: validation constitution is not directly invoked`);
  }
  if (FORBIDDEN_DEBT_STATES.has(record.state)) {
    errors.push(`${product.productId}: forbidden constitution debt state ${record.state}`);
  }
}

const states = products.map((product) => product.adapterVerification.validationConstitution.state);
const result = {
  generatedAt: new Date().toISOString(),
  productsReviewed: products.length,
  directInvocations: products.filter(
    (product) => product.adapterVerification.validationConstitution.directInvocation,
  ).length,
  stateCounts: states.reduce((acc, state) => {
    acc[state] = (acc[state] ?? 0) + 1;
    return acc;
  }, {}),
  blockedProducts: products
    .filter((product) => product.adapterVerification.validationConstitution.state === "failed")
    .map((product) => ({
      productId: product.productId,
      reasons: product.adapterVerification.validationConstitution.reasons,
    })),
  errors,
  pass: errors.length === 0,
};

writeFileSync(
  join(REPORTS_DIR, "validation-constitution-gate.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);

console.log(`Products reviewed: ${result.productsReviewed}`);
console.log(`Direct invocations: ${result.directInvocations}`);
console.log(`Written: ${join(REPORTS_DIR, "validation-constitution-gate.json")}`);

if (errors.length > 0) {
  console.log(`Errors: ${errors.length}`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
}

console.log("PASS");
