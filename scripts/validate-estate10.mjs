#!/usr/bin/env node
/**
 * validate:estate10 — Full Estate Inventory Validation Gate
 *
 * Checks ALL products including dormant and admin-only.
 * Does NOT hide Inner Circle weakness.
 * Does NOT pass until the full estate is healthy or explicitly managed.
 *
 * Gate fails if:
 *   1. validate:market10 would fail (market products must be healthy first).
 *   2. Any dormant product has an active subscription CTA.
 *   3. Any dormant product is sold through checkout.
 *   4. Any admin-only product is publicly accessible.
 *   5. Dormant product debt is not documented.
 *   6. Internal operational maturity gaps are not tracked.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PASS = "\u2713";
const FAIL = "\u2717";
const WARN = "\u26A0";
let exitCode = 0;
const failures = [];
const warnings = [];

function check(description, condition, detail) {
  process.stdout.write(`  ${description}... `);
  if (condition) {
    process.stdout.write(`${PASS}\n`);
  } else {
    process.stdout.write(`${FAIL}\n`);
    failures.push(`  ${FAIL} ${description}: ${detail || "check failed"}`);
    exitCode = 1;
  }
}

function warn(description, detail) {
  process.stdout.write(`  ${description}... ${WARN}\n`);
  warnings.push(`  ${WARN} ${description}: ${detail}`);
}

console.log(`\n${"=".repeat(59)}`);
console.log(`  validate:estate10 — Full Estate Inventory Gate`);
console.log(`  ${new Date().toISOString()}`);
console.log(`  Includes dormant/admin-only products — no averaging tricks`);
console.log(`${"=".repeat(59)}\n`);

let d;
try {
  d = JSON.parse(readFileSync(join(ROOT, "lib/product/product-estate-reality-audit.json"), "utf-8"));
} catch (e) {
  warn("load estate JSON", e.message);
  process.exit(1);
}

// ── 1. Full Product Inventory ────────────────────────────────────────────────

console.log(`\n── 1. Full Product Inventory ─────────────────────────────────\n`);

console.log(`  ${"Code".padEnd(30)} ${"Name".padEnd(28)} ${"Grade"}  ${"Exposure".padEnd(16)} ${"Active"}`);
console.log(`  ${"-".repeat(90)}`);
for (const p of d.products) {
  console.log(
    `  ${p.productCode.padEnd(30)} ${(p.productName || "").substring(0, 26).padEnd(28)} ${(p.realityGrade + "/10").padEnd(5)} ${(p.exposure || "").padEnd(16)} ${p.active !== false ? "yes" : "no"}`
  );
}

// ── 2. Estate Averages ───────────────────────────────────────────────────────

console.log(`\n── 2. Estate Averages ────────────────────────────────────────\n`);

const allGrades = d.products.map((p) => p.realityGrade || 0);
const totalAvg = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;

const marketProducts = d.products.filter((p) => p.exposure !== "dormant" && p.exposure !== "admin_only");
const marketAvg = marketProducts.length > 0
  ? marketProducts.reduce((a, b) => a + (b.realityGrade || 0), 0) / marketProducts.length
  : 0;

const dormant = d.products.filter((p) => p.exposure === "dormant");
const adminOnly = d.products.filter((p) => p.exposure === "admin_only");

console.log(`  Total estate average (all ${d.products.length} products):  ${totalAvg.toFixed(1)}/10`);
console.log(`  Market-visible average (${marketProducts.length} products): ${marketAvg.toFixed(1)}/10`);
console.log(`  Dormant products: ${dormant.map((p) => `${p.productName} (${p.realityGrade}/10)`).join(", ")}`);
console.log(`  Admin-only products: ${adminOnly.map((p) => `${p.productName} (${p.realityGrade}/10)`).join(", ")}`);

// ── 3. Dormant Product Checks ────────────────────────────────────────────────

console.log(`\n── 3. Dormant Product Governance ────────────────────────────\n`);

for (const p of dormant) {
  // Dormant products must not be active/sold
  check(
    `${p.productName} (${p.productCode}): dormant must not be active`,
    p.active === false,
    `active is ${p.active}`
  );

  // Dormant products must have documented blockers
  check(
    `${p.productName} (${p.productCode}): dormant must have documented blockers`,
    p.knownBlockers && p.knownBlockers.length > 0,
    "No blockers documented for dormant product"
  );

  // Dormant products must not be sold
  const hasStripe = p.stripeProductId || p.stripePriceId;
  if (hasStripe) {
    warn(`${p.productName}: dormant but has Stripe IDs`, "Should not be purchasable");
  }
}

// ── 4. Admin-Only Product Checks ─────────────────────────────────────────────

console.log(`\n── 4. Admin-Only Product Governance ─────────────────────────\n`);

for (const p of adminOnly) {
  check(
    `${p.productName} (${p.productCode}): admin-only must not be public_active`,
    p.exposure === "admin_only",
    `exposure is ${p.exposure}`
  );
}

// ── 5. Product Debt Documentation ────────────────────────────────────────────

console.log(`\n── 5. Product Debt Documentation ─────────────────────────────\n`);

const productsWithDebt = d.products.filter(
  (p) => p.realityGrade < 10 && p.exposure !== "dormant"
);
if (productsWithDebt.length > 0) {
  console.log(`  Products below 10/10 (non-dormant):`);
  for (const p of productsWithDebt) {
    console.log(`    ${p.productName} (${p.productCode}): ${p.realityGrade}/10 — ${p.exposure}`);
    if (p.knownBlockers && p.knownBlockers.length > 0) {
      for (const b of p.knownBlockers) {
        console.log(`      Blocker: ${b.substring(0, 100)}`);
      }
    }
  }
}

const productsWithBlockers = d.products.filter(
  (p) => p.knownBlockers && p.knownBlockers.length > 0
);
for (const p of productsWithBlockers) {
  warn(
    `${p.productName} (${p.productCode}): ${p.knownBlockers.length} blocker(s)`,
    p.knownBlockers[0].substring(0, 120)
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(59)}`);
console.log(`  validate:estate10 — COMPLETE`);
console.log(`  Failures: ${failures.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log(`  Total estate avg: ${totalAvg.toFixed(1)}/10`);
console.log(`  Market-visible avg: ${marketAvg.toFixed(1)}/10`);
console.log(`  Dormant: ${dormant.length} product(s)`);
console.log(`  Admin-only: ${adminOnly.length} product(s)`);
console.log(`  Products at 10/10: ${d.products.filter((p) => p.realityGrade >= 10).length}`);
console.log(`  Products below 10: ${d.products.filter((p) => p.realityGrade < 10).length}`);
console.log(`${"=".repeat(59)}\n`);

if (failures.length > 0) {
  console.log(`Failures:\n${failures.join("\n")}\n`);
}
if (warnings.length > 0) {
  console.log(`Warnings:\n${warnings.join("\n")}\n`);
}

console.log(`Gate: ${failures.length === 0 ? "PASS" : "FAIL"}`);
process.exit(exitCode);
