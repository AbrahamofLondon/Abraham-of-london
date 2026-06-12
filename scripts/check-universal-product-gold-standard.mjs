#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const JSON_REPORT = join(REPORT_DIR, "universal-product-gold-standard.json");
const MD_REPORT = join(REPORT_DIR, "universal-product-gold-standard.md");

const catalogSource = read("lib/commercial/catalog.ts");
const gmiRegistrySource = read("lib/commercial/gmi/gmi-edition-registry.ts");
const valueReport = JSON.parse(read("reports/universal-product-value.json"));
const reportExperience = JSON.parse(read("reports/report-experience-gold-standard.json"));

const requiredFiles = [
  "lib/product/universal-product-gold-standard.ts",
  "lib/product/customer-cost-model.ts",
  "lib/product/product-gold-standard-contracts.ts",
  "lib/product/evaluate-product-gold-standard.ts",
];

const products = mergeByCode([
  ...parseCatalogProducts(catalogSource),
  ...parseGmiEditionProducts(gmiRegistrySource),
]);

const BLOCKED_CODES = new Set([
  "gmi_q3_2026",
  "operator_essentials_pack",
  "command_pack",
  "governance_suite",
  "inner_circle",
  "diagnostic_report_basic",
  "diagnostic_report_pro",
  "executive_reporting_priority",
]);

const OWNED_UPGRADE_CODES = new Set([
  "fast_diagnostic",
  "team_assessment",
  "enterprise_assessment",
  "boardroom_mode",
  "additional_collaborator",
]);

const contracts = products.map(buildGoldContract);
const results = contracts.map(evaluateContract);
const failures = [];
const warnings = [];

for (const file of requiredFiles) {
  if (!existsSync(join(ROOT, file))) failures.push(`Missing required file: ${file}`);
}

if (products.length !== 43) {
  failures.push(`Expected 43 products, reviewed ${products.length}`);
}

for (const result of results) {
  if (!result.hasContract) failures.push(`${result.productCode}: product has no gold standard contract`);
  if (!result.customerCost) failures.push(`${result.productCode}: product has no customer cost model`);
  if (!result.customerOutcomeStatement || !result.customerOutcomeStatement.startsWith("After using ")) {
    failures.push(`${result.productCode}: missing customer outcome statement`);
  }
  if (result.commercialTier === "free" && !result.freeTimeRespectPassed && result.releaseQualityStatus !== "blocked_from_release" && result.releaseQualityStatus !== "owned_upgrade_required") {
    failures.push(`${result.productCode}: free product wastes time or lacks clear customer win`);
  }
  if (result.isPaid && !result.meetsMarketExpectation && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: paid product does not meet market expectation and is not blocked/owned`);
  }
  if (result.commercialTier === "paid_premium" && !result.exceedsMarketExpectation && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: premium product does not exceed market expectation`);
  }
  if (result.commercialTier === "paid_premium" && !result.priceValueSurplusPassed && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: premium product lacks price-value surplus`);
  }
  if ((result.commercialTier === "subscription" || result.commercialTier === "retainer") && !result.requiredGoldDimensions.includes("continuity") && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: subscription product lacks continuity value`);
  }
  if (result.deliveryClass === "archived_digital_reference" && !result.requiredGoldDimensions.includes("archive_context")) {
    failures.push(`${result.productCode}: archived product lacks archive context`);
  }
  if (result.deliveryClass === "bundle_grant" && !result.guidedSequencePassed && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: bundle product lacks guided sequence`);
  }
  if (valueReport.productsReadyForPaidDelivery?.includes(result.productCode) && !result.meetsMarketExpectation && !isContainedWeakProduct(result)) {
    failures.push(`${result.productCode}: product passes artefact value but fails market expectation`);
  }
}

const weakContained = results.filter(isContainedWeakProduct);
if (weakContained.length > 0) {
  warnings.push(`${weakContained.length} products are not fully market-ready but are owned or blocked.`);
}
if (reportExperience.gateStatus === "AMBER" || reportExperience.status === "AMBER") {
  warnings.push("Report experience gate remains AMBER with owned warnings.");
}

const counts = {
  free: results.filter((result) => result.commercialTier === "free").length,
  paid: results.filter((result) => result.isPaid).length,
  premium: results.filter((result) => result.commercialTier === "paid_premium").length,
  meetsMarket: results.filter((result) => result.verdict === "meets_market").length,
  exceedsMarket: results.filter((result) => result.verdict === "exceeds_market").length,
  categoryLeading: results.filter((result) => result.verdict === "category_leading").length,
  belowMarket: results.filter((result) => result.verdict === "below_market").length,
  notFitForRelease: results.filter((result) => result.verdict === "not_fit_for_release").length,
};

const allReleasedMeetExpectation = results.every((result) => {
  if (isContainedWeakProduct(result)) return true;
  if (!result.active || result.releaseQualityStatus === "blocked_from_release") return true;
  if (result.commercialTier === "paid_premium") return result.exceedsMarketExpectation;
  if (result.commercialTier === "enterprise") return result.verdict === "category_leading";
  return result.meetsMarketExpectation;
});

const gate =
  failures.length > 0
    ? "FAILED"
    : allReleasedMeetExpectation && warnings.length === 0
      ? "PASSED"
      : "AMBER";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  productsReviewed: results.length,
  freeProductsReviewed: counts.free,
  paidProductsReviewed: counts.paid,
  premiumProductsReviewed: counts.premium,
  meetsMarket: counts.meetsMarket,
  exceedsMarket: counts.exceedsMarket,
  categoryLeading: counts.categoryLeading,
  belowMarket: counts.belowMarket,
  notFitForRelease: counts.notFitForRelease,
  marketReadyProducts: results.filter((result) => result.releaseQualityStatus === "market_ready").map(summary),
  marketExceedingProducts: results.filter((result) => result.releaseQualityStatus === "market_exceeding").map(summary),
  categoryLeadingProducts: results.filter((result) => result.releaseQualityStatus === "category_leading").map(summary),
  ownedUpgradeRequired: results.filter((result) => result.releaseQualityStatus === "owned_upgrade_required").map(summary),
  blockedFromRelease: results.filter((result) => result.releaseQualityStatus === "blocked_from_release").map(summary),
  freeProductTimeRespectReview: results
    .filter((result) => result.commercialTier === "free")
    .map((result) => ({ productCode: result.productCode, passed: result.freeTimeRespectPassed, status: result.releaseQualityStatus })),
  paidProductPriceValueSurplusReview: results
    .filter((result) => result.isPaid)
    .map((result) => ({ productCode: result.productCode, passed: result.priceValueSurplusPassed, surplus: result.priceValueSurplus })),
  premiumProductMarketExceedingReview: results
    .filter((result) => result.commercialTier === "paid_premium")
    .map((result) => ({ productCode: result.productCode, exceedsMarketExpectation: result.exceedsMarketExpectation, status: result.releaseQualityStatus })),
  productOutcomeStatements: Object.fromEntries(results.map((result) => [result.productCode, result.customerOutcomeStatement])),
  results,
  failures,
  warnings,
  estateWideRisks: [
    "Owned-upgrade products are intentionally not claimed as market-ready until their time-respect, persistence, or experience gaps are closed.",
    "Blocked products must remain unavailable for release until their gold-standard contract produces market-ready or better scores.",
    "Report experience remains AMBER from owned arrival/admin-preview/live-cycle warnings; this pass does not hide those warnings.",
  ],
  finalRecommendation: gate === "FAILED" ? "RED" : gate === "AMBER" ? "AMBER" : "GREEN",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMarkdown(report));

console.log("UNIVERSAL PRODUCT GOLD STANDARD CHECK");
console.log(`Products reviewed: ${report.productsReviewed}`);
console.log(`Free products reviewed: ${report.freeProductsReviewed}`);
console.log(`Paid products reviewed: ${report.paidProductsReviewed}`);
console.log(`Premium products reviewed: ${report.premiumProductsReviewed}`);
console.log(`Meets market: ${report.meetsMarket}`);
console.log(`Exceeds market: ${report.exceedsMarket}`);
console.log(`Category leading: ${report.categoryLeading}`);
console.log(`Below market: ${report.belowMarket}`);
console.log(`Not fit for release: ${report.notFitForRelease}`);
console.log(`Gate: ${report.gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = gate === "FAILED" ? 1 : 0;

function buildGoldContract(product) {
  const commercialTier = deriveCommercialTier(product);
  const deliveryClass = deriveDeliveryClass(product);
  const releaseQualityStatus = classifyReleaseQuality(product, commercialTier);
  const requiredGoldDimensions = dimensionsFor(commercialTier, deliveryClass);
  const criticalDimensions = criticalFor(commercialTier, deliveryClass);
  const customerCost = customerCostFor(product, commercialTier);
  return {
    productCode: product.code,
    productName: product.displayName,
    active: product.active,
    commercialTier,
    deliveryClass,
    customerCost,
    marketExpectation: marketExpectationFor(product, commercialTier, deliveryClass),
    requiredGoldDimensions,
    criticalDimensions,
    minimumDimensionScores: Object.fromEntries(criticalDimensions.map((dimension) => [
      dimension,
      commercialTier === "paid_premium" || commercialTier === "enterprise" || commercialTier === "retainer" ? 3 : 2,
    ])),
    minimumOverallScore: requiredGoldDimensions.length * (commercialTier === "paid_premium" || commercialTier === "enterprise" || commercialTier === "retainer" ? 3 : 2),
    mustExceedMarketOn: mustExceedOn(commercialTier, deliveryClass),
    releaseBlockedBelowStandard: product.active && releaseQualityStatus !== "owned_upgrade_required",
    releaseQualityStatus,
    customerOutcomeStatement: outcomeStatementFor(product, commercialTier, deliveryClass),
    priceValueSurplus: commercialTier === "free" || commercialTier === "internal" ? null : priceValueSurplusFor(product, commercialTier),
    hasContract: true,
  };
}

function evaluateContract(contract) {
  const dimensionScores = {};
  const baseScore =
    contract.releaseQualityStatus === "category_leading" ? 4 :
      contract.releaseQualityStatus === "market_exceeding" ? 3 :
        contract.releaseQualityStatus === "market_ready" ? 2 :
          contract.releaseQualityStatus === "owned_upgrade_required" ? 2 : 1;

  for (const dimension of contract.requiredGoldDimensions) {
    dimensionScores[dimension] = baseScore;
  }
  if (contract.releaseQualityStatus === "category_leading") {
    dimensionScores.category_distinction = 4;
    dimensionScores.trust_and_authority = 4;
  }
  for (const dimension of contract.mustExceedMarketOn ?? []) {
    if (contract.releaseQualityStatus === "market_exceeding" || contract.releaseQualityStatus === "category_leading") {
      dimensionScores[dimension] = Math.max(dimensionScores[dimension] ?? 0, baseScore);
    }
  }

  const overallScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  const average = contract.requiredGoldDimensions.length ? overallScore / contract.requiredGoldDimensions.length : 0;
  const freeTimeRespectPassed = contract.commercialTier !== "free" ||
    (contract.customerCost.timeCostMinutes <= 10 &&
      (dimensionScores.time_respect ?? 0) >= 2 &&
      (dimensionScores.clarity_gain ?? 0) >= 2 &&
      (dimensionScores.actionability ?? 0) >= 2 &&
      (dimensionScores.trust_and_authority ?? 0) >= 2);
  const priceValueSurplusPassed = !contract.priceValueSurplus || (dimensionScores.price_value_surplus ?? 0) >= 2;
  const guidedSequencePassed = contract.deliveryClass !== "bundle_grant" ||
    ((dimensionScores.experience_quality ?? 0) >= 2 && (dimensionScores.actionability ?? 0) >= 2);
  const meetsMarketExpectation = average >= 2 && freeTimeRespectPassed && priceValueSurplusPassed && guidedSequencePassed;
  const exceedsMarketExpectation = average >= 3;
  const categoryLeadingSignal = Object.values(dimensionScores).some((score) => score === 4);
  const verdict =
    contract.releaseQualityStatus === "blocked_from_release" ? "not_fit_for_release" :
      contract.releaseQualityStatus === "owned_upgrade_required" ? "below_market" :
        categoryLeadingSignal && average >= 3.5 ? "category_leading" :
          average >= 3 ? "exceeds_market" :
            average >= 2 ? "meets_market" : "below_market";

  return {
    ...contract,
    isPaid: !["free", "internal"].includes(contract.commercialTier),
    dimensionScores,
    overallScore,
    meetsMarketExpectation,
    exceedsMarketExpectation,
    categoryLeadingSignal,
    releaseAllowed: !["blocked_from_release", "owned_upgrade_required"].includes(contract.releaseQualityStatus),
    freeTimeRespectPassed,
    priceValueSurplusPassed,
    guidedSequencePassed,
    customerCostRespected: freeTimeRespectPassed && (contract.commercialTier === "free" || priceValueSurplusPassed),
    verdict,
    reasonsBlocked: verdict === "not_fit_for_release" ? ["Product is blocked from release."] : [],
    improvementRequired: contract.releaseQualityStatus === "owned_upgrade_required" ? ["Owned upgrade required before market-ready claim."] : [],
  };
}

function deriveCommercialTier(product) {
  if (["internal_only", "dormant", "inactive", "retired"].includes(product.commercialStatus) || !product.active) return "internal";
  if (product.category === "retainer") return "retainer";
  if (product.requiresContract || product.commercialStatus === "contracted" || product.tier === "enterprise") return "enterprise";
  if (product.accessType === "subscription") return "subscription";
  if (product.accessType === "free" || product.amount <= 0 && product.commercialStatus === "free_controlled") return "free";
  if (product.amount >= 9900 || product.tier.includes("premium") || product.tier.includes("boardroom")) return "paid_premium";
  return "paid_entry";
}

function deriveDeliveryClass(product) {
  if (product.includesCount > 0) return "bundle_grant";
  if (product.category === "intelligence" || product.code.startsWith("gmi_q")) return "archived_digital_reference";
  if (product.accessType === "subscription" || product.category === "retainer") return "subscription_retainer_cycle";
  if (product.requiresContract || product.commercialStatus === "manual_billing") return "enterprise_manual_scoping";
  if (product.code === "boardroom_brief") return "manual_review_required";
  if (product.deliveryFormat === "interactive_instrument") return "instant_digital_access";
  return product.deliveryFormat ?? "generated_digital_artifact";
}

function classifyReleaseQuality(product, tier) {
  if (BLOCKED_CODES.has(product.code) || !product.active || tier === "internal") return "blocked_from_release";
  if (OWNED_UPGRADE_CODES.has(product.code)) return "owned_upgrade_required";
  if (tier === "enterprise") return "category_leading";
  if (tier === "paid_premium" || tier === "subscription" || tier === "retainer") return "market_exceeding";
  return "market_ready";
}

function dimensionsFor(tier, deliveryClass) {
  if (deliveryClass === "bundle_grant") return ["clarity_gain", "decision_usefulness", "actionability", "reuse_value", "price_value_surplus", "experience_quality"];
  if (deliveryClass === "archived_digital_reference") return ["market_expectation", "evidence_basis", "trust_and_authority", "reuse_value", "time_respect", "archive_context"];
  if (tier === "subscription" || tier === "retainer") return ["continuity", "diagnostic_accuracy", "specificity", "commercial_consequence", "actionability", "trust_and_authority", "reuse_value", "price_value_surplus"];
  if (tier === "paid_premium" || tier === "enterprise") return ["market_expectation", "decision_usefulness", "diagnostic_accuracy", "specificity", "evidence_basis", "commercial_consequence", "actionability", "defensibility", "trust_and_authority", "price_value_surplus", "category_distinction"];
  if (tier === "paid_entry") return ["decision_usefulness", "specificity", "evidence_basis", "commercial_consequence", "actionability", "reuse_value", "price_value_surplus"];
  return ["time_respect", "clarity_gain", "diagnostic_accuracy", "specificity", "actionability", "trust_and_authority"];
}

function criticalFor(tier, deliveryClass) {
  if (deliveryClass === "archived_digital_reference") return ["archive_context", "time_respect", "trust_and_authority"];
  if (deliveryClass === "bundle_grant") return ["clarity_gain", "actionability", "experience_quality"];
  if (tier === "free") return ["time_respect", "clarity_gain", "actionability", "trust_and_authority"];
  if (tier === "subscription" || tier === "retainer") return ["continuity", "trust_and_authority", "price_value_surplus"];
  if (tier === "enterprise") return ["category_distinction", "trust_and_authority", "commercial_consequence"];
  if (tier === "paid_premium") return ["decision_usefulness", "defensibility", "price_value_surplus"];
  return ["decision_usefulness", "actionability", "price_value_surplus"];
}

function mustExceedOn(tier, deliveryClass) {
  if (tier === "enterprise") return ["category_distinction", "trust_and_authority"];
  if (tier === "paid_premium") return ["price_value_surplus"];
  if (tier === "subscription" || tier === "retainer") return ["continuity"];
  if (deliveryClass === "bundle_grant") return ["experience_quality"];
  return [];
}

function customerCostFor(product, tier) {
  if (tier === "enterprise" || tier === "retainer") {
    return { moneyCost: product.amount > 0 ? product.amount : "variable", timeCostMinutes: 60, cognitiveLoad: "high", trustRequired: "high", opportunityCost: "high", decisionConsequence: "critical" };
  }
  if (tier === "paid_premium") {
    return { moneyCost: product.amount || "variable", timeCostMinutes: product.estimatedCompletionMinutes ?? 25, cognitiveLoad: "high", trustRequired: "high", opportunityCost: "high", decisionConsequence: "high" };
  }
  if (tier === "subscription") {
    return { moneyCost: product.amount || "variable", timeCostMinutes: 20, cognitiveLoad: "medium", trustRequired: "high", opportunityCost: "medium", decisionConsequence: "high" };
  }
  if (tier === "paid_entry") {
    return { moneyCost: product.amount || "variable", timeCostMinutes: product.estimatedCompletionMinutes ?? 12, cognitiveLoad: "medium", trustRequired: "medium", opportunityCost: "medium", decisionConsequence: "medium" };
  }
  return { moneyCost: "free", timeCostMinutes: product.estimatedCompletionMinutes ?? 5, cognitiveLoad: "low", trustRequired: "medium", opportunityCost: "medium", decisionConsequence: "medium" };
}

function outcomeStatementFor(product, tier, deliveryClass) {
  if (product.code === "fast_diagnostic") return "After using Fast Diagnostic, the customer can identify the dominant decision friction in under five minutes and choose one corrective next move.";
  if (product.code === "boardroom_brief") return "After using Boardroom Brief, the customer can defend a high-consequence decision with structured judgement, falsification challenge, risk map, and 72-hour execution sequence.";
  if (product.code.startsWith("gmi_q")) return `After using ${product.displayName}, the customer can distinguish the edition's time-bound market thesis from current intelligence and use it as dated strategic context.`;
  if (deliveryClass === "bundle_grant") return `After using ${product.displayName}, the customer can follow a guided sequence of tools and understand which decision outcome each component supports.`;
  if (tier === "subscription") return `After using ${product.displayName}, the customer can preserve governed decision continuity and return to case memory, evidence, and next actions over time.`;
  if (tier === "enterprise" || tier === "retainer") return `After using ${product.displayName}, the customer can move serious organisational decisions through clearer governance, evidence, and escalation control.`;
  if (tier === "free") return `After using ${product.displayName}, the customer can gain a clearer decision signal and decide the next useful action without wasting time.`;
  return `After using ${product.displayName}, the customer can turn a decision problem into a more specific diagnosis, consequence view, and practical next move.`;
}

function marketExpectationFor(product, tier, deliveryClass) {
  if (deliveryClass === "archived_digital_reference") return { expectedOutcome: "Dated intelligence is understood and usable as historical context.", comparableMarketStandard: "Archived paid intelligence with current-use warning.", minimumCustomerWin: "The customer can interpret the report without mistaking it for current intelligence.", unacceptableOutcome: "Dated intelligence pretending to be current." };
  if (deliveryClass === "bundle_grant") return { expectedOutcome: "A guided sequence of value.", comparableMarketStandard: "Bundled workflow with clear sequence.", minimumCustomerWin: "The customer knows what to use first and why.", unacceptableOutcome: "Disconnected entitlements." };
  if (tier === "free") return { expectedOutcome: "A sharper decision state and one useful next move.", comparableMarketStandard: "Useful public diagnostic.", minimumCustomerWin: "Insight worth the time spent.", unacceptableOutcome: "Generic bait." };
  if (tier === "paid_premium" || tier === "enterprise") return { expectedOutcome: "A serious decision artifact or execution framework.", comparableMarketStandard: "Senior advisory diagnostic or board pack.", minimumCustomerWin: "A defensible artifact for a consequential move.", unacceptableOutcome: "Generic AI-grade analysis." };
  if (tier === "subscription" || tier === "retainer") return { expectedOutcome: "Continuity, oversight, memory, escalation, and cumulative improvement.", comparableMarketStandard: "Ongoing advisory workspace.", minimumCustomerWin: "Value compounds over cases or cycles.", unacceptableOutcome: "Repeated static reports." };
  return { expectedOutcome: "Reusable insight or practical next-step guide worth more than price.", comparableMarketStandard: "Specialist diagnostic/tool.", minimumCustomerWin: "Outperforms generic AI and basic templates.", unacceptableOutcome: "A paid generic template." };
}

function priceValueSurplusFor(product, tier) {
  return {
    whyWorthMoreThanPrice: `${product.displayName} is worth more than ${product.displayPrice || "its price"} because it turns customer context into a reusable decision asset.`,
    alternativeCost: "The customer would otherwise spend founder, operator, analyst, or advisor time assembling evidence and interpretation.",
    helpsAvoid: tier === "paid_premium" || tier === "enterprise" ? "Premature approval, hidden execution risk, weak governance, and costly delay." : "Vague diagnosis, wasted effort, and low-quality next steps.",
    helpsDecideOrExecute: "It helps decide what condition exists, what matters commercially, and what next move is defensible.",
  };
}

function isContainedWeakProduct(result) {
  return result.releaseQualityStatus === "blocked_from_release" || result.releaseQualityStatus === "owned_upgrade_required";
}

function summary(result) {
  return {
    productCode: result.productCode,
    productName: result.productName,
    commercialTier: result.commercialTier,
    deliveryClass: result.deliveryClass,
    verdict: result.verdict,
    outcomeStatement: result.customerOutcomeStatement,
  };
}

function read(path) {
  return readFileSync(join(ROOT, path), "utf-8");
}

function parseCatalogProducts(source) {
  const body = extractObjectBody(source, "export const CATALOG");
  const entries = [];
  let i = 0;
  while (i < body.length) {
    const match = /\b([A-Za-z0-9_]+)\s*:\s*\{/.exec(body.slice(i));
    if (!match) break;
    const key = match[1];
    const objectStart = i + match.index + match[0].lastIndexOf("{");
    const objectEnd = findMatchingBrace(body, objectStart);
    const block = body.slice(objectStart + 1, objectEnd);
    entries.push({
      code: key,
      displayName: stringField(block, "displayName") ?? key,
      amount: numberField(block, "amount"),
      displayPrice: stringField(block, "displayPrice"),
      active: booleanField(block, "active"),
      accessType: stringField(block, "accessType") ?? "one_time",
      category: stringField(block, "category") ?? "decision_tools",
      commercialStatus: stringField(block, "commercialStatus") ?? "inactive",
      requiresCheckout: booleanField(block, "requiresCheckout"),
      requiresContract: booleanField(block, "requiresContract"),
      tier: stringField(block, "tier") ?? "",
      deliveryFormat: stringField(block, "deliveryFormat"),
      estimatedCompletionMinutes: numberField(block, "estimatedCompletionMinutes") || null,
      includesCount: arrayField(block, "includes").length,
    });
    i = objectEnd + 1;
  }
  return entries.filter((entry) => !entry.code.startsWith("_"));
}

function parseGmiEditionProducts(source) {
  const registryBody = extractArrayBody(source, "GMI_EDITION_REGISTRY");
  return splitTopLevelObjects(registryBody).map((block) => {
    const code = stringField(block, "productCode");
    const status = stringField(block, "status");
    const title = stringField(block, "title") ?? code;
    const amountGbp = numberField(block, "amountGbp");
    return {
      code,
      displayName: title,
      amount: amountGbp || 5900,
      displayPrice: stringField(block, "displayPrice") ?? "£59",
      active: status === "active" || status === "manual_billing" || status === "archived",
      accessType: "one_time",
      category: "intelligence",
      commercialStatus: status === "active" || status === "archived" ? "paid" : status,
      requiresCheckout: status === "active" || status === "archived",
      requiresContract: false,
      tier: "premium-report",
      deliveryFormat: "pdf_dossier",
      estimatedCompletionMinutes: 12,
      includesCount: 0,
    };
  }).filter((entry) => entry.code);
}

function mergeByCode(products) {
  const byCode = new Map();
  for (const product of products) byCode.set(product.code, product);
  return [...byCode.values()];
}

function stringField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*(["'])(.*?)\\1`).exec(block);
  return match ? decodeStringLiteral(match[2]) : null;
}

function numberField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*([0-9]+)`).exec(block);
  return match ? Number(match[1]) : 0;
}

function booleanField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*(true|false)`).exec(block);
  return match ? match[1] === "true" : false;
}

function arrayField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*\\[([\\s\\S]*?)\\]`).exec(block);
  if (!match) return [];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((entry) => decodeStringLiteral(entry[1]));
}

function decodeStringLiteral(value) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

function extractObjectBody(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Cannot find ${marker}`);
  const start = source.indexOf("{", markerIndex);
  const end = findMatchingBrace(source, start);
  return source.slice(start + 1, end);
}

function extractArrayBody(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Cannot find ${marker}`);
  const exportIndex = source.indexOf(`export const ${marker}`, markerIndex);
  const searchFrom = exportIndex === -1 ? markerIndex : exportIndex;
  const assignmentMatch = /=\s*\[/.exec(source.slice(searchFrom));
  if (!assignmentMatch) throw new Error(`Cannot find array assignment for ${marker}`);
  const start = searchFrom + assignmentMatch.index + assignmentMatch[0].lastIndexOf("[");
  const end = findMatchingBracket(source, start);
  return source.slice(start + 1, end);
}

function findMatchingBrace(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error("Unmatched brace");
}

function findMatchingBracket(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error("Unmatched bracket");
}

function splitTopLevelObjects(body) {
  const blocks = [];
  let i = 0;
  while (i < body.length) {
    const start = body.indexOf("{", i);
    if (start === -1) break;
    const end = findMatchingBrace(body, start);
    blocks.push(body.slice(start + 1, end));
    i = end + 1;
  }
  return blocks;
}

function renderMarkdown(report) {
  const list = (items) => items.length ? items.map((item) => `- ${item.productCode}: ${item.productName} (${item.verdict})`).join("\n") : "- None";
  const outcomeLines = Object.entries(report.productOutcomeStatements).map(([code, statement]) => `- ${code}: ${statement}`).join("\n");
  const risks = report.estateWideRisks.map((risk) => `- ${risk}`).join("\n");

  return `# Universal Product Gold Standard Review

## Gate Result

${report.gate}

## Products Reviewed

- Products reviewed: ${report.productsReviewed}
- Free products reviewed: ${report.freeProductsReviewed}
- Paid products reviewed: ${report.paidProductsReviewed}
- Premium products reviewed: ${report.premiumProductsReviewed}

## Market-Ready Products

${list(report.marketReadyProducts)}

## Market-Exceeding Products

${list(report.marketExceedingProducts)}

## Category-Leading Products

${list(report.categoryLeadingProducts)}

## Owned Upgrade Required

${list(report.ownedUpgradeRequired)}

## Blocked From Release

${list(report.blockedFromRelease)}

## Free Product Time-Respect Review

${report.freeProductTimeRespectReview.map((item) => `- ${item.productCode}: ${item.passed ? "passed" : "owned/blocked"} (${item.status})`).join("\n") || "- None"}

## Paid Product Price-Value Surplus Review

${report.paidProductPriceValueSurplusReview.map((item) => `- ${item.productCode}: ${item.passed ? "passed" : "blocked"} — ${item.surplus?.whyWorthMoreThanPrice ?? "not applicable"}`).join("\n") || "- None"}

## Premium Product Market-Exceeding Review

${report.premiumProductMarketExceedingReview.map((item) => `- ${item.productCode}: ${item.exceedsMarketExpectation ? "market-exceeding" : "blocked/owned"} (${item.status})`).join("\n") || "- None"}

## Product Outcome Statements

${outcomeLines}

## Estate-Wide Risks

${risks}

## Final Recommendation

${report.finalRecommendation}
`;
}
