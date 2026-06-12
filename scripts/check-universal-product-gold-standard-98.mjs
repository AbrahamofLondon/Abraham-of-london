#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const JSON_REPORT = join(REPORT_DIR, "universal-product-gold-standard-98.json");
const MD_REPORT = join(REPORT_DIR, "universal-product-gold-standard-98.md");
const COMPAT_JSON_REPORT = join(REPORT_DIR, "universal-product-gold-standard.json");
const COMPAT_MD_REPORT = join(REPORT_DIR, "universal-product-gold-standard.md");

const GOLD_THRESHOLD = 98;
const REQUIRED_FILES = [
  "lib/product/universal-product-gold-standard.ts",
  "lib/product/customer-cost-model.ts",
  "lib/product/product-gold-standard-contracts.ts",
  "lib/product/evaluate-product-gold-standard.ts",
];

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

const PREVIOUS_BELOW_MARKET_CODES = new Set([
  "fast_diagnostic",
  "team_assessment",
  "enterprise_assessment",
  "boardroom_mode",
  "additional_collaborator",
]);

const GOLD_CANDIDATE_CODES = new Set([
  "boardroom_brief",
]);

const GOLD_98_DIMENSIONS = [
  "time_respect",
  "clear_customer_win",
  "specificity",
  "decision_usefulness",
  "evidence_basis",
  "actionability",
  "commercial_or_practical_consequence",
  "trust_and_authority",
  "experience_quality",
  "price_or_time_value_surplus",
  "reuse_or_return_value",
  "category_distinction",
];

const catalogSource = read("lib/commercial/catalog.ts");
const gmiRegistrySource = read("lib/commercial/gmi/gmi-edition-registry.ts");
const valueReport = readJsonIfExists("reports/universal-product-value.json");
const reportExperience = readJsonIfExists("reports/report-experience-gold-standard.json");
const waveOneReport = readJsonIfExists("reports/wave-one-gold-standard.json");

// Wave 1 certification supplies the 9.8 output-standard proof for free,
// non-checkout trust surfaces only. Paid products can never be certified
// through this route while Stripe/webhook and live-cycle proof are
// unresolved; the Wave 1 gate enforces that and this filter re-enforces it.
const WAVE_ONE_CERTIFIED = new Set(
  waveOneReport?.gate === "PASSED"
    ? (waveOneReport.results ?? [])
      .filter((result) => result.releaseStatus === "gold_standard" && result.commercialTier === "free" && !result.requiresCheckout)
      .map((result) => result.productCode)
    : [],
);
const products = mergeByCode([
  ...parseCatalogProducts(catalogSource),
  ...parseGmiEditionProducts(gmiRegistrySource),
]);

const failures = [];
for (const file of REQUIRED_FILES) {
  if (!existsSync(join(ROOT, file))) failures.push(`Missing required file: ${file}`);
}
if (products.length !== 43) failures.push(`Expected 43 products, reviewed ${products.length}`);

const context = {
  reportExperienceAmber: isReportExperienceAmber(reportExperience),
  liveCyclePending: hasWarning(reportExperience, "LIVE_CYCLE_PENDING"),
  stripeWebhookUnconfirmed: hasWarning(reportExperience, "STRIPE_WEBHOOK_UNCONFIRMED"),
  valueGateStructurallyPassed: valueReport?.gate === "PASSED STRUCTURALLY" || valueReport?.gate === "PASSED",
  waveOneCertification: {
    source: "reports/wave-one-gold-standard.json",
    gate: waveOneReport?.gate ?? "NOT_RUN",
    certifiedProducts: [...WAVE_ONE_CERTIFIED].sort(),
  },
};

const results = products.map((product) => evaluateProduct(product, context));
const below98ButPublic = results.filter((result) => result.scoreOutOf100 < GOLD_THRESHOLD && result.releaseStatus === "gold_standard");
if (below98ButPublic.length > 0) {
  failures.push(`${below98ButPublic.length} products below 9.8 are still classified gold_standard.`);
}

const counts = {
  goldStandard: results.filter((result) => result.releaseStatus === "gold_standard").length,
  blockedFromRelease: results.filter((result) => result.releaseStatus === "blocked_from_release").length,
  internalOnly: results.filter((result) => result.releaseStatus === "internal_only").length,
  below98ButPublic: below98ButPublic.length,
};

const gate = failures.length === 0 ? "PASSED" : "FAILED";
const removedFromPublic = results.filter((result) => result.wasPublicOrSellable && result.releaseStatus === "blocked_from_release");
const report = {
  generatedAt: new Date().toISOString(),
  gate,
  threshold: {
    scoreOutOf100: GOLD_THRESHOLD,
    scoreOutOf10: 9.8,
  },
  productsReviewed: results.length,
  goldStandard: counts.goldStandard,
  blockedFromRelease: counts.blockedFromRelease,
  internalOnly: counts.internalOnly,
  below98ButPublic: counts.below98ButPublic,
  context,
  goldStandardProducts: results.filter((result) => result.releaseStatus === "gold_standard"),
  blockedProducts: results.filter((result) => result.releaseStatus === "blocked_from_release"),
  internalOnlyProducts: results.filter((result) => result.releaseStatus === "internal_only"),
  productsRemovedFromPublicSellableState: removedFromPublic,
  freeProductTimeValueReview: results
    .filter((result) => result.commercialTier === "free")
    .map(({ productCode, productName, scoreOutOf10, releaseStatus, timeValueSurplusPassed, blockingReasons }) => ({
      productCode,
      productName,
      scoreOutOf10,
      releaseStatus,
      timeValueSurplusPassed,
      blockingReasons,
    })),
  paidProductPriceValueReview: results
    .filter((result) => result.isPaid)
    .map(({ productCode, productName, scoreOutOf10, releaseStatus, priceValueSurplusPassed, priceValueSurplus, blockingReasons }) => ({
      productCode,
      productName,
      scoreOutOf10,
      releaseStatus,
      priceValueSurplusPassed,
      priceValueSurplus,
      blockingReasons,
    })),
  premiumProductUnderPricedReview: results
    .filter((result) => result.commercialTier === "paid_premium" || result.commercialTier === "enterprise")
    .map(({ productCode, productName, scoreOutOf10, releaseStatus, premiumUnderPricedPassed, blockingReasons }) => ({
      productCode,
      productName,
      scoreOutOf10,
      releaseStatus,
      premiumUnderPricedPassed,
      blockingReasons,
    })),
  productByProductMatrix: results.map(matrixRow),
  requiredUpgradeBacklog: results
    .filter((result) => result.releaseStatus !== "gold_standard")
    .map(({ productCode, productName, releaseStatus, upgradeRequired }) => ({
      productCode,
      productName,
      releaseStatus,
      upgradeRequired,
    })),
  scoreDistribution: scoreDistribution(results),
  remainingRisks: [
    "Report experience remains AMBER, so paid report-like products cannot claim 9.8 gold-standard release.",
    "Live-cycle proof remains pending across delivery classes.",
    "Stripe/webhook authority remains unresolved for paid checkout-dependent products.",
    "Most product contracts now function as blocking authorities until actual artefact, journey, and delivery proof reaches 98/100.",
    "Wave 1 certification covers free, non-checkout trust surfaces only; paid Wave 1 products remain blocked pending Stripe/webhook and live-cycle proof.",
  ],
  failures,
  finalRecommendation: gate === "PASSED" ? "GREEN" : "RED",
};

mkdirSync(REPORT_DIR, { recursive: true });
const markdown = renderMarkdown(report);
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, markdown);
writeFileSync(COMPAT_JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(COMPAT_MD_REPORT, markdown);

console.log("UNIVERSAL PRODUCT GOLD STANDARD 9.8 CHECK");
console.log(`Products reviewed: ${report.productsReviewed}`);
console.log(`Gold standard: ${report.goldStandard}`);
console.log(`Blocked from release: ${report.blockedFromRelease}`);
console.log(`Internal only: ${report.internalOnly}`);
console.log(`Below 9.8 but public: ${report.below98ButPublic}`);
console.log(`Gate: ${report.gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = gate === "PASSED" ? 0 : 1;

function evaluateProduct(product, evidence) {
  const commercialTier = deriveCommercialTier(product);
  const deliveryClass = deriveDeliveryClass(product);
  const currentStatus = currentGoldStatus(product, commercialTier, deliveryClass);
  const wasPublicOrSellable = isPublicOrSellable(product);
  const dimensionScores = scoreDimensions(product, commercialTier, deliveryClass);
  const rawScore = average(Object.values(dimensionScores));
  const scoreOutOf100 = clampScore(applyEvidencePenalties(rawScore, product, commercialTier, deliveryClass, evidence));
  const scoreOutOf10 = Number((scoreOutOf100 / 10).toFixed(1));
  const blockingReasons = blockingReasonsFor(product, commercialTier, deliveryClass, scoreOutOf100, evidence);
  const releaseStatus = deriveReleaseStatus(product, commercialTier, scoreOutOf100, blockingReasons);
  const upgradeRequired = upgradeBacklogFor(product, commercialTier, deliveryClass, blockingReasons);
  const priceValueSurplus = priceValueSurplusFor(product, commercialTier);

  return {
    productCode: product.code,
    productName: product.displayName,
    commercialTier,
    deliveryClass,
    currentStatus,
    wasPublicOrSellable,
    scoreOutOf100,
    scoreOutOf10,
    releaseStatus,
    dimensionScores,
    blockingReasons,
    upgradeRequired,
    timeValueSurplusPassed: commercialTier !== "free" || scoreOutOf100 >= GOLD_THRESHOLD,
    priceValueSurplusPassed: !isPaidTier(commercialTier) || scoreOutOf100 >= GOLD_THRESHOLD,
    premiumUnderPricedPassed: !(commercialTier === "paid_premium" || commercialTier === "enterprise") || scoreOutOf100 >= GOLD_THRESHOLD,
    priceValueSurplus,
    customerOutcomeStatement: outcomeStatementFor(product, commercialTier, deliveryClass),
    isPaid: isPaidTier(commercialTier),
  };
}

function scoreDimensions(product, tier, deliveryClass) {
  const waveOneCertified = WAVE_ONE_CERTIFIED.has(product.code);
  const strongCandidate = GOLD_CANDIDATE_CODES.has(product.code) || waveOneCertified;
  const inactive = !product.active || BLOCKED_CODES.has(product.code);
  const previousBelowMarket = PREVIOUS_BELOW_MARKET_CODES.has(product.code) && !waveOneCertified;
  const base =
    inactive ? 55 :
      previousBelowMarket ? 66 :
        strongCandidate ? 98 :
          tier === "enterprise" ? 96 :
            tier === "paid_premium" ? 91 :
              tier === "subscription" || tier === "retainer" ? 82 :
                deliveryClass === "archived_digital_reference" ? 86 :
                  tier === "free" ? 84 : 88;

  return Object.fromEntries(GOLD_98_DIMENSIONS.map((dimension) => {
    let score = base;
    if (dimension === "category_distinction" && !strongCandidate && tier !== "enterprise") score -= 10;
    if (dimension === "price_or_time_value_surplus" && tier === "free" && !waveOneCertified) score -= 2;
    if (dimension === "experience_quality" && previousBelowMarket) score -= 8;
    if (dimension === "reuse_or_return_value" && deliveryClass === "bundle_grant") score -= 12;
    return [dimension, clampScore(score)];
  }));
}

function applyEvidencePenalties(rawScore, product, tier, deliveryClass, evidence) {
  let score = rawScore;
  // Wave-one-certified free surfaces have their output experience verified
  // directly by the Wave 1 gate; the AMBER report-experience penalty
  // concerns the paid report pipeline and is not hidden by this exemption.
  if (evidence.reportExperienceAmber && isReportLike(product, tier, deliveryClass) && !WAVE_ONE_CERTIFIED.has(product.code)) score -= 6;
  if (evidence.liveCyclePending && isPaidTier(tier) && product.active) score -= 5;
  if (evidence.stripeWebhookUnconfirmed && product.requiresCheckout) score -= 5;
  if (!evidence.valueGateStructurallyPassed && isPaidTier(tier)) score -= 10;
  return score;
}

function blockingReasonsFor(product, tier, deliveryClass, scoreOutOf100, evidence) {
  const reasons = [];
  if (!outcomeStatementFor(product, tier, deliveryClass).startsWith("After using ")) {
    reasons.push("No clear customer outcome statement.");
  }
  if (!product.active || BLOCKED_CODES.has(product.code)) {
    reasons.push("Product is already inactive, future-dated, duplicate, or structurally blocked.");
  }
  if (PREVIOUS_BELOW_MARKET_CODES.has(product.code) && !WAVE_ONE_CERTIFIED.has(product.code)) {
    reasons.push("Previously below-market or owned-upgrade product; 9.8 proof has not been supplied.");
  }
  if (scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push(`9.8 score is ${scoreOutOf100}/100, below the 98/100 release threshold.`);
  }
  if (tier === "free" && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Free product has not yet proven time-value surplus at 9.8 standard.");
  }
  if (isPaidTier(tier) && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Paid product has not yet proven price-value surplus at 9.8 standard.");
  }
  if ((tier === "paid_premium" || tier === "enterprise") && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Premium product has not yet proven materially under-priced value at 9.8 standard.");
  }
  if (deliveryClass === "archived_digital_reference" && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Archived product needs stronger archive-context and current-use warning proof.");
  }
  if (deliveryClass === "bundle_grant" && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Bundle product needs a guided usage sequence before release.");
  }
  if ((tier === "subscription" || tier === "retainer") && scoreOutOf100 < GOLD_THRESHOLD) {
    reasons.push("Subscription/retainer product needs continuity-value proof before scale.");
  }
  if (evidence.reportExperienceAmber && isReportLike(product, tier, deliveryClass) && !WAVE_ONE_CERTIFIED.has(product.code)) {
    reasons.push("Report experience remains AMBER or unsafe without owned resolution.");
  }
  if (evidence.liveCyclePending && isPaidTier(tier) && product.active) {
    reasons.push("Fulfilment/live-cycle proof is missing for a sellable paid product.");
  }
  if (evidence.stripeWebhookUnconfirmed && product.requiresCheckout) {
    reasons.push("Stripe/webhook authority is unresolved for a checkout-dependent product.");
  }
  return unique(reasons);
}

function deriveReleaseStatus(product, tier, scoreOutOf100, blockingReasons) {
  if (product.commercialStatus === "internal_only") return "internal_only";
  if (scoreOutOf100 >= GOLD_THRESHOLD && blockingReasons.length === 0) return "gold_standard";
  return "blocked_from_release";
}

function upgradeBacklogFor(product, tier, deliveryClass, blockingReasons) {
  const upgrades = [];
  if (blockingReasons.some((reason) => reason.includes("time-value"))) {
    upgrades.push("Replace weak lead-magnet output with one diagnosis, one reason it matters, and one next action within the promised time cost.");
  }
  if (blockingReasons.some((reason) => reason.includes("price-value"))) {
    upgrades.push("Document why the artefact is worth more than the price, what it helps avoid, and why it is reusable.");
  }
  if (blockingReasons.some((reason) => reason.includes("under-priced"))) {
    upgrades.push("Prove serious input basis, diagnosis, options, falsification, consequence, execution sequence, and reusable judgement.");
  }
  if (deliveryClass === "archived_digital_reference") {
    upgrades.push("Add archive context, time-bound claim warnings, and current-interpretation guidance.");
  }
  if (deliveryClass === "bundle_grant") {
    upgrades.push("Add a guided usage sequence: what to use first, why, and what each component changes.");
  }
  if (tier === "subscription" || tier === "retainer") {
    upgrades.push("Prove continuity value: memory, escalation, compounding insight, and cycle-over-cycle improvement.");
  }
  if (product.requiresCheckout) {
    upgrades.push("Confirm Stripe/webhook authority and live-cycle fulfilment proof before sale.");
  }
  if (upgrades.length === 0 && product.commercialStatus !== "internal_only") {
    upgrades.push("Maintain release block until 98/100 evidence is supplied.");
  }
  return unique(upgrades);
}

function currentGoldStatus(product, tier, deliveryClass) {
  if (BLOCKED_CODES.has(product.code) || !product.active) return "legacy_blocked";
  if (PREVIOUS_BELOW_MARKET_CODES.has(product.code)) return "legacy_weak";
  if (tier === "enterprise") return "legacy_flagship_candidate";
  if (tier === "paid_premium" || tier === "subscription" || tier === "retainer") return "legacy_above_market";
  return "legacy_public";
}

function deriveCommercialTier(product) {
  if (product.commercialStatus === "internal_only" || product.commercialStatus === "dormant" || product.commercialStatus === "retired") return "internal";
  if (product.accessType === "free" || product.amount <= 0 && product.commercialStatus === "free_controlled") return "free";
  if (product.accessType === "subscription") return "subscription";
  if (product.requiresContract) return "enterprise";
  if (product.amount >= 9900 || product.category === "intelligence") return "paid_premium";
  return "paid_entry";
}

function deriveDeliveryClass(product) {
  if (product.includesCount > 0) return "bundle_grant";
  if (product.category === "intelligence") return "archived_digital_reference";
  if (product.accessType === "subscription") return "subscription_retainer_cycle";
  if (product.requiresContract) return "enterprise_manual_scoping";
  return product.deliveryFormat ?? "generated_digital_artifact";
}

function isPaidTier(tier) {
  return !["free", "internal"].includes(tier);
}

function isPublicOrSellable(product) {
  if (!product.active) return false;
  if (product.commercialStatus === "inactive" || product.commercialStatus === "retired" || product.commercialStatus === "dormant") return false;
  return product.requiresCheckout || product.requiresContract || product.accessType === "free" || product.commercialStatus === "free_controlled" || product.commercialStatus === "manual_billing";
}

function isReportLike(product, tier, deliveryClass) {
  return deliveryClass === "archived_digital_reference" ||
    deliveryClass === "generated_digital_artifact" ||
    tier === "paid_premium" ||
    tier === "enterprise" ||
    product.deliveryFormat?.includes("report") ||
    product.deliveryFormat?.includes("pdf");
}

function outcomeStatementFor(product, tier, deliveryClass) {
  if (product.code === "fast_diagnostic") {
    return "After using Fast Diagnostic, the customer can identify the dominant decision friction in under five minutes and choose one corrective next move.";
  }
  if (product.code === "boardroom_brief") {
    return "After using Boardroom Brief, the customer can defend a high-consequence decision with structured judgement, falsification challenge, risk map, and 72-hour execution sequence.";
  }
  if (product.code.startsWith("gmi_q")) {
    return `After using ${product.displayName}, the customer can distinguish the edition's time-bound market thesis from current intelligence and use it as dated strategic context.`;
  }
  if (deliveryClass === "bundle_grant") {
    return `After using ${product.displayName}, the customer can follow a guided sequence of tools and understand which decision outcome each component supports.`;
  }
  if (tier === "free") {
    return `After using ${product.displayName}, the customer can gain a clearer decision signal and decide the next useful action without wasting time.`;
  }
  return `After using ${product.displayName}, the customer can turn a decision problem into a more specific diagnosis, consequence view, and practical next move.`;
}

function priceValueSurplusFor(product, tier) {
  if (!isPaidTier(tier)) return null;
  const price = product.displayPrice || (product.amount ? `GBP ${(product.amount / 100).toFixed(0)}` : "variable");
  return {
    whyWorthMoreThanPrice: `${product.displayName} must be worth materially more than ${price} by replacing advisor, analyst, operator, or leadership time.`,
    avoids: "It must help avoid wasted effort, hidden risk, weak governance, wrong sequencing, or an expensive poor decision.",
    comparableSpend: "Comparable value would otherwise require paid analysis, senior advisory review, internal operator time, or repeated decision meetings.",
    reusableBecause: "The artefact must be reusable as a decision record, challenge document, execution sequence, or archive reference.",
  };
}

function matrixRow(result) {
  return {
    product: result.productName,
    productCode: result.productCode,
    currentStatus: result.currentStatus,
    scoreOutOf10: result.scoreOutOf10,
    newReleaseStatus: result.releaseStatus,
    blockingReason: result.blockingReasons[0] ?? "None",
    requiredUpgrade: result.upgradeRequired[0] ?? "None",
  };
}

function scoreDistribution(results) {
  return {
    "9.8_to_10": results.filter((result) => result.scoreOutOf100 >= 98).length,
    "9.0_to_9.7": results.filter((result) => result.scoreOutOf100 >= 90 && result.scoreOutOf100 < 98).length,
    "8.0_to_8.9": results.filter((result) => result.scoreOutOf100 >= 80 && result.scoreOutOf100 < 90).length,
    "below_8.0": results.filter((result) => result.scoreOutOf100 < 80).length,
  };
}

function renderMarkdown(report) {
  const productList = (items) => items.length
    ? items.map((item) => `- ${item.productCode}: ${item.productName} (${item.scoreOutOf10}/10)`).join("\n")
    : "- None";
  const simpleList = (items) => items.length
    ? items.map((item) => `- ${item.productCode}: ${item.productName}`).join("\n")
    : "- None";
  const matrix = report.productByProductMatrix.map((row) =>
    `| ${escapeCell(row.product)} | ${row.currentStatus} | ${row.scoreOutOf10.toFixed(1)} | ${row.newReleaseStatus} | ${escapeCell(row.blockingReason)} | ${escapeCell(row.requiredUpgrade)} |`
  ).join("\n");
  const backlog = report.requiredUpgradeBacklog.map((item) =>
    `- ${item.productCode}: ${item.upgradeRequired.join(" ")}`
  ).join("\n") || "- None";

  return `# Universal Product Gold Standard 9.8 Review

## Gate Result

${report.gate}

## Products Reviewed

- Products reviewed: ${report.productsReviewed}
- Gold standard: ${report.goldStandard}
- Blocked from release: ${report.blockedFromRelease}
- Internal only: ${report.internalOnly}
- Below 9.8 but public: ${report.below98ButPublic}

## Gold Standard Products

${productList(report.goldStandardProducts)}

## Blocked Products

${productList(report.blockedProducts)}

## Internal-Only Products

${simpleList(report.internalOnlyProducts)}

## Products Removed From Public/Sellable State

${simpleList(report.productsRemovedFromPublicSellableState)}

## Free Product Time-Value Review

${report.freeProductTimeValueReview.map((item) => `- ${item.productCode}: ${item.timeValueSurplusPassed ? "passed" : "blocked"} (${item.scoreOutOf10}/10)`).join("\n") || "- None"}

## Paid Product Price-Value Review

${report.paidProductPriceValueReview.map((item) => `- ${item.productCode}: ${item.priceValueSurplusPassed ? "passed" : "blocked"} (${item.scoreOutOf10}/10)`).join("\n") || "- None"}

## Premium Product Under-Priced Review

${report.premiumProductUnderPricedReview.map((item) => `- ${item.productCode}: ${item.premiumUnderPricedPassed ? "passed" : "blocked"} (${item.scoreOutOf10}/10)`).join("\n") || "- None"}

## Product-by-Product 9.8 Matrix

| Product | Current Status | 9.8 Score | New Release Status | Blocking Reason | Required Upgrade |
|---|---:|---:|---|---|---|
${matrix}

## Required Upgrade Backlog

${backlog}

## Remaining Risks

${report.remainingRisks.map((risk) => `- ${risk}`).join("\n")}

## Final Recommendation

${report.finalRecommendation}
`;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(items) {
  return [...new Set(items)];
}

function isReportExperienceAmber(report) {
  return report?.gateStatus === "AMBER" || report?.status === "AMBER";
}

function hasWarning(report, code) {
  const warnings = report?.warnings ?? [];
  return JSON.stringify(warnings).includes(code);
}

function read(path) {
  return readFileSync(join(ROOT, path), "utf-8");
}

function readJsonIfExists(path) {
  const fullPath = join(ROOT, path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf-8"));
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
      deliveryFormat: stringField(block, "deliveryFormat"),
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
      deliveryFormat: "pdf_dossier",
      includesCount: 0,
    };
  }).filter((entry) => entry.code);
}

function mergeByCode(entries) {
  const byCode = new Map();
  for (const entry of entries) byCode.set(entry.code, entry);
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
  const end = findMatchingBracket(source, start, "[", "]");
  return source.slice(start + 1, end);
}

function findMatchingBrace(source, start) {
  return findMatchingBracket(source, start, "{", "}");
}

function findMatchingBracket(source, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error(`Unmatched ${open}`);
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
