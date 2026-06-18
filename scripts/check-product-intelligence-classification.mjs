#!/usr/bin/env node

import { tsImport } from "tsx/esm/api";

let classificationModule;

try {
  classificationModule = await tsImport(
    "../lib/intelligence/product-intelligence-classification.ts",
    import.meta.url,
  );
} catch (error) {
  console.error(
    "Failed to load the TypeScript classification module in-process. Run this checker with `pnpm exec tsx scripts/check-product-intelligence-classification.mjs` if plain `node` cannot start the tsx/esbuild service in your environment.",
  );
  throw error;
}

const {
  PRODUCT_INTELLIGENCE_CLASSES,
  assertCompleteProductIntelligenceClassificationCoverage,
  buildProductIntelligenceClassificationReport,
} = classificationModule;

const report = buildProductIntelligenceClassificationReport();
const jsonMode = process.argv.includes("--json");

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log("Product Intelligence Classification");
  console.log("-----------------------------------");
  console.log(`Expected products:   ${report.expectedProductCount}`);
  console.log(`Unique products:     ${report.uniqueProductCount}`);
  console.log(`Classified products: ${report.classifiedProductCount}`);
  console.log(`Complete coverage:   ${report.completeCoverage ? "YES" : "NO"}`);
  console.log("");

  for (const classification of PRODUCT_INTELLIGENCE_CLASSES) {
    console.log(`${classification.padEnd(15)} ${report.countsByClass[classification]}`);
  }

  if (report.duplicateRegistryProductCodes.length > 0) {
    console.log("");
    console.log(`Duplicate registry product codes: ${report.duplicateRegistryProductCodes.join(", ")}`);
  }

  if (report.unclassifiedProducts.length > 0) {
    console.log("");
    console.log("Unclassified products:");
    for (const entry of report.unclassifiedProducts) {
      console.log(`- ${entry.productCode}: ${entry.reason}`);
    }
  }

  if (report.multiplyClassifiedProducts.length > 0) {
    console.log("");
    console.log("Multiply classified products:");
    for (const entry of report.multiplyClassifiedProducts) {
      console.log(`- ${entry.productCode}: ${entry.matchedClasses.join(", ")}`);
    }
  }
}

try {
  assertCompleteProductIntelligenceClassificationCoverage();
} catch (error) {
  if (!jsonMode) {
    console.error("");
    console.error(String(error instanceof Error ? error.message : error));
  }
  process.exit(1);
}
