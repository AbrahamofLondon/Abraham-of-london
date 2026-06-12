#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const JSON_REPORT = join(REPORT_DIR, "product-gold-upgrade-roadmap.json");
const MD_REPORT = join(REPORT_DIR, "product-gold-upgrade-roadmap.md");
const GOLD_98_REPORT = join(ROOT, "reports/universal-product-gold-standard-98.json");

const COMPOSERS = {
  free_public_signal: ["lib/product/free-public-signal-composer.ts"],
  decision_instrument: ["lib/decision-instruments/gold-standard-decision-instrument-composer.ts"],
  strategy_room: ["lib/strategy-room/gold-standard-session-composer.ts"],
  boardroom_premium: [
    "lib/boardroom/boardroom-intake-contract.ts",
    "lib/boardroom/boardroom-brief-composer.ts",
    "lib/boardroom/boardroom-value-readiness.ts",
  ],
  executive_reporting: ["lib/reporting/gold-standard-report-composer.ts"],
  diagnostic: ["lib/reporting/gold-standard-report-composer.ts"],
  global_market_intelligence: ["lib/gmi/gmi-gold-standard-composer.ts"],
  professional_subscription: ["lib/subscriptions/professional-cycle-composer.ts"],
  retainer_oversight: ["lib/subscriptions/professional-cycle-composer.ts"],
  bundle_product: ["lib/products/bundle-guidance-composer.ts"],
  internal_or_inactive: [],
};

const report98 = JSON.parse(readFileSync(GOLD_98_REPORT, "utf-8"));
const allProducts = [
  ...report98.goldStandardProducts,
  ...report98.blockedProducts,
  ...report98.internalOnlyProducts,
].sort((a, b) => a.productCode.localeCompare(b.productCode));

const failures = [];
if (allProducts.length !== 43) failures.push(`Expected 43 products, found ${allProducts.length}.`);

const plans = allProducts.map(buildPlan);
for (const plan of plans) {
  if (!plan.productFamily) failures.push(`${plan.productCode}: missing product family.`);
  if (!plan.releaseConditions.length) failures.push(`${plan.productCode}: missing release conditions.`);
  const composerPaths = COMPOSERS[plan.productFamily] ?? [];
  if (plan.productFamily !== "internal_or_inactive" && composerPaths.length === 0) {
    failures.push(`${plan.productCode}: product family has no composer.`);
  }
  for (const composerPath of composerPaths) {
    if (!existsSync(join(ROOT, composerPath))) failures.push(`${plan.productCode}: missing composer ${composerPath}.`);
  }
}

const families = Object.fromEntries(Object.keys(COMPOSERS).map((family) => [
  family,
  plans.filter((plan) => plan.productFamily === family).length,
]));

const waves = {
  wave1TrustSurfaces: plans.filter((plan) => plan.upgradePriority === "P0"),
  wave2CorePaidDecisionProducts: plans.filter((plan) => plan.upgradePriority === "P1"),
  wave3PremiumAuthorityProducts: plans.filter((plan) => plan.upgradePriority === "P2" && plan.productFamily !== "global_market_intelligence"),
  wave4IntelligenceEstate: plans.filter((plan) => plan.productFamily === "global_market_intelligence"),
  wave5InactiveFutureBundleProducts: plans.filter((plan) => plan.upgradePriority === "P3"),
};

const output = {
  generatedAt: new Date().toISOString(),
  gate: failures.length === 0 ? "PASSED" : "FAILED",
  productsReviewed: plans.length,
  productFamilies: families,
  composerCoverage: COMPOSERS,
  plans,
  waves,
  productsNowGoldStandard: plans.filter((plan) => plan.currentReleaseStatus === "gold_standard"),
  productsStillBlocked: plans.filter((plan) => plan.currentReleaseStatus === "blocked_from_release"),
  productsInternalOnly: plans.filter((plan) => plan.currentReleaseStatus === "internal_only"),
  failures,
  finalRecommendation: failures.length === 0 ? "GREEN" : "RED",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMarkdown(output));

console.log("PRODUCT GOLD UPGRADE ROADMAP CHECK");
console.log(`Products reviewed: ${output.productsReviewed}`);
console.log(`Product families covered: ${Object.values(families).filter((count) => count > 0).length}`);
console.log(`Upgrade plans missing: ${failures.filter((failure) => failure.includes("missing")).length}`);
console.log(`Gate: ${output.gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = output.gate === "PASSED" ? 0 : 1;

function buildPlan(product) {
  const productFamily = productFamilyFor(product);
  return {
    productCode: product.productCode,
    productFamily,
    currentScoreOutOf10: product.scoreOutOf10,
    targetScoreOutOf10: targetScoreFor(productFamily),
    currentReleaseStatus: product.releaseStatus,
    missingCapabilities: missingCapabilitiesFor(product, productFamily),
    requiredUpgradeWorkstreams: workstreamsFor(product, productFamily),
    upgradePriority: priorityFor(product, productFamily),
    owner: ownerFor(productFamily),
    releaseConditions: releaseConditionsFor(product, productFamily),
  };
}

function productFamilyFor(product) {
  const code = product.productCode;
  if (code.includes("gmi_q")) return "global_market_intelligence";
  if (product.commercialTier === "free") return "free_public_signal";
  if (code === "operator_decision_pack") return "decision_instrument";
  if (code === "enterprise") return "retainer_oversight";
  if (code.includes("retainer")) return "retainer_oversight";
  if (code.includes("professional") || code === "additional_collaborator") return "professional_subscription";
  if (code.includes("strategy_room")) return "strategy_room";
  if (code.includes("boardroom") || code.includes("board_brief")) return "boardroom_premium";
  if (code.includes("executive_reporting")) return "executive_reporting";
  if (code.startsWith("diagnostic_report")) return "diagnostic";
  if (code.includes("pack") || code.includes("suite")) return "bundle_product";
  if (product.currentStatus === "legacy_blocked" && !product.wasPublicOrSellable) return "internal_or_inactive";
  return "decision_instrument";
}

function targetScoreFor(family) {
  if (family === "boardroom_premium" || family === "global_market_intelligence" || family === "retainer_oversight") return 9.9;
  return 9.8;
}

function missingCapabilitiesFor(product, family) {
  const missing = [...product.blockingReasons];
  if (family === "free_public_signal") missing.push("Free signal needs diagnosis, why it matters, next action, boundary, and no-pressure route.");
  if (family === "decision_instrument") missing.push("Decision instrument needs decision state, contradiction, consequence, pressure, next move, reasoning basis, and escalation condition.");
  if (family === "strategy_room") missing.push("Strategy Room needs governed room output, evidence stack, strategic diagnosis, and checkpoint.");
  if (family === "boardroom_premium") missing.push("Boardroom needs complete intake, 13-section artefact, value-readiness score, and admin approval block below 9.8.");
  if (family === "executive_reporting" || family === "diagnostic") missing.push("Report needs evidence trace, confidence, limitations, falsification note, and action sequence.");
  if (family === "global_market_intelligence") missing.push("GMI needs traceable material calls, archive/current status, prior-call verification, and customer use guidance.");
  if (family === "professional_subscription" || family === "retainer_oversight") missing.push("Subscription needs continuity, memory, movement since last cycle, and escalation trigger.");
  if (family === "bundle_product") missing.push("Bundle needs guided sequence and child entitlement verification.");
  return unique(missing);
}

function workstreamsFor(product, family) {
  const workstreams = ["analysis_engine", "artefact_composition", "experience_design", "fulfilment_proof", "live_cycle_proof", "customer_access"];
  if (product.isPaid) workstreams.push("pricing_value_proof");
  if (product.blockingReasons.some((reason) => reason.includes("Stripe") || reason.includes("webhook"))) workstreams.push("webhook_authority");
  if (!["free_public_signal", "internal_or_inactive"].includes(family)) workstreams.push("intake");
  if (["boardroom_premium", "executive_reporting", "diagnostic", "global_market_intelligence", "professional_subscription", "retainer_oversight"].includes(family)) {
    workstreams.push("report_experience", "admin_preview");
  }
  return unique(workstreams);
}

function priorityFor(product, family) {
  if (product.productCode === "operator_decision_pack") return "P1";
  if (product.productCode === "enterprise") return "P3";
  if (family === "free_public_signal" || family === "decision_instrument") return "P0";
  if (family === "strategy_room" || family === "executive_reporting") return "P1";
  if (family === "boardroom_premium" || family === "professional_subscription" || family === "retainer_oversight" || family === "global_market_intelligence") return "P2";
  return "P3";
}

function ownerFor(family) {
  if (family === "boardroom_premium" || family === "global_market_intelligence" || family === "retainer_oversight") return "Abraham";
  if (family === "internal_or_inactive") return "operator";
  return "system";
}

function releaseConditionsFor(product, family) {
  const conditions = [
    "Score is at least 9.8/10.",
    "Product release status is gold_standard.",
    "No public/sellable below-9.8 path exists.",
    "Universal product value gate passes.",
    "Fulfilment integrity gate passes.",
    "Customer access path is safe.",
  ];
  if (product.isPaid) conditions.push("Price-value proof is specific and reusable.");
  if (family === "free_public_signal") conditions.push("Time-value proof is specific and the output is not bait.");
  if (!["free_public_signal", "internal_or_inactive"].includes(family)) conditions.push("Required intake is complete before artefact generation.");
  if (["boardroom_premium", "executive_reporting", "diagnostic", "global_market_intelligence", "professional_subscription", "retainer_oversight"].includes(family)) {
    conditions.push("Report experience AMBER items are resolved or owned with release block.");
  }
  if (family === "bundle_product") conditions.push("Child entitlement verification passes.");
  return conditions;
}

function renderMarkdown(report) {
  return `# Product Gold Upgrade Roadmap

## Gate Result

${report.gate}

## Products Reviewed

${report.productsReviewed}

## Product Families

${Object.entries(report.productFamilies).map(([family, count]) => `- ${family}: ${count}`).join("\n")}

## Composer Coverage

${Object.entries(report.composerCoverage).map(([family, paths]) => `- ${family}: ${paths.length ? paths.join(", ") : "no composer required"}`).join("\n")}

## Wave 1 - Trust Surfaces

${renderPlanList(report.waves.wave1TrustSurfaces)}

## Wave 2 - Core Paid Decision Products

${renderPlanList(report.waves.wave2CorePaidDecisionProducts)}

## Wave 3 - Premium Authority Products

${renderPlanList(report.waves.wave3PremiumAuthorityProducts)}

## Wave 4 - Intelligence Estate

${renderPlanList(report.waves.wave4IntelligenceEstate)}

## Wave 5 - Inactive / Future / Bundle Products

${renderPlanList(report.waves.wave5InactiveFutureBundleProducts)}

## Product Upgrade Plans

| Product | Family | Current Score | Target | Release Status | Priority | Owner | Workstreams |
|---|---|---:|---:|---|---|---|---|
${report.plans.map((plan) => `| ${plan.productCode} | ${plan.productFamily} | ${plan.currentScoreOutOf10} | ${plan.targetScoreOutOf10} | ${plan.currentReleaseStatus} | ${plan.upgradePriority} | ${plan.owner} | ${plan.requiredUpgradeWorkstreams.join(", ")} |`).join("\n")}

## Required Upgrade Backlog

${report.plans.map((plan) => `- ${plan.productCode}: ${plan.missingCapabilities[0] ?? "No missing capability recorded."}`).join("\n")}

## Final Recommendation

${report.finalRecommendation}
`;
}

function renderPlanList(plans) {
  return plans.length
    ? plans.map((plan) => `- ${plan.productCode}: ${plan.productFamily} (${plan.currentScoreOutOf10}/10 -> ${plan.targetScoreOutOf10})`).join("\n")
    : "- None";
}

function unique(items) {
  return [...new Set(items)];
}
