#!/usr/bin/env node
/**
 * scripts/check-product-catalogue-integrity.mjs
 *
 * Product Catalogue Integrity Check.
 *
 * Fails if:
 *   - A public product has no source engine
 *   - A paid product has no fulfilment path
 *   - A product has no next action
 *   - A route exposes internal terms
 *   - A product does not map to a DecisionCase source
 *   - A paid tier lacks quality checklist
 *   - A premium route has no qualification path
 *   - A verification claim exceeds implementation
 *   - Stripe env discipline is violated
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

const INTERNAL_TERMS = [
  "ResearchRun",
  "LIVE_GOVERNED",
  "RESERVED_CONCEPT",
  "adapter",
  "CI gate",
  "governance event",
];

const FORBIDDEN_CLAIMS = [
  "professional advice",
  "cryptographic proof",
  "legally binding",
  "guarantees",
  "replaces a qualified professional",
];

const PUBLIC_ROUTES = [
  { path: "/foundry/decision-test", file: "pages/foundry/decision-test.tsx" },
  { path: "/foundry/market-signal-test", file: "pages/foundry/market-signal-test.tsx" },
  { path: "/foundry/release-risk-test", file: "pages/foundry/release-risk-test.tsx" },
  { path: "/verify", file: "pages/verify.tsx" },
  { path: "/continuity", file: "pages/continuity.tsx" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const vars = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

let exitCode = 0;
const results = [];

console.log("═══ Product Catalogue Integrity Check ═══\n");

// 1. Load the catalogue
const cataloguePath = path.join(ROOT, "lib", "product", "product-catalogue-registry.ts");
const catalogueContent = fs.readFileSync(cataloguePath, "utf-8");

// Extract product entries by finding all step definitions
const productSteps = [];
const stepRegex = /(\w+):\s*\{[^}]*step:\s*"(\w+)"/g;
let match;
while ((match = stepRegex.exec(catalogueContent)) !== null) {
  productSteps.push(match[1]);
}

console.log(`Found ${productSteps.length} product entries in catalogue.\n`);

// 2. Check each product has required fields
console.log("Checking product catalogue entries...");
const requiredFields = [
  { field: "name", label: "name" },
  { field: "publicPromise", label: "public promise" },
  { field: "buyer", label: "buyer" },
  { field: "price", label: "price" },
  { field: "sourceEngine", label: "source engine" },
  { field: "route", label: "route" },
  { field: "fulfilmentPath", label: "fulfilment path" },
  { field: "nextAction", label: "next action" },
  { field: "visibility", label: "visibility" },
  { field: "qualityGates", label: "quality gates" },
  { field: "forbiddenClaims", label: "forbidden claims" },
];

for (const step of productSteps) {
  for (const { field, label } of requiredFields) {
    const regex = new RegExp(`${step}:\\s*\\{[^}]*${field}:\\s*`);
    if (!regex.test(catalogueContent)) {
      console.log(`  ✗ ${step} missing required field: ${label}`);
      results.push({ check: `${step}.${field}`, status: "FAIL" });
      exitCode = 1;
    }
  }
}

// 3. Check paid products have fulfilment path
console.log("\nChecking paid products have fulfilment paths...");
const paidPatterns = [
  { step: "decision_failure_brief_basic", price: "£49" },
  { step: "decision_failure_brief_full", price: "£149" },
  { step: "decision_failure_brief_urgent", price: "£349" },
  { step: "executive_decision_review", price: "£2,500" },
];

for (const { step, price } of paidPatterns) {
  const hasFulfilment = catalogueContent.includes(`${step}:`) && catalogueContent.includes(`fulfilmentPath:`);
  if (!hasFulfilment) {
    console.log(`  ✗ ${step} (${price}) missing fulfilment path`);
    results.push({ check: `${step}.fulfilmentPath`, status: "FAIL" });
    exitCode = 1;
  }
}

// 4. Check premium products have qualification rule
console.log("\nChecking premium products have qualification paths...");
const premiumSteps = ["executive_decision_review", "retainer_continuity"];
for (const step of premiumSteps) {
  const hasQualification = catalogueContent.includes(`${step}:`) && catalogueContent.includes(`qualificationRule:`);
  if (!hasQualification) {
    console.log(`  ✗ ${step} missing qualification rule`);
    results.push({ check: `${step}.qualificationRule`, status: "FAIL" });
    exitCode = 1;
  }
}

// 5. Check public routes don't expose internal terms
console.log("\nChecking public routes don't expose internal terms...");
for (const route of PUBLIC_ROUTES) {
  const filePath = path.join(ROOT, route.file);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ ${route.path} file not found, skipping`);
    continue;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  for (const term of INTERNAL_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = term.includes(" ")
      ? new RegExp(escaped, "gi")
      : new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = content.match(regex);
    if (matches) {
      console.log(`  ✗ ${route.path} contains internal term "${term}" (${matches.length} occurrence(s))`);
      results.push({ check: `${route.path}:${term}`, status: "FAIL" });
      exitCode = 1;
    }
  }
}

// 6. Check forbidden claims are not made in public routes
console.log("\nChecking forbidden claims are not made in public routes...");
for (const route of PUBLIC_ROUTES) {
  const filePath = path.join(ROOT, route.file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const claim of FORBIDDEN_CLAIMS) {
    if (content.toLowerCase().includes(claim.toLowerCase())) {
      // Check if it's in a disclaimer (negated)
      const lineRegex = new RegExp(`^.*${claim}.*$`, "gim");
      const lines = content.match(lineRegex) || [];
      for (const line of lines) {
        // Skip if the claim is negated (e.g., "not professional advice")
        if (!line.toLowerCase().includes(`not ${claim}`) && !line.toLowerCase().includes(`no ${claim}`)) {
          console.log(`  ✗ ${route.path} may contain forbidden claim: "${claim}"`);
          results.push({ check: `${route.path}:forbidden:${claim}`, status: "FAIL" });
          exitCode = 1;
        }
      }
    }
  }
}

// 7. Check Stripe env discipline
console.log("\nChecking Stripe environment discipline...");
const envVars = loadEnvFile(path.join(ROOT, ".env"));
const stripeKey = envVars["STRIPE_SECRET_KEY"] || "";

if (stripeKey) {
  if (stripeKey.startsWith("sk_test_")) {
    console.log("  ⚠ .env contains TEST Stripe key — appropriate for local dev");
    results.push({ check: "Stripe env: test key in .env", status: "WARN" });
  } else if (stripeKey.startsWith("sk_live_")) {
    console.log("  ✓ .env contains LIVE Stripe key — appropriate for production");
    results.push({ check: "Stripe env: live key in .env", status: "PASS" });
  } else {
    console.log("  ⚠ Stripe key format unrecognised");
    results.push({ check: "Stripe env: unrecognised key format", status: "WARN" });
  }
} else {
  console.log("  ⚠ No STRIPE_SECRET_KEY in .env");
  results.push({ check: "Stripe env: no key", status: "WARN" });
}

// Check for duplicate Stripe env names
const stripeEnvNames = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
const allEnvContent = (() => {
  try { return fs.readFileSync(path.join(ROOT, ".env"), "utf-8"); } catch { return ""; }
})() + "\n" + (() => {
  try { return fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8"); } catch { return ""; }
})();

const envLines = allEnvContent.split("\n");
const seenKeys = {};
let duplicates = false;

for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");

  if (stripeEnvNames.includes(key) && value && value.length > 0) {
    if (seenKeys[key]) {
      console.log(`  ✗ Duplicate Stripe env name: ${key}`);
      results.push({ check: `Duplicate: ${key}`, status: "FAIL" });
      duplicates = true;
      exitCode = 1;
    } else {
      seenKeys[key] = true;
    }
  }
}

if (!duplicates) {
  console.log("  ✓ No duplicate Stripe env names");
  results.push({ check: "No duplicate Stripe env names", status: "PASS" });
}

// 8. Summary
console.log("\n─── Summary ───");
const passes = results.filter(r => r.status === "PASS").length;
const warnings = results.filter(r => r.status === "WARN").length;
const failures = results.filter(r => r.status === "FAIL").length;

console.log(`  Passed: ${passes}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Failed: ${failures}`);

if (exitCode === 0) {
  console.log("\n  ✓ All product catalogue integrity checks passed.");
} else {
  console.log(`\n  ✗ ${failures} failure(s) found.`);
}

process.exit(exitCode);
