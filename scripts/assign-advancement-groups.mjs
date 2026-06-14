#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const contract = JSON.parse(readFileSync("data/ProductAuthorityContract.json", "utf-8"));

function assignAdvancementGroup(code, data) {
  // Products that are variants of existing commercial products
  if (
    code.includes("diagnostic_") &&
    (code.includes("extended") || code.includes("rapid") || code.includes("deep"))
  ) {
    return "prepare_for_authority_restoration_review";
  }
  if (
    code.includes("assessment_") &&
    (code.includes("light") || code.includes("standard") || code.includes("premium"))
  ) {
    return "prepare_for_authority_restoration_review";
  }

  // Market intelligence - needs edition parametrization
  if (code.includes("market_intelligence") || code === "gmi_quarterly") {
    return "advance_to_evidence_limited_commercial";
  }

  // Strategic engagement products
  if (code.includes("strategy_") || code === "retainer_oversight") {
    return "prepare_for_authority_restoration_review";
  }

  // Reporting - can be evidence-limited advisory
  if (code.includes("reporting_")) {
    return "advance_to_evidence_limited_commercial";
  }

  // Training and development
  if (code.includes("training_")) {
    return "requires_owner_definition";
  }

  // Research and content variants
  if (code.includes("research_custom")) {
    return "requires_surface_discovery";
  }

  // Competitive/trend/signal tracking
  if (code.includes("competitor_") || code.includes("trend_") || code.includes("signal_")) {
    return "advance_to_evidence_limited_commercial";
  }

  return "requires_owner_definition";
}

function assignPriority(code, data) {
  const commercial = inferCommercial(code);
  const risk = inferRisk(code);

  if (commercial === "HIGH" && risk === "LOW") return "P0";
  if (commercial === "HIGH" || risk === "LOW") return "P1";
  if (commercial === "MEDIUM") return "P2";
  return "P3";
}

function inferCommercial(code) {
  if (
    code.includes("diagnostic") ||
    code.includes("assessment") ||
    code.includes("strategy") ||
    code.includes("reporting")
  )
    return "HIGH";
  if (
    code.includes("market_") ||
    code.includes("research_") ||
    code.includes("content_") ||
    code.includes("training_")
  )
    return "MEDIUM";
  return "LOW";
}

function inferRisk(code) {
  if (code.includes("certification") || code.includes("training_certification")) return "MEDIUM";
  if (code.includes("training_")) return "MEDIUM";
  return "LOW";
}

const review_products = Object.entries(contract)
  .filter(([code, data]) => data.currentAuthorityState === "insufficient_information_requires_review")
  .map(([code, data]) => ({
    productCode: code,
    advancementGroup: assignAdvancementGroup(code, data),
    priority: assignPriority(code, data),
    commercialPotential: inferCommercial(code),
    authorityRisk: inferRisk(code),
  }));

const groups = {};
review_products.forEach((p) => {
  if (!groups[p.advancementGroup]) groups[p.advancementGroup] = [];
  groups[p.advancementGroup].push(p.productCode);
});

const priorities = {};
review_products.forEach((p) => {
  if (!priorities[p.priority]) priorities[p.priority] = [];
  priorities[p.priority].push(p.productCode);
});

console.log("PRODUCT ADVANCEMENT GROUPS");
console.log("==========================\n");

Object.entries(groups).forEach(([group, codes]) => {
  console.log(`${group}: ${codes.length}`);
  codes.forEach((code) => console.log(`  - ${code}`));
  console.log();
});

console.log("\nPRIORITY TIERS");
console.log("==============\n");

["P0", "P1", "P2", "P3"].forEach((priority) => {
  if (priorities[priority]) {
    console.log(`${priority}: ${priorities[priority].length}`);
    priorities[priority].slice(0, 3).forEach((code) => console.log(`  - ${code}`));
    if (priorities[priority].length > 3)
      console.log(`  ... and ${priorities[priority].length - 3} more`);
    console.log();
  }
});

writeFileSync("reports/product-advancement-groups.json", JSON.stringify({
  total: review_products.length,
  by_group: groups,
  by_priority: priorities,
  products: review_products,
}));

console.log("✓ Written to reports/product-advancement-groups.json");
