import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  PRODUCT_INTELLIGENCE_CLASSES,
  assertCompleteProductIntelligenceClassificationCoverage,
  buildProductIntelligenceClassificationReport,
} from "../../lib/intelligence/product-intelligence-classification";

const REPORT_PATH = join(process.cwd(), "reports", "product-intelligence-classification.json");
const jsonMode = process.argv.includes("--json");

const report = buildProductIntelligenceClassificationReport();

mkdirSync(join(process.cwd(), "reports"), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log("Product Intelligence Classification");
  console.log("-----------------------------------");
  console.log(`Expected products:   ${report.expectedProductCount}`);
  console.log(`Unique products:     ${report.uniqueProductCount}`);
  console.log(`Classified products: ${report.classifiedProductCount}`);
  console.log(`Complete coverage:   ${report.completeCoverage ? "YES" : "NO"}`);
  console.log(`Report written:      reports/product-intelligence-classification.json`);
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
