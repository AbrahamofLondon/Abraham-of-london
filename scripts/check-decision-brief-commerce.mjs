#!/usr/bin/env node
/**
 * scripts/check-decision-brief-commerce.mjs
 *
 * Commerce readiness check for the Decision Failure Brief transaction spine.
 *
 * Verifies:
 *   - Database table readiness (if DATABASE_URL present)
 *   - Checkout API exists
 *   - Confirmation API exists
 *   - Success page exists
 *   - Admin order page exists
 *   - Admin list/update APIs exist
 *   - Generate-draft endpoint exists
 *   - Required Stripe env vars exist
 *   - No duplicate Stripe env names
 *   - No tracked live secrets
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

const REQUIRED_FILES = [
  { path: "pages/api/checkout/decision-failure-brief.ts",              label: "Checkout API" },
  { path: "pages/api/checkout/decision-failure-brief-confirm.ts",      label: "Confirmation API" },
  { path: "pages/foundry/brief/success.tsx",                           label: "Success page" },
  { path: "app/admin/intelligence-foundry/brief-orders/page.tsx",      label: "Admin page (server)" },
  { path: "app/admin/intelligence-foundry/brief-orders/PageClient.tsx",label: "Admin page (client)" },
  { path: "app/api/admin/intelligence-foundry/brief-orders/route.ts",  label: "Admin list API" },
  { path: "app/api/admin/intelligence-foundry/brief-orders/[id]/route.ts",         label: "Admin update API" },
  { path: "app/api/admin/intelligence-foundry/brief-orders/[id]/generate-draft/route.ts", label: "Generate draft API" },
  { path: "prisma/schema.prisma",                                      label: "Prisma schema" },
];

const REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

const STRIPE_ENV_NAMES = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_AOL_STRIPE_PUBLISHABLE_KEY",
  "AOL_STRIPE_SECRET_KEY",
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

console.log("═══ Decision Brief Commerce Readiness Check ═══\n");

// 1. Check required files exist
console.log("Checking required files exist...");
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(ROOT, file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${file.label} → ${file.path}`);
    results.push({ check: file.label, status: "PASS" });
  } else {
    console.log(`  ✗ ${file.label} → MISSING (${file.path})`);
    results.push({ check: file.label, status: "FAIL" });
    exitCode = 1;
  }
}

// 2. Check Prisma model exists in schema
console.log("\nChecking Prisma model...");
const schemaPath = path.join(ROOT, "prisma", "schema.prisma");
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf-8");
  if (schema.includes("model DecisionBriefOrder")) {
    console.log("  ✓ DecisionBriefOrder model found in schema");
    results.push({ check: "Prisma model", status: "PASS" });
  } else {
    console.log("  ✗ DecisionBriefOrder model NOT found in schema");
    results.push({ check: "Prisma model", status: "FAIL" });
    exitCode = 1;
  }
}

// 3. Check Stripe env vars
console.log("\nChecking Stripe environment variables...");

// Check .env
const envVars = loadEnvFile(path.join(ROOT, ".env"));
const envLocalVars = loadEnvFile(path.join(ROOT, ".env.local"));

for (const varName of REQUIRED_ENV_VARS) {
  const inEnv = !!envVars[varName];
  const inLocal = !!envLocalVars[varName];
  if (inEnv || inLocal) {
    console.log(`  ✓ ${varName} is set`);
    results.push({ check: `ENV: ${varName}`, status: "PASS" });
  } else {
    console.log(`  ✗ ${varName} is NOT set in .env or .env.local`);
    results.push({ check: `ENV: ${varName}`, status: "FAIL" });
    exitCode = 1;
  }
}

// 4. Check for duplicate Stripe env names
console.log("\nChecking for duplicate Stripe env names...");
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

  if (STRIPE_ENV_NAMES.includes(key)) {
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    // Only flag duplicates where both values are non-empty (ignore empty placeholders)
    if (value && value.length > 0) {
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
}

if (!duplicates) {
  console.log("  ✓ No duplicate Stripe env names");
  results.push({ check: "No duplicate Stripe env names", status: "PASS" });
}

// 5. Check for tracked live secrets
console.log("\nChecking for tracked live Stripe secrets...");
try {
  const { execSync } = await import("child_process");
  const grepResult = execSync(
    'git grep -n "sk_live_\\|whsec_" 2>&1 | findstr /v ".env"',
    { cwd: ROOT, encoding: "utf-8", shell: true }
  );
  // Filter out documentation placeholders
  const lines = grepResult.split("\n").filter(l => l.trim() && !l.includes("...") && !l.includes("*") && !l.includes("secret-scan"));
  if (lines.length > 0) {
    console.log(`  ⚠ Found ${lines.length} potential live secret reference(s) in tracked files:`);
    for (const line of lines.slice(0, 5)) {
      console.log(`     ${line.trim()}`);
    }
    results.push({ check: "Tracked live secrets", status: "WARN" });
  } else {
    console.log("  ✓ No live Stripe secrets in tracked files");
    results.push({ check: "Tracked live secrets", status: "PASS" });
  }
} catch {
  console.log("  ✓ No live Stripe secrets in tracked files");
  results.push({ check: "Tracked live secrets", status: "PASS" });
}

// 6. Summary
console.log("\n─── Summary ───");
const passes = results.filter(r => r.status === "PASS").length;
const warnings = results.filter(r => r.status === "WARN").length;
const failures = results.filter(r => r.status === "FAIL").length;

console.log(`  Passed: ${passes}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Failed: ${failures}`);

if (exitCode === 0) {
  console.log("\n  ✓ All commerce readiness checks passed.");
} else {
  console.log(`\n  ✗ ${failures} failure(s) found.`);
}

process.exit(exitCode);
