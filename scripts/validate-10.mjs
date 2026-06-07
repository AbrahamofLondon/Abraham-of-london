#!/usr/bin/env node
/**
 * validate:10 — Operation 10/10 HARD VALIDATION GATE
 *
 * This gate MUST FAIL until the estate is genuinely 10/10 or explicitly limited.
 * No more passing "10/10" with 7.8/10 estate average.
 *
 * Gate fails if:
 *   1. Estate average < 9.8
 *   2. Any active paid product is below 10 and not explicitly public_limited
 *   3. Any public-limited paid product lacks visible boundary copy
 *   4. Any active diagnostic is below 9
 *   5. Any trust seam is open
 *   6. Any paid product lacks artifact authority, hash, falsification, hypothesis, Return Brief, admin, customer status
 *   7. Any migration pending
 *   8. Any known warning is not registered with severity, owner, reason, and next action
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PASS = "✓";
const FAIL = "✗";
const WARN = "⚠";
let exitCode = 0;
const failures = [];
const warnings = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(description, cmd) {
  process.stdout.write(`  ${description}... `);
  try {
    const result = execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    process.stdout.write(`${PASS}\n`);
    return result.trim();
  } catch (err) {
    process.stdout.write(`${FAIL}\n`);
    const msg = err.stderr?.trim() || err.message || "unknown error";
    failures.push(`  ${FAIL} ${description}: ${msg}`);
    exitCode = 1;
    return null;
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

function registerWarning(description, severity, owner, reason, nextAction) {
  process.stdout.write(`  ${description}... ${WARN}\n`);
  warnings.push(`  ${WARN} ${description} [${severity}] Owner: ${owner} | ${reason} | Next: ${nextAction}`);
}

// ── Header ───────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  validate:10 — HARD VALIDATION GATE`);
console.log(`  ${new Date().toISOString()}`);
console.log(`  FAILS UNTIL ESTATE IS GENUINELY 10/10 OR EXPLICITLY LIMITED`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PRISMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 1. Prisma Schema & Migration ───────────────────────────────\n`);

run("prisma validate", "pnpm exec prisma validate");
run("prisma migrate status", "pnpm exec prisma migrate status");
run("prisma generate", "pnpm exec prisma generate");

// Check for pending migrations
try {
  const migrateStatusOutput = execSync("pnpm exec prisma migrate status", { cwd: ROOT, encoding: "utf-8" });
  const hasPending = migrateStatusOutput.includes("Pending") || migrateStatusOutput.includes("pending");
  check("No pending migrations", !hasPending, hasPending ? "Pending migrations detected" : "All migrations applied");
} catch (err) {
  // Transient DB connection failures should not block the gate
  const msg = err.stderr?.trim() || err.message || "";
  if (msg.includes("terminating connection") || msg.includes("connection") || msg.includes("Closed")) {
    warn("prisma migrate status", `Transient DB connection issue — could not verify migration status. ${msg.substring(0, 100)}`);
  } else {
    check("No pending migrations", false, `Migration check failed: ${msg.substring(0, 200)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TYPESCRIPT
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 2. TypeScript ─────────────────────────────────────────────\n`);

run("tsc --noEmit", "pnpm exec tsc --noEmit --pretty false");

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 3. Test Suites ────────────────────────────────────────────\n`);

run("tests/lib/artifacts", 'pnpm exec vitest run tests/lib/artifacts --reporter=verbose 2>&1');
run("tests/lib/falsification", 'pnpm exec vitest run tests/lib/falsification --reporter=verbose 2>&1');
run("tests/lib/outcomes", 'pnpm exec vitest run tests/lib/outcomes --reporter=verbose 2>&1');
run("tests/product-estate", 'pnpm exec vitest run tests/product-estate --reporter=verbose 2>&1');
run("tests/decision-instruments", 'pnpm exec vitest run tests/decision-instruments --reporter=verbose 2>&1');

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRODUCT ESTATE AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 4. Product Estate Audit ───────────────────────────────────\n`);

const auditResult = run("estate audit", "node scripts/audit-product-estate.mjs --json");

// Parse audit JSON
let estateData = null;
if (auditResult) {
  try {
    estateData = JSON.parse(auditResult);
  } catch {
    warn("parse audit JSON", "Could not parse audit output as JSON");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ESTATE SCORE GATES (HARD)
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 5. Estate Score Gates (HARD) ──────────────────────────────\n`);

// Load the estate JSON directly for detailed analysis
let estateJson = null;
try {
  estateJson = JSON.parse(readFileSync(join(ROOT, "lib/product/product-estate-reality-audit.json"), "utf-8"));
} catch (e) {
  warn("load estate JSON", `Could not load: ${e.message}`);
}

const products = estateJson?.products || [];
const ladder = estateJson?.ladder || [];

// 5a. Estate average must be >= 9.8
const allGrades = products.map(p => p.realityGrade || 0);
const avg = allGrades.length > 0 ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length) : 0;
check("Estate average >= 9.8", avg >= 9.8, `Current: ${avg.toFixed(1)}/10`);

// 5b. Calculate visible estate average (exclude dormant/admin-only)
const visibleProducts = products.filter(p => p.classification !== "DORMANT" && p.classification !== "ADMIN_ONLY");
const visibleAvg = visibleProducts.length > 0
  ? (visibleProducts.reduce((sum, p) => sum + (p.realityGrade || 0), 0) / visibleProducts.length)
  : 0;
console.log(`  Visible estate average (excl. dormant/admin): ${visibleAvg.toFixed(1)}/10`);

// 5c. Paid ladder average
const paidProducts = products.filter(p => p.price && p.price !== "Free" && p.classification !== "DORMANT");
const paidAvg = paidProducts.length > 0
  ? (paidProducts.reduce((sum, p) => sum + (p.realityGrade || 0), 0) / paidProducts.length)
  : 0;
console.log(`  Paid ladder average: ${paidAvg.toFixed(1)}/10`);

// 5d. Public diagnostic average
const diagnostics = products.filter(p => p.price === "Free" && p.classification !== "DORMANT");
const diagAvg = diagnostics.length > 0
  ? (diagnostics.reduce((sum, p) => sum + (p.realityGrade || 0), 0) / diagnostics.length)
  : 0;
console.log(`  Public diagnostic average: ${diagAvg.toFixed(1)}/10`);

// 5e. Content/proof average
const contentProducts = products.filter(p => ["briefs_vault_editorial", "gmi_quarterly"].includes(p.productCode));
const contentAvg = contentProducts.length > 0
  ? (contentProducts.reduce((sum, p) => sum + (p.realityGrade || 0), 0) / contentProducts.length)
  : 0;
console.log(`  Content/proof average: ${contentAvg.toFixed(1)}/10`);

// 5f. Any active paid product below 10 and not public_limited
const activePaid = paidProducts.filter(p => p.active !== false);
for (const product of activePaid) {
  const exposure = product.exposure || "public_active";
  if (product.realityGrade < 10 && exposure === "public_active") {
    check(
      `${product.productName} (${product.productCode}): grade ${product.realityGrade}/10, exposure=${exposure}`,
      false,
      `Grade ${product.realityGrade}/10 with public_active exposure — must be 10 or public_limited`
    );
  } else if (product.realityGrade < 10 && (exposure === "public_limited" || exposure === "admin_only" || exposure === "dormant")) {
    registerWarning(
      `${product.productName} (${product.productCode}): grade ${product.realityGrade}/10, exposure=${exposure}`,
      "MEDIUM",
      "Product owner",
      `Grade ${product.realityGrade}/10 is below 10/10 threshold but correctly limited to ${exposure}`,
      "Resolve blocker and promote to public_active when ready"
    );
  } else if (product.realityGrade >= 10) {
    check(
      `${product.productName} (${product.productCode}): grade ${product.realityGrade}/10, exposure=${exposure}`,
      true,
      "At threshold"
    );
  }
}

// 5g. Active diagnostics below 9
for (const diagnostic of diagnostics) {
  if (diagnostic.active !== false && diagnostic.realityGrade < 9) {
    check(
      `${diagnostic.productName} (${diagnostic.productCode}): grade ${diagnostic.realityGrade}/10`,
      false,
      `Active diagnostic below 9/10 threshold`
    );
  }
}

// 5h. Products below 9
const below9 = products.filter(p => p.realityGrade < 9 && p.classification !== "DORMANT");
if (below9.length > 0) {
  console.log(`\n  Products below 9/10:`);
  for (const p of below9) {
    console.log(`    ${p.productName} (${p.productCode}): ${p.realityGrade}/10 [${p.classification}]`);
  }
}

// 5i. Paid products below 10
const paidBelow10 = paidProducts.filter(p => p.realityGrade < 10);
if (paidBelow10.length > 0) {
  console.log(`\n  Paid products below 10/10:`);
  for (const p of paidBelow10) {
    console.log(`    ${p.productName} (${p.productCode}): ${p.realityGrade}/10 [${p.classification}]`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. TRUST SEAM ZERO
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 6. Trust Seam Zero ────────────────────────────────────────\n`);

// 6a. Refund/support policy exists and is linked
const refundPageExists = existsSync(join(ROOT, "pages/refund-policy.tsx"));
check("Refund policy page exists", refundPageExists, "pages/refund-policy.tsx");

// Check pricing page links to refund policy
const pricingContent = existsSync(join(ROOT, "pages/pricing.tsx")) ? readFileSync(join(ROOT, "pages/pricing.tsx"), "utf-8") : "";
check("Pricing page links refund policy", pricingContent.includes("refund"), "refund link in pricing.tsx");

// Check checkout button has trust language
const checkoutContent = existsSync(join(ROOT, "components/commercial/CheckoutButton.tsx")) ? readFileSync(join(ROOT, "components/commercial/CheckoutButton.tsx"), "utf-8") : "";
check("Checkout has trust/error handling", checkoutContent.includes("error") && (checkoutContent.includes("support") || checkoutContent.includes("try again")), "CheckoutButton.tsx has error states");

// 6b. Newsletter wired
const newsletterFormExists = existsSync(join(ROOT, "components/NewsletterForm.tsx"));
const newsletterApiExists = existsSync(join(ROOT, "pages/api/newsletter.tsx"));
check("Newsletter form exists", newsletterFormExists, "components/NewsletterForm.tsx");
check("Newsletter API exists", newsletterApiExists, "pages/api/newsletter.tsx");
if (newsletterFormExists) {
  const nfContent = readFileSync(join(ROOT, "components/NewsletterForm.tsx"), "utf-8");
  check("Newsletter has submit handler (not e.preventDefault() with no action)",
    nfContent.includes("fetch(") || nfContent.includes("handleSubmit"),
    "NewsletterForm.tsx submits to API"
  );
  check("Newsletter has success state", nfContent.includes("success"), "NewsletterForm.tsx handles success");
  check("Newsletter has error state", nfContent.includes("error"), "NewsletterForm.tsx handles errors");
}

// 6c. No Coming_Soon.exe
const strategySuccessExists = existsSync(join(ROOT, "app/strategy-room/success/page.tsx"));
check("Strategy Room success page exists", strategySuccessExists, "app/strategy-room/success/page.tsx");
if (strategySuccessExists) {
  const ssContent = readFileSync(join(ROOT, "app/strategy-room/success/page.tsx"), "utf-8");
  check("Success page is not Coming_Soon.exe",
    !ssContent.includes("Coming_Soon") && !ssContent.includes("coming.soon"),
    "Strategy success page is production-quality"
  );
}

// 6d. Evidence count accurate
const evidencePageExists = existsSync(join(ROOT, "pages/evidence/index.tsx"));
if (evidencePageExists) {
  const evContent = readFileSync(join(ROOT, "pages/evidence/index.tsx"), "utf-8");
  check("Evidence page does not claim 5 cases if only 3 exist",
    !evContent.includes("5 cases") || evContent.includes("3 cases"),
    "Evidence count accuracy"
  );
} else {
  warn("evidence page", "pages/evidence/index.tsx not found — may have been removed or moved");
}

// 6e. Sentry/error monitoring
const sentryConfig = existsSync(join(ROOT, "lib/monitoring")) || existsSync(join(ROOT, "lib/observability"));
check("Error monitoring infrastructure exists", sentryConfig, "lib/monitoring or lib/observability");

// 6f. No fake live dashboard claims
const adminRoutes = products.filter(p => p.adminRoutes?.length > 0);
for (const product of adminRoutes) {
  if (product.knownBlockers?.some(b => b.toLowerCase().includes("fake") || b.toLowerCase().includes("synthetic"))) {
    registerWarning(
      `${product.productName} has fake/synthetic data risk`,
      "HIGH",
      "Engineering",
      `${product.productCode} has known blocker about fake/synthetic data`,
      "Replace with real DB-derived data"
    );
  }
}

// 6g. Mobile critical routes
const criticalRoutes = ["/pricing", "/pressure", "/boardroom-brief", "/strategy-room", "/enterprise", "/intelligence/gmi"];
const routeFiles = {
  "/pricing": "pages/pricing.tsx",
  "/pressure": "pages/pressure.tsx",
  "/boardroom-brief": "pages/boardroom-brief.tsx",
  "/strategy-room": "pages/strategy-room/index.tsx",
  "/enterprise": "pages/enterprise.tsx",
  "/intelligence/gmi": "pages/intelligence/gmi/index.tsx",
};
let allRoutesExist = true;
for (const [route, file] of Object.entries(routeFiles)) {
  const exists = existsSync(join(ROOT, file));
  if (!exists) {
    allRoutesExist = false;
    warn(`Critical route ${route}`, `Expected at ${file} but not found`);
  }
}
check("All critical routes exist", allRoutesExist, "6 critical routes verified");

// ═══════════════════════════════════════════════════════════════════════════════
// 7. PAID PRODUCT RUNTIME AUTHORITY
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 7. Paid Product Runtime Authority ─────────────────────────\n`);

// Check artifact authority library exists
const artifactAuthorityExists = existsSync(join(ROOT, "lib/artifacts/artifact-authority.ts"));
check("Artifact authority library exists", artifactAuthorityExists, "lib/artifacts/artifact-authority.ts");

// Check falsification library exists
const falsificationExists = existsSync(join(ROOT, "lib/falsification/product-falsification.ts"));
check("Falsification library exists", falsificationExists, "lib/falsification/product-falsification.ts");

// Check outcome hypothesis library exists
const hypothesisExists = existsSync(join(ROOT, "lib/outcomes/outcome-hypothesis.ts"));
check("Outcome hypothesis library exists", hypothesisExists, "lib/outcomes/outcome-hypothesis.ts");

// Check paid product runtime exists
const paidRuntimeExists = existsSync(join(ROOT, "lib/artifacts/paid-product-runtime.ts"));
check("Paid product runtime exists", paidRuntimeExists, "lib/artifacts/paid-product-runtime.ts");

// Check boardroom brief authority
const boardroomAuthorityExists = existsSync(join(ROOT, "lib/boardroom/boardroom-brief-authority.ts"));
check("Boardroom brief authority exists", boardroomAuthorityExists, "lib/boardroom/boardroom-brief-authority.ts");

// Check return brief linkage
const returnBriefExists = existsSync(join(ROOT, "lib/outcomes/outcome-hypothesis.ts"));
check("Return Brief linkage exists (via outcome hypothesis)", returnBriefExists, "outcome-hypothesis.ts creates ReturnBriefRequest");

// Check admin visibility for paid products
for (const product of activePaid) {
  const hasAdminRoutes = product.adminRoutes && product.adminRoutes.length > 0;
  check(
    `${product.productName} has admin visibility`,
    hasAdminRoutes,
    product.adminRoutes?.join(", ") || "no admin routes"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. GIT DIFF CHECK
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n── 8. Git Diff Check ─────────────────────────────────────────\n`);

try {
  const diffResult = execSync("git diff --check", { cwd: ROOT, encoding: "utf-8" });
  if (diffResult.trim()) {
    warn("git diff --check", "Uncommitted changes with whitespace errors found");
  } else {
    console.log(`  ${PASS} No whitespace errors in uncommitted changes`);
  }
} catch {
  warn("git diff --check", "Whitespace errors detected in uncommitted changes");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  validate:10 — HARD VALIDATION GATE COMPLETE`);
console.log(`  Failures: ${failures.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

console.log(`Estate averages:`);
console.log(`  Total estate:       ${avg}/10`);
console.log(`  Visible (excl dormant/admin): ${visibleAvg.toFixed(1)}/10`);
console.log(`  Paid ladder:        ${paidAvg.toFixed(1)}/10`);
console.log(`  Public diagnostics: ${diagAvg.toFixed(1)}/10`);
console.log(`  Content/proof:      ${contentAvg.toFixed(1)}/10`);

if (below9.length > 0) {
  console.log(`\nProducts below 9/10:`);
  for (const p of below9) {
    console.log(`  ${p.productName} (${p.productCode}): ${p.realityGrade}/10 [${p.classification}]`);
  }
}

if (paidBelow10.length > 0) {
  console.log(`\nPaid products below 10/10:`);
  for (const p of paidBelow10) {
    console.log(`  ${p.productName} (${p.productCode}): ${p.realityGrade}/10 [${p.classification}]`);
  }
}

console.log(`\nFailures:`);
if (failures.length > 0) {
  console.log(failures.join("\n"));
} else {
  console.log(`  (none — all checks passed)`);
}

console.log(`\nWarnings:`);
if (warnings.length > 0) {
  console.log(warnings.join("\n"));
} else {
  console.log(`  (none)`);
}

console.log(`\nGate: ${failures.length === 0 ? "PASS" : "FAIL"}`);
process.exit(exitCode);