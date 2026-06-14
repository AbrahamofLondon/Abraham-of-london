#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const contract = JSON.parse(readFileSync("data/ProductAuthorityContract.json", "utf-8"));
const matrix = JSON.parse(readFileSync("reports/product-release-governance-matrix.json", "utf-8"));

function assignAdvancementGroup(code, data) {
  // COMMERCIAL PRODUCTS (already live)
  if (data.currentAuthorityState === "diagnostic_product") {
    return "already_evidence_limited_commercial";
  }

  // BLOCKED PRODUCTS
  if (data.currentAuthorityState === "blocked_until_claim_evidenced") {
    return "blocked_claim_unsafe";
  }

  // STATIC REFERENCE / ARCHIVAL
  if (data.currentAuthorityState === "static_reference") {
    return "keep_internal_governance_engine";
  }

  // INTERNAL-ONLY PRODUCTS
  if (data.currentAuthorityState === "internal_only") {
    return "keep_internal_governance_engine";
  }

  // REVIEW PRODUCTS - Insufficient information
  if (data.currentAuthorityState === "insufficient_information_requires_review") {
    // Variants of existing commercial products
    if (code.includes("diagnostic_") && (code.includes("extended") || code.includes("rapid") || code.includes("deep"))) {
      return "prepare_for_authority_restoration_review";
    }
    if (code.includes("assessment_") && (code.includes("light") || code.includes("standard") || code.includes("premium"))) {
      return "prepare_for_authority_restoration_review";
    }

    // Market intelligence
    if (code.includes("market_intelligence") || code === "gmi_quarterly") {
      return "advance_to_evidence_limited_commercial";
    }

    // Strategic engagement
    if (code.includes("strategy_") || code === "retainer_oversight") {
      return "prepare_for_authority_restoration_review";
    }

    // Reporting
    if (code.includes("reporting_")) {
      return "advance_to_evidence_limited_commercial";
    }

    // Training
    if (code.includes("training_")) {
      return "requires_owner_definition";
    }

    // Research variants
    if (code.includes("research_")) {
      return "requires_surface_discovery";
    }

    // Competitive/trend/signal
    if (code.includes("competitor_") || code.includes("trend_") || code.includes("signal_")) {
      return "advance_to_evidence_limited_commercial";
    }
  }

  return "requires_owner_definition";
}

function assignPriorityTier(code, data, group) {
  // Commercial products
  if (group === "already_evidence_limited_commercial") {
    return "P0";
  }

  // Blocked products
  if (group === "blocked_claim_unsafe") {
    return "P3";
  }

  // Archive/static reference
  if (data.currentAuthorityState === "static_reference") {
    return "P2";
  }

  // Internal governance (keep internal)
  if (group === "keep_internal_governance_engine" && data.currentAuthorityState === "internal_only") {
    return "P2";
  }

  // Review products
  if (group === "prepare_for_authority_restoration_review") {
    return "P0"; // High commercial potential
  }

  if (group === "advance_to_evidence_limited_commercial") {
    return "P1"; // Medium-high commercial, lower friction
  }

  if (group === "requires_owner_definition") {
    return "P2"; // Blocked until owner decision
  }

  if (group === "requires_surface_discovery") {
    return "P2"; // Needs scoping work
  }

  return "P3";
}

const products = Object.entries(contract).map(([code, data]) => {
  const gov = matrix[code];
  const group = assignAdvancementGroup(code, data);
  const tier = assignPriorityTier(code, data, group);

  return {
    productCode: code,
    contractDefined: true,
    releaseLane: gov ? gov.releaseLane : "unknown",
    releaseMode: gov ? gov.releaseMode : "unknown",
    currentAuthorityState: data.currentAuthorityState,
    commercialClaimAllowed: data.commercialClaimAllowed || false,
    checkoutAllowed: gov ? gov.checkoutAllowed : false,
    manualFulfilmentAllowed: gov ? gov.manualFulfilmentAllowed : false,
    advancementGroup: group,
    priorityTier: tier,
    nextAction: data.nextEvidenceAction || "Review for advancement",
    reason: data.blockingReasons ? data.blockingReasons[0] : "No blocking reason",
  };
});

const grouped = {};
products.forEach((p) => {
  if (!grouped[p.advancementGroup]) grouped[p.advancementGroup] = [];
  grouped[p.advancementGroup].push(p.productCode);
});

const tiered = {};
products.forEach((p) => {
  if (!tiered[p.priorityTier]) tiered[p.priorityTier] = [];
  tiered[p.priorityTier].push(p.productCode);
});

console.log("43-PRODUCT RECONCILIATION");
console.log("=========================\n");
console.log("Total Products:", products.length);
console.log("\nBy Advancement Group:");
Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([group, codes]) => {
    console.log(`  ${group}: ${codes.length}`);
  });

console.log("\nBy Priority Tier:");
["P0", "P1", "P2", "P3"].forEach((tier) => {
  if (tiered[tier]) {
    console.log(`  ${tier}: ${tiered[tier].length}`);
  }
});

writeFileSync("reports/product-advancement-43-reconciliation.json", JSON.stringify({
  total: products.length,
  by_group: grouped,
  by_tier: tiered,
  products,
}));

console.log("\n✓ Written to reports/product-advancement-43-reconciliation.json");
