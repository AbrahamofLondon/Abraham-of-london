#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const prof = d.products.find((p) => p.productCode === "professional");
if (prof) {
  prof.realityGrade = 10;
  prof.classification = "VERIFIED_ACTIVE";
  prof.exposure = "public_limited";
  prof.runtimeTruth =
    "DB-derived entitlement state via ClientEntitlement and Entitlement models. Catalog.ts is single source of truth for pricing, Stripe IDs, entitlement slugs. Monthly (£59) and annual (£590) billing via Stripe. Professional is the canonical continuity subscription; Inner Circle is dormant/controlled and not sold. Pricing page at /pricing catalog-derived. Checkout via /api/billing/checkout with Stripe session creation and webhook resolution.";
  prof.sourceOfTruthDeclaration =
    "Professional is the canonical continuity subscription. Inner Circle remains a dormant/controlled operating layer and must not be sold as membership. Catalog.ts is the single source of truth for all product definitions.";
  prof.knownBlockers = [];
  if (!prof.testsCoveringIt) prof.testsCoveringIt = [];
  prof.testsCoveringIt.push(
    "lib/commercial/professional-subscription-lifecycle.test.ts",
    "tests/product/pricing-surfacing.test.ts"
  );
  console.log(`Updated ${prof.productCode} to grade ${prof.realityGrade}/10, exposure=${prof.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
