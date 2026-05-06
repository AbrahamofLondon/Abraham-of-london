#!/usr/bin/env node
/**
 * Full Validation Gate — the only acceptable "clean bill".
 * Run: node scripts/quality/full-validation.mjs
 */

import { execSync } from "child_process";

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const results = [];

function run(label, cmd, { allowFail = false, timeout = 300_000 } = {}) {
  process.stdout.write(`  ${label}... `);
  try {
    execSync(cmd, { stdio: "pipe", timeout });
    console.log(PASS);
    results.push({ label, status: "PASS" });
    return true;
  } catch (e) {
    if (allowFail) {
      console.log(`${FAIL} (non-blocking)`);
      results.push({ label, status: "FAIL (non-blocking)" });
    } else {
      console.log(FAIL);
      results.push({ label, status: "FAIL" });
    }
    return false;
  }
}

console.log("\n========================================");
console.log("  FULL VALIDATION GATE");
console.log("========================================\n");

run("Prisma validate", "npx prisma validate");
run("Prisma generate", "npx prisma generate");
run("TypeScript", "npx tsc --noEmit --pretty false");
run("PDF audit", "npm run pdf:audit");
run("PDF enforce", "npm run pdf:enforce");
run("MDX integrity", "node scripts/mdx-integrity-check.mjs");
run("MDX gate", "node scripts/mdx-illegal-jsx-gate.mjs");
run("Unit tests", "npx vitest run --reporter=verbose");
run("Client bundle audit", "node scripts/security/audit-client-bundle-secrets.mjs");
run("Public IP audit", "node scripts/security/audit-public-ip-exposure.mjs");
run("Build", "pnpm build", { timeout: 900_000 });

console.log("\n========================================");
console.log("  RESULTS");
console.log("========================================\n");

let blocking = 0;
let nonBlocking = 0;
for (const r of results) {
  const icon = r.status === "PASS" ? PASS : r.status.includes("non-blocking") ? "⚠️ " : FAIL;
  console.log(`  ${icon}  ${r.label}`);
  if (r.status === "FAIL") blocking++;
  if (r.status.includes("non-blocking")) nonBlocking++;
}

console.log("");
if (blocking > 0) {
  console.log(`  VERDICT: NOT CLEAN — ${blocking} blocking failure(s)\n`);
  process.exit(1);
} else if (nonBlocking > 0) {
  console.log(`  VERDICT: CLEAN WITH DOCUMENTED NON-BLOCKING DEBT (${nonBlocking})\n`);
} else {
  console.log("  VERDICT: CLEAN\n");
}
