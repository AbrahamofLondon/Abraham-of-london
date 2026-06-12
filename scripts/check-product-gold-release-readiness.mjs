#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const GOLD_98_REPORT = join(ROOT, "reports/universal-product-gold-standard-98.json");
const ROADMAP_REPORT = join(ROOT, "reports/product-gold-upgrade-roadmap.json");
const VALUE_REPORT = join(ROOT, "reports/universal-product-value.json");
const REPORT_EXPERIENCE_REPORT = join(ROOT, "reports/report-experience-gold-standard.json");

const failures = [];
const gold98 = readJson(GOLD_98_REPORT, "9.8 report");
const roadmap = readJson(ROADMAP_REPORT, "upgrade roadmap report");
const valueReport = readJson(VALUE_REPORT, "universal product value report");
const reportExperience = readJson(REPORT_EXPERIENCE_REPORT, "report experience report");

const products = [
  ...gold98.goldStandardProducts,
  ...gold98.blockedProducts,
  ...gold98.internalOnlyProducts,
];

if (products.length !== 43) failures.push(`Expected 43 products, reviewed ${products.length}.`);
if (roadmap.productsReviewed !== 43) failures.push(`Roadmap expected 43 products, reviewed ${roadmap.productsReviewed}.`);
if (valueReport.gate !== "PASSED STRUCTURALLY" && valueReport.gate !== "PASSED") {
  failures.push("Universal product value gate is not passing structurally.");
}
if (reportExperience.hardFailures > 0 || reportExperience.gateStatus === "FAILED" || reportExperience.status === "FAILED") {
  failures.push("Report experience has hard failures.");
}

const publicBelow98 = products.filter((product) =>
  product.scoreOutOf100 < 98 &&
  product.releaseStatus === "gold_standard" &&
  product.wasPublicOrSellable
);
const sellableBelow98 = products.filter((product) =>
  product.scoreOutOf100 < 98 &&
  product.releaseStatus === "gold_standard" &&
  product.isPaid
);
const unblockedBelow98 = products.filter((product) =>
  product.scoreOutOf100 < 98 &&
  product.releaseStatus !== "blocked_from_release" &&
  product.releaseStatus !== "internal_only"
);

if (publicBelow98.length > 0) failures.push(`${publicBelow98.length} public products below 9.8 still have release authority.`);
if (sellableBelow98.length > 0) failures.push(`${sellableBelow98.length} sellable products below 9.8 still have release authority.`);
if (unblockedBelow98.length > 0) failures.push(`${unblockedBelow98.length} products below 9.8 are not blocked/internal.`);

for (const plan of roadmap.plans ?? []) {
  if (!plan.productFamily) failures.push(`${plan.productCode}: missing product family.`);
  if (!plan.releaseConditions?.length) failures.push(`${plan.productCode}: missing release conditions.`);
  if (!plan.requiredUpgradeWorkstreams?.length) failures.push(`${plan.productCode}: missing workstreams.`);
}

for (const paths of Object.values(roadmap.composerCoverage ?? {})) {
  for (const path of paths) {
    if (!existsSync(join(ROOT, path))) failures.push(`Missing composer: ${path}`);
  }
}

const counts = {
  goldStandard: products.filter((product) => product.releaseStatus === "gold_standard").length,
  blocked: products.filter((product) => product.releaseStatus === "blocked_from_release").length,
  internalOnly: products.filter((product) => product.releaseStatus === "internal_only").length,
};

const gate = failures.length === 0 ? "PASSED" : "FAILED";

console.log("PRODUCT GOLD RELEASE READINESS CHECK");
console.log(`Products reviewed: ${products.length}`);
console.log(`Gold standard: ${counts.goldStandard}`);
console.log(`Blocked: ${counts.blocked}`);
console.log(`Internal-only: ${counts.internalOnly}`);
console.log(`Public below 9.8: ${publicBelow98.length}`);
console.log(`Sellable below 9.8: ${sellableBelow98.length}`);
console.log(`Gate: ${gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = gate === "PASSED" ? 0 : 1;

function readJson(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing ${label}: ${path}`);
    return {};
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}
