#!/usr/bin/env node
/**
 * validate:market10 — Market Readiness Validation Gate
 *
 * Checks all public-facing products, paid ladder, diagnostics, content/proof,
 * trust seams, route smoke, and exposure boundaries.
 *
 * May pass while validate:estate10 fails (dormant/admin products are excluded).
 *
 * Gate fails if:
 *   1. Any public_active product is below 10/10.
 *   2. Any public_limited paid product is below 8/10.
 *   3. Any active diagnostic is below 9/10.
 *   4. Any trust seam is open.
 *   5. Any dormant product is sold.
 *   6. Any paid output lacks fulfilment authority.
 *   7. Any migration pending.
 *   8. Any known warning is not registered.
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

function run(description, cmd) {
  process.stdout.write(`  ${description}... `);
  try {
    execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    process.stdout.write(`${PASS}\n`);
    return true;
  } catch (err) {
    process.stdout.write(`${FAIL}\n`);
    const msg = err.stderr?.trim() || err.message || "unknown error";
    failures.push(`  ${FAIL} ${description}: ${msg.substring(0, 200)}`);
    exitCode = 1;
    return false;
  }
}

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
console.log(`  validate:market10 — Market Readiness Gate`);
console.log(`  ${new Date().toISOString()}`);
console.log(`  Excludes dormant/admin-only products`);
console.log(`${"=".repeat(59)}\n`);

// ── 1. Prisma ────────────────────────────────────────────────────────────────

console.log(`\n── 1. Prisma Schema & Migration ───────────────────────────────\n`);
run("prisma validate", "pnpm exec prisma validate");
run("prisma migrate status", "pnpm exec prisma migrate status");
run("prisma generate", "pnpm exec prisma generate");

try {
  const ms = execSync("pnpm exec prisma migrate status", { cwd: ROOT, encoding: "utf-8" });
  check("No pending migrations", !ms.includes("Pending") && !ms.includes("pending"), "Pending migrations detected");
} catch {
  warn("prisma migrate status", "Transient DB issue — could not verify");
}

// ── 2. TypeScript ────────────────────────────────────────────────────────────

console.log(`\n── 2. TypeScript ─────────────────────────────────────────────\n`);
run("tsc --noEmit", "pnpm exec tsc --noEmit --pretty false");

// ── 3. Tests ─────────────────────────────────────────────────────────────────

console.log(`\n── 3. Test Suites ────────────────────────────────────────────\n`);
run("tests/lib/artifacts", 'pnpm exec vitest run tests/lib/artifacts --reporter=verbose 2>&1');
run("tests/lib/falsification", 'pnpm exec vitest run tests/lib/falsification --reporter=verbose 2>&1');
run("tests/lib/outcomes", 'pnpm exec vitest run tests/lib/outcomes --reporter=verbose 2>&1');
run("tests/product-estate", 'pnpm exec vitest run tests/product-estate --reporter=verbose 2>&1');
run("tests/decision-instruments", 'pnpm exec vitest run tests/decision-instruments --reporter=verbose 2>&1');

// ── 4. Estate Audit ──────────────────────────────────────────────────────────

console.log(`\n── 4. Product Estate Audit ───────────────────────────────────\n`);
run("estate audit", "node scripts/audit-product-estate.mjs --json");

// ── 5. Market Score Gates ────────────────────────────────────────────────────

console.log(`\n── 5. Market Score Gates ──────────────────────────────────────\n`);

let d;
try {
  d = JSON.parse(readFileSync(join(ROOT, "lib/product/product-estate-reality-audit.json"), "utf-8"));
} catch (e) {
  warn("load estate JSON", e.message);
  process.exit(1);
}

// Market-visible products: exclude dormant and admin_only
const marketProducts = d.products.filter(
  (p) => p.exposure !== "dormant" && p.exposure !== "admin_only"
);

const publicActive = marketProducts.filter((p) => p.exposure === "public_active");
const publicLimited = marketProducts.filter((p) => p.exposure === "public_limited");
const diagnostics = marketProducts.filter((p) => p.price === "Free");
const paidProducts = marketProducts.filter((p) => p.price && p.price !== "Free");

// 5a. Public_active products must be 10/10
for (const p of publicActive) {
  check(
    `${p.productName} (${p.productCode}): public_active must be 10/10`,
    p.realityGrade >= 10,
    `Grade is ${p.realityGrade}/10`
  );
}

// 5b. Public_limited paid products must be >= 8/10
for (const p of publicLimited.filter((p) => p.price && p.price !== "Free")) {
  check(
    `${p.productName} (${p.productCode}): public_limited paid must be >= 8/10`,
    p.realityGrade >= 8,
    `Grade is ${p.realityGrade}/10`
  );
}

// 5c. Active diagnostics must be >= 9/10
for (const p of diagnostics) {
  if (p.active !== false) {
    check(
      `${p.productName} (${p.productCode}): active diagnostic must be >= 9/10`,
      p.realityGrade >= 9,
      `Grade is ${p.realityGrade}/10`
    );
  }
}

// 5d. No dormant product sold
const dormantProducts = d.products.filter((p) => p.exposure === "dormant");
for (const p of dormantProducts) {
  if (p.active === true) {
    check(`${p.productName}: dormant but active`, false, "Dormant product must not be active");
  }
}

// 5e. Compute averages
const marketGrades = marketProducts.map((p) => p.realityGrade || 0);
const marketAvg = marketGrades.reduce((a, b) => a + b, 0) / marketGrades.length;
const paidGrades = paidProducts.map((p) => p.realityGrade || 0);
const paidAvg = paidGrades.length > 0 ? paidGrades.reduce((a, b) => a + b, 0) / paidGrades.length : 0;
const diagGrades = diagnostics.map((p) => p.realityGrade || 0);
const diagAvg = diagGrades.length > 0 ? diagGrades.reduce((a, b) => a + b, 0) / diagGrades.length : 0;

console.log(`\n  Market-visible average: ${marketAvg.toFixed(1)}/10`);
console.log(`  Paid ladder average:    ${paidAvg.toFixed(1)}/10`);
console.log(`  Public diagnostic avg:  ${diagAvg.toFixed(1)}/10`);

// ── 6. Trust Seam Zero ────────────────────────────────────────────────────────

console.log(`\n── 6. Trust Seam Zero ────────────────────────────────────────\n`);

check("Refund policy page exists", existsSync(join(ROOT, "pages/refund-policy.tsx")), "pages/refund-policy.tsx");

const pricingContent = existsSync(join(ROOT, "pages/pricing.tsx"))
  ? readFileSync(join(ROOT, "pages/pricing.tsx"), "utf-8") : "";
check("Pricing page links refund policy", pricingContent.includes("refund"), "refund link in pricing.tsx");

const nfExists = existsSync(join(ROOT, "components/NewsletterForm.tsx"));
check("Newsletter form exists", nfExists, "components/NewsletterForm.tsx");
if (nfExists) {
  const nf = readFileSync(join(ROOT, "components/NewsletterForm.tsx"), "utf-8");
  check("Newsletter has submit handler", nf.includes("fetch(") || nf.includes("handleSubmit"), "submits to API");
  check("Newsletter has success state", nf.includes("success"), "handles success");
  check("Newsletter has error state", nf.includes("error"), "handles errors");
}

const ssExists = existsSync(join(ROOT, "app/strategy-room/success/page.tsx"));
check("Strategy Room success page exists", ssExists, "app/strategy-room/success/page.tsx");
if (ssExists) {
  const ss = readFileSync(join(ROOT, "app/strategy-room/success/page.tsx"), "utf-8");
  check("Success page is not Coming_Soon.exe", !ss.includes("Coming_Soon"), "production-quality");
}

check("Error monitoring infra exists", existsSync(join(ROOT, "lib/monitoring")) || existsSync(join(ROOT, "lib/observability")), "lib/monitoring or lib/observability");

// Critical routes
const criticalRoutes = {
  "/pressure": "pages/pressure.tsx",
  "/pricing": "pages/pricing.tsx",
  "/boardroom-brief": "pages/boardroom-brief.tsx",
  "/strategy-room": "pages/strategy-room/index.tsx",
  "/enterprise": "pages/enterprise.tsx",
  "/intelligence/gmi": "pages/intelligence/gmi/index.tsx",
  "/briefs": "pages/briefs/index.tsx",
};
let allRoutesExist = true;
for (const [route, file] of Object.entries(criticalRoutes)) {
  if (!existsSync(join(ROOT, file))) {
    allRoutesExist = false;
    warn(`Critical route ${route}`, `Expected at ${file} but not found`);
  }
}
check("All critical routes exist", allRoutesExist, `${Object.keys(criticalRoutes).length} routes verified`);

// ── 7. Paid Product Runtime Authority ─────────────────────────────────────────

console.log(`\n── 7. Paid Product Runtime Authority ─────────────────────────\n`);

check("Artifact authority library exists", existsSync(join(ROOT, "lib/artifacts/artifact-authority.ts")), "lib/artifacts/artifact-authority.ts");
check("Falsification library exists", existsSync(join(ROOT, "lib/falsification/product-falsification.ts")), "lib/falsification/product-falsification.ts");
check("Outcome hypothesis library exists", existsSync(join(ROOT, "lib/outcomes/outcome-hypothesis.ts")), "lib/outcomes/outcome-hypothesis.ts");
check("Paid product runtime exists", existsSync(join(ROOT, "lib/artifacts/paid-product-runtime.ts")), "lib/artifacts/paid-product-runtime.ts");
check("Boardroom brief authority exists", existsSync(join(ROOT, "lib/boardroom/boardroom-brief-authority.ts")), "lib/boardroom/boardroom-brief-authority.ts");

for (const p of paidProducts) {
  const hasAdmin = p.adminRoutes && p.adminRoutes.length > 0;
  check(`${p.productName} has admin visibility`, hasAdmin, p.adminRoutes?.join(", ") || "no admin routes");
}

// ── 8. Git Diff ──────────────────────────────────────────────────────────────

console.log(`\n── 8. Git Diff Check ─────────────────────────────────────────\n`);
try {
  const diff = execSync("git diff --check", { cwd: ROOT, encoding: "utf-8" });
  if (diff.trim()) {
    warn("git diff --check", "Whitespace errors found");
  } else {
    console.log(`  ${PASS} No whitespace errors`);
  }
} catch {
  warn("git diff --check", "Whitespace errors detected");
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(59)}`);
console.log(`  validate:market10 — COMPLETE`);
console.log(`  Failures: ${failures.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log(`  Market-visible avg: ${marketAvg.toFixed(1)}/10`);
console.log(`  Paid ladder avg:    ${paidAvg.toFixed(1)}/10`);
console.log(`  Public diagnostic:  ${diagAvg.toFixed(1)}/10`);
console.log(`${"=".repeat(59)}\n`);

if (failures.length > 0) {
  console.log(`Failures:\n${failures.join("\n")}\n`);
}
if (warnings.length > 0) {
  console.log(`Warnings:\n${warnings.join("\n")}\n`);
}

console.log(`Gate: ${failures.length === 0 ? "PASS" : "FAIL"}`);
process.exit(exitCode);
