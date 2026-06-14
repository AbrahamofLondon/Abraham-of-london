#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const contract = JSON.parse(readFileSync("data/ProductAuthorityContract.json", "utf-8"));
const audit = JSON.parse(readFileSync("lib/product/product-estate-reality-audit.json", "utf-8"));
const audit_map = Object.fromEntries(audit.products.map((p) => [p.productCode, p]));

const FAMILY_MAP = {
  market: "Market Intelligence",
  competitor: "Competitive Intelligence",
  trend: "Trend Monitoring",
  signal: "Signal Monitoring",
  diagnostic: "Diagnostic Suite",
  assessment: "Assessment Suite",
  strategy: "Strategy Engagement",
  reporting: "Reporting Suite",
  tools: "Tools & Infrastructure",
  research: "Research & Content",
  content: "Research & Content",
  training: "Training & Development",
  support: "Support Services",
};

function inferCommercialPotential(code) {
  if (code.includes("diagnostic") || code.includes("assessment")) return "HIGH";
  if (code.includes("strategy") || code.includes("reporting")) return "MEDIUM";
  if (code.includes("training") || code.includes("content")) return "MEDIUM";
  if (code.includes("tools") || code.includes("support")) return "MEDIUM";
  if (code.includes("market") || code.includes("research")) return "MEDIUM";
  return "LOW";
}

function inferAuthorityRisk(code) {
  if (code.includes("boardroom") || code.includes("executive")) return "HIGH";
  if (code.includes("training") || code.includes("certification")) return "MEDIUM";
  if (code.includes("reporting") || code.includes("strategy")) return "MEDIUM";
  return "LOW";
}

const review_products = Object.entries(contract)
  .filter(([code, data]) => data.currentAuthorityState === "insufficient_information_requires_review")
  .map(([code, data]) => {
    const family = code.split("_")[0];

    return {
      productCode: code,
      productFamily: FAMILY_MAP[family] || family,
      currentAuthorityState: data.currentAuthorityState,
      releaseLane: "insufficient_information_requires_review",
      releaseMode: "blocked",
      routeExists: false,
      surfaceExists: false,
      commercialPotential: inferCommercialPotential(code),
      authorityRisk: inferAuthorityRisk(code),
      evidenceNeeded: data.blockingReasons ? data.blockingReasons[0] : "Product definition needed",
      nextAction: data.nextEvidenceAction || "Define product scope",
    };
  });

console.log("PRODUCT ADVANCEMENT REVIEW INVENTORY");
console.log("====================================\n");
console.log("Total review products:", review_products.length);
console.log("\nBy Family:");
const by_family = {};
review_products.forEach((p) => {
  if (!by_family[p.productFamily]) by_family[p.productFamily] = [];
  by_family[p.productFamily].push(p.productCode);
});

Object.entries(by_family)
  .sort()
  .forEach(([family, codes]) => {
    console.log(`  ${family}: ${codes.length}`);
  });

const by_commercial = {};
review_products.forEach((p) => {
  if (!by_commercial[p.commercialPotential]) by_commercial[p.commercialPotential] = 0;
  by_commercial[p.commercialPotential]++;
});

console.log("\nBy Commercial Potential:");
Object.entries(by_commercial)
  .sort()
  .reverse()
  .forEach(([potential, count]) => {
    console.log(`  ${potential}: ${count}`);
  });

writeFileSync("reports/product-advancement-review-inventory.json", JSON.stringify({
  count: review_products.length,
  by_family,
  by_commercial,
  products: review_products,
}));

console.log("\n✓ Inventory written to reports/product-advancement-review-inventory.json");
