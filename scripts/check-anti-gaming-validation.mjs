#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadProductAuthorityArtifacts } from "./lib/read-product-authority-backbone.mjs";

const REPORTS_DIR = join(process.cwd(), "reports");
const args = process.argv.slice(2);
const productIndex = args.indexOf("--product");
const targetProduct = productIndex >= 0 ? args[productIndex + 1] : null;
const FORBIDDEN_DEBT_STATES = new Set(["proxy_only", "direct_adapter_missing", "requires_engine_wiring"]);

const { backbone } = loadProductAuthorityArtifacts();
const sourceProducts = backbone.products;
const products = targetProduct
  ? sourceProducts.filter((product) => product.productId === targetProduct)
  : sourceProducts;
const errors = [];

console.log("ANTI-GAMING VALIDATION GATE");
console.log(targetProduct ? `Scoped product: ${targetProduct}\n` : "Auditing estate-wide anti-gaming adapter verification\n");

if (targetProduct && products.length === 0) {
  console.log(`Unknown product: ${targetProduct}`);
  process.exit(1);
}

for (const product of products) {
  const record = product.adapterVerification.antiGaming;
  if (!record?.state) {
    errors.push(`${product.productId}: missing anti-gaming state`);
    continue;
  }
  if (!record.directInvocation) {
    errors.push(`${product.productId}: anti-gaming is not directly invoked`);
  }
  if (FORBIDDEN_DEBT_STATES.has(record.state)) {
    errors.push(`${product.productId}: forbidden anti-gaming debt state ${record.state}`);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  scope: targetProduct ? "product" : "estate",
  productCode: targetProduct,
  productsReviewed: products.length,
  directInvocations: products.filter((product) => product.adapterVerification.antiGaming.directInvocation).length,
  stateCounts: products.reduce((acc, product) => {
    const state = product.adapterVerification.antiGaming.state;
    acc[state] = (acc[state] ?? 0) + 1;
    return acc;
  }, {}),
  blockedProducts: products
    .filter((product) => product.adapterVerification.antiGaming.state === "failed")
    .map((product) => ({
      productId: product.productId,
      reasons: product.adapterVerification.antiGaming.reasons,
    })),
  errors,
  pass: errors.length === 0,
};

const filename = targetProduct
  ? `anti-gaming-validation-${targetProduct}.json`
  : "anti-gaming-validation.json";

writeFileSync(join(REPORTS_DIR, filename), `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(`Products reviewed: ${result.productsReviewed}`);
console.log(`Direct invocations: ${result.directInvocations}`);
console.log(`Written: ${join(REPORTS_DIR, filename)}`);

if (errors.length > 0) {
  console.log(`Errors: ${errors.length}`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
}

console.log("PASS");
