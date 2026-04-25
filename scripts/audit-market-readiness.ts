/**
 * Market Readiness Audit — master gate before any outreach.
 *
 * Run: npx tsx scripts/audit-market-readiness.ts
 *
 * This must pass before the product can be reintroduced to senior contacts.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function readFile(relPath: string): string {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
}

function run(cmd: string): { stdout: string; success: boolean } {
  try {
    const stdout = execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 180000, stdio: ["pipe", "pipe", "pipe"] });
    return { stdout, success: true };
  } catch (e: any) {
    return { stdout: e.stdout || e.message || "", success: false };
  }
}

console.log("\n============================================");
console.log("  MARKET READINESS AUDIT");
console.log("  No outreach until this passes.");
console.log("============================================\n");

// ── 1. TypeScript ──────────────────────────────────────────────────────────
console.log("─── TYPESCRIPT ───\n");

const tsc = run("npx tsc --noEmit --pretty false");
const tsErrors = (tsc.stdout.match(/error TS/g) || []).length;
check("TypeScript: 0 errors", tsErrors === 0, tsErrors > 0 ? `${tsErrors} errors` : undefined);

const nextConfig = readFile("next.config.mjs");
check("next.config: ignoreBuildErrors is false", nextConfig.includes("ignoreBuildErrors: false"));

// ── 2. No SQLite in production paths ───────────────────────────────────────
console.log("\n─── DATABASE INTEGRITY ───\n");

const schema = readFile("prisma/schema.prisma");
check("Prisma provider: postgresql", schema.includes('provider = "postgresql"'));

const clientConfig = readFile("prisma/client.config.ts");
check("prisma/client.config: no sqlite", !clientConfig.includes("sqlite"));

const envFile = readFile("lib/env.ts");
check("lib/env.ts: no file:./dev.db", !envFile.includes("file:./dev.db"));

// ── 3. Product catalog integrity ───────────────────────────────────────────
console.log("\n─── CATALOG INTEGRITY ───\n");

const catalog = readFile("lib/commercial/catalog.ts");
check("catalog: assertActiveProductsHavePriceIds exists", catalog.includes("assertActiveProductsHavePriceIds"));
check("catalog: assertNoDuplicateProductCodes exists", catalog.includes("assertNoDuplicateProductCodes"));

// Check no active product with amount > 0 has null stripePriceId
const activeNullPrice = /active:\s*true[\s\S]{0,200}stripePriceId:\s*null/;
check("catalog: all active paid products have Stripe IDs", !activeNullPrice.test(catalog));

// ── 4. Checkout code integrity ─────────────────────────────────────────────
console.log("\n─── CHECKOUT INTEGRITY ───\n");

const checkout = readFile("pages/api/billing/checkout.ts");
check("checkout: uses resolveProductIdentity", checkout.includes("resolveProductIdentity"));
check("checkout: rejects invalid codes", checkout.includes("Invalid product identifier"));

// ── 5. Executive Reporting ─────────────────────────────────────────────────
console.log("\n─── EXECUTIVE REPORTING ───\n");

const erPage = readFile("pages/diagnostics/executive-reporting.tsx");
check("ER page exists", erPage.length > 100);
const erRun = readFile("pages/diagnostics/executive-reporting/run.tsx");
check("ER run page exists", erRun.length > 100);

// ── 6. Session handoff ─────────────────────────────────────────────────────
console.log("\n─── SESSION HANDOFF ───\n");

const spinePersist = readFile("lib/decision/spine-persistence.ts");
check("spine-persistence: saveSpineToSession exists", spinePersist.includes("saveSpineToSession"));
check("spine-persistence: loadSpineFromSession exists", spinePersist.includes("loadSpineFromSession"));
check("spine-persistence: persistSpineToDB exists", spinePersist.includes("persistSpineToDB"));
check("spine-persistence: loadSpineFromDB exists", spinePersist.includes("loadSpineFromDB"));

const spineApiPersist = readFile("pages/api/diagnostics/spine/persist.ts");
check("spine API persist endpoint exists", spineApiPersist.length > 50);
const spineApiLoad = readFile("pages/api/diagnostics/spine/load.ts");
check("spine API load endpoint exists", spineApiLoad.length > 50);

// ── 7. Scoring authority ───────────────────────────────────────────────────
console.log("\n─── SCORING AUTHORITY ───\n");

const synthesisEngine = readFile("lib/decision/synthesis-engine.ts");
check("synthesis: uses scoreC3", synthesisEngine.includes("scoreC3"));
check("synthesis: uses arbiter tournament", synthesisEngine.includes("runArbiterTournament"));
check("synthesis: prompt injection sanitisation", synthesisEngine.includes("sanitiseForPrompt"));

// ── 8. Formidable core + boundaries ────────────────────────────────────────
console.log("\n─── SUB-AUDITS ───\n");

const formidable = run("npx tsx scripts/audit-formidable-core.ts");
const formidablePass = formidable.stdout.includes("0 weak");
check("Formidable core audit: 0 weak", formidablePass);

const boundaries = run("npx tsx scripts/audit-product-line-boundaries.ts");
const boundariesPass = boundaries.stdout.includes("0 failed");
check("Product-line boundaries: 0 failed", boundariesPass);

const copyIntegrity = run("npx tsx scripts/audit-product-copy-integrity.ts");
const copyPass = copyIntegrity.stdout.includes("0 failed");
check("Copy integrity: 0 failed", copyPass);

// ── 9. No fake readiness claims ────────────────────────────────────────────
console.log("\n─── TRUTH CHECK ───\n");

const fakeClaimsPatterns = [
  { pattern: /market.?ready/i, label: "market ready" },
  { pattern: /production.?grade/i, label: "production grade" },
  { pattern: /fully.?wired/i, label: "fully wired" },
  { pattern: /self.?improving/i, label: "self-improving" },
  { pattern: /all.?surfaces.?working/i, label: "all surfaces working" },
];

const publicPages = [
  "pages/index.tsx",
  "pages/diagnostics/index.tsx",
  "pages/diagnostics/fast.tsx",
  "pages/diagnostics/executive-reporting.tsx",
];

for (const { pattern, label } of fakeClaimsPatterns) {
  const found = publicPages.some((p) => pattern.test(readFile(p)));
  check(`No "${label}" claim on public pages`, !found);
}

// ── RESULTS ────────────────────────────────────────────────────────────────
console.log("\n============================================");
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log("============================================\n");

if (failed > 0) {
  console.log("BLOCKED. Fix failures before any outreach.\n");
  process.exit(1);
} else {
  console.log("CLEARED FOR MARKET RE-ENTRY.\n");
}
