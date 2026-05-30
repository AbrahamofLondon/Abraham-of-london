#!/usr/bin/env node
/**
 * scripts/check-public-proof-routes.mjs
 *
 * Conversion Evidence Pass — regression check for public proof routes.
 *
 * Checks that all required public routes exist and that their HTML output
 * does NOT contain internal/reserved vocabulary that should never leak
 * into public-facing content.
 *
 * Required routes to check:
 *   /foundry
 *   /foundry/demo
 *   /foundry/start
 *   /foundry/value
 *   /foundry/decision-test
 *   /foundry/market-signal-test
 *   /foundry/release-risk-test
 *   /verify
 *   /continuity
 *
 * Must FAIL if public HTML contains any of these reserved terms:
 *   ResearchRun, governance event, LIVE_GOVERNED, RESERVED_CONCEPT,
 *   adapter, registry, CI gate
 *
 * Must EXPECT public-safe terms like:
 *   decision, verify, continuity, public preview, full review
 *
 * Conversion-specific checks:
 *   - /foundry/start must contain "Request a full review" and the interest form
 *   - /verify must not claim demo references are verifiable tokens
 *   - /continuity must have continuity CTA wired and link to interest form
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

const REQUIRED_ROUTES = [
  "/foundry",
  "/foundry/demo",
  "/foundry/start",
  "/foundry/value",
  "/foundry/decision-test",
  "/foundry/market-signal-test",
  "/foundry/release-risk-test",
  "/verify",
  "/continuity",
];

const RESERVED_TERMS = [
  "ResearchRun",
  "governance event",
  "LIVE_GOVERNED",
  "RESERVED_CONCEPT",
  "adapter",
  "registry",
  "CI gate",
];

const EXPECTED_PUBLIC_TERMS = [
  "decision",
  "verify",
  "continuity",
  "public preview",
  "full review",
];

// Pages Router files
const PAGES_DIR = path.join(ROOT, "pages");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findPageFile(route) {
  if (route === "/foundry") return path.join(PAGES_DIR, "foundry", "index.tsx");
  if (route === "/verify") return path.join(PAGES_DIR, "verify.tsx");
  if (route === "/continuity") return path.join(PAGES_DIR, "continuity.tsx");
  const name = route.replace("/foundry/", "");
  return path.join(PAGES_DIR, "foundry", `${name}.tsx`);
}

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    if (!filePath.endsWith(".tsx")) {
      const withExt = `${filePath}.tsx`;
      if (fs.existsSync(withExt)) return withExt;
    }
    return null;
  }
  return filePath;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

let exitCode = 0;
const results = [];

console.log("─── Public Proof Routes Check ───\n");

// 1. Check all required routes exist
console.log("Checking required routes exist...");
for (const route of REQUIRED_ROUTES) {
  const filePath = findPageFile(route);
  const resolved = checkFile(filePath);

  if (resolved) {
    console.log(`  ✓ ${route} → ${path.relative(ROOT, resolved)}`);
    results.push({ route, exists: true, file: path.relative(ROOT, resolved) });
  } else {
    console.log(`  ✗ ${route} → MISSING`);
    results.push({ route, exists: false, file: null });
    exitCode = 1;
  }
}

// 2. Check reserved terms are NOT in public pages
console.log("\nChecking reserved terms are absent from public pages...");
for (const route of REQUIRED_ROUTES) {
  const filePath = findPageFile(route);
  const resolved = checkFile(filePath);
  if (!resolved) continue;

  const content = fs.readFileSync(resolved, "utf-8");

  for (const term of RESERVED_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = term.includes(" ")
      ? new RegExp(escaped, "gi")
      : new RegExp(`\\b${escaped}\\b`, "gi");

    const matches = content.match(regex);
    if (matches) {
      console.log(`  ✗ ${route} contains reserved term "${term}" (${matches.length} occurrence(s))`);
      results.push({ route, issue: `contains reserved term: ${term}`, severity: "FAIL" });
      exitCode = 1;
    }
  }
}

// 3. Check expected public terms are present
console.log("\nChecking expected public terms are present...");
for (const route of REQUIRED_ROUTES) {
  const filePath = findPageFile(route);
  const resolved = checkFile(filePath);
  if (!resolved) continue;

  const content = fs.readFileSync(resolved, "utf-8");

  for (const term of EXPECTED_PUBLIC_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = term.includes(" ")
      ? new RegExp(escaped, "gi")
      : new RegExp(`\\b${escaped}\\b`, "gi");

    const matches = content.match(regex);
    if (!matches) {
      console.log(`  ⚠ ${route} missing expected term "${term}"`);
      results.push({ route, issue: `missing expected term: ${term}`, severity: "WARN" });
    }
  }
}

// 4. Conversion-specific checks
console.log("\nChecking conversion-specific requirements...");

// 4a. /foundry/start must contain "Request a full review" and the interest form
const startPath = checkFile(findPageFile("/foundry/start"));
if (startPath) {
  const startContent = fs.readFileSync(startPath, "utf-8");

  if (!startContent.includes("Request a full review")) {
    console.log('  ✗ /foundry/start missing "Request a full review"');
    results.push({ route: "/foundry/start", issue: "missing 'Request a full review' heading", severity: "FAIL" });
    exitCode = 1;
  } else {
    console.log('  ✓ /foundry/start contains "Request a full review"');
  }

  if (!startContent.includes("Submit review interest")) {
    console.log('  ✗ /foundry/start missing interest capture form submit button');
    results.push({ route: "/foundry/start", issue: "missing interest capture form submit button", severity: "FAIL" });
    exitCode = 1;
  } else {
    console.log('  ✓ /foundry/start has interest capture form with "Submit review interest"');
  }
}

// 4b. /verify must not claim demo references are verifiable tokens
const verifyPath = checkFile(findPageFile("/verify"));
if (verifyPath) {
  const verifyContent = fs.readFileSync(verifyPath, "utf-8");
  const honestyMarkers = [
    /not cryptographically signed/i,
    /cannot be verified/i,
    /not verifiable/i,
  ];
  const hasHonesty = honestyMarkers.some(p => p.test(verifyContent));
  if (!hasHonesty) {
    console.log("  ✗ /verify may overpromise — no honesty markers found");
    results.push({ route: "/verify", issue: "missing honesty markers about demo references", severity: "FAIL" });
    exitCode = 1;
  } else {
    console.log("  ✓ /verify honestly distinguishes demo references from verifiable tokens");
  }
}

// 4c. /continuity must have continuity CTA wired and link to interest form
const continuityPath = checkFile(findPageFile("/continuity"));
if (continuityPath) {
  const continuityContent = fs.readFileSync(continuityPath, "utf-8");

  if (!continuityContent.includes("foundry_continuity_click")) {
    console.log("  ✗ /continuity missing continuity CTA analytics wiring");
    results.push({ route: "/continuity", issue: "missing foundry_continuity_click analytics", severity: "FAIL" });
    exitCode = 1;
  } else {
    console.log("  ✓ /continuity has continuity CTA wired");
  }

  if (!continuityContent.includes("/foundry/start#contact")) {
    console.log("  ✗ /continuity missing link to interest capture form");
    results.push({ route: "/continuity", issue: "missing link to /foundry/start#contact", severity: "FAIL" });
    exitCode = 1;
  } else {
    console.log("  ✓ /continuity links to interest capture form");
  }
}

// 5. Summary
console.log("\n─── Summary ───");
const failures = results.filter(r => r.severity === "FAIL").length;
const warnings = results.filter(r => r.severity === "WARN").length;
const missing = results.filter(r => r.exists === false).length;

if (missing > 0) console.log(`  Missing routes: ${missing}`);
if (failures > 0) console.log(`  Reserved term violations: ${failures}`);
if (warnings > 0) console.log(`  Missing expected terms (warnings): ${warnings}`);

if (exitCode === 0) {
  console.log("\n  ✓ All public proof route checks passed.");
} else {
  console.log(`\n  ✗ ${failures + missing} failure(s) found.`);
}

process.exit(exitCode);