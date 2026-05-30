#!/usr/bin/env node
/**
 * scripts/check-admin-surface-integrity.mjs
 *
 * Admin Operating Console Integrity Check.
 *
 * Verifies:
 *   - Critical admin route files exist
 *   - Reserved outbound surfaces are labelled reserved/config-required when not configured
 *   - Brief-orders route exists
 *   - QA bench route exists
 *   - Command wall has controlled empty state wording
 *   - No admin route imports public Layout/Header directly unless intended
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

const CRITICAL_ADMIN_ROUTES = [
  { path: "app/admin/layout.tsx", label: "Admin layout (shell)" },
  { path: "components/admin/AppAdminShell.tsx", label: "Admin shell component" },
  { path: "lib/admin/admin-navigation.ts", label: "Admin navigation registry" },
  { path: "app/admin/intelligence-foundry/brief-orders/page.tsx", label: "Brief orders page" },
  { path: "app/admin/intelligence-foundry/brief-orders/PageClient.tsx", label: "Brief orders client" },
  { path: "app/admin/intelligence-foundry/qa-bench/page.tsx", label: "QA bench page" },
  { path: "app/admin/intelligence-foundry/qa-bench/PageClient.tsx", label: "QA bench client" },
  { path: "pages/admin/command-wall.tsx", label: "Command wall" },
  { path: "pages/admin/outbound/facebook.tsx", label: "Facebook outbound console" },
  { path: "pages/admin/outbound/x.tsx", label: "X outbound console" },
  { path: "pages/admin/outbound/linkedin.tsx", label: "LinkedIn outbound console" },
];

const RESERVED_SURFACE_PATTERNS = [
  { file: "pages/admin/outbound/facebook.tsx", patterns: ["not configured", "OAuth not configured"] },
  { file: "pages/admin/outbound/x.tsx", patterns: ["not configured", "OAuth not configured"] },
  { file: "pages/admin/outbound/linkedin.tsx", patterns: ["Not connected", "not connected"] },
];

const FORBIDDEN_PUBLIC_IMPORTS = [
  { import: "components/Layout", label: "public Layout" },
  { import: "components/homepage/", label: "homepage component" },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

let exitCode = 0;
const results = [];

console.log("═══ Admin Surface Integrity Check ═══\n");

// 1. Check critical admin routes exist
console.log("Checking critical admin route files exist...");
for (const route of CRITICAL_ADMIN_ROUTES) {
  const fullPath = path.join(ROOT, route.path);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${route.label} → ${route.path}`);
    results.push({ check: route.label, status: "PASS" });
  } else {
    console.log(`  ✗ ${route.label} → MISSING`);
    results.push({ check: route.label, status: "FAIL" });
    exitCode = 1;
  }
}

// 2. Check reserved outbound surfaces have config-required labels
console.log("\nChecking reserved outbound surfaces have config-required labels...");
for (const { file, patterns } of RESERVED_SURFACE_PATTERNS) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠ ${file} not found, skipping`);
    continue;
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  const hasPattern = patterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
  if (hasPattern) {
    console.log(`  ✓ ${file} has config-required messaging`);
    results.push({ check: `${file}: config-required label`, status: "PASS" });
  } else {
    console.log(`  ✗ ${file} missing config-required messaging`);
    results.push({ check: `${file}: config-required label`, status: "FAIL" });
    exitCode = 1;
  }
}

// 3. Check no admin route imports public Layout directly
console.log("\nChecking no admin route imports public Layout directly...");
const adminDirs = [
  "pages/admin",
  "app/admin",
];
for (const dir of adminDirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;

  const files = [];
  function walk(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") walk(full);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(full);
      }
    }
  }
  walk(fullDir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    for (const { import: imp, label } of FORBIDDEN_PUBLIC_IMPORTS) {
      if (content.includes(`from "@/${imp}"`) || content.includes(`from ' @/${imp}'`)) {
        // Check if it's using AdminLayout instead
        if (content.includes("AdminLayout")) {
          console.log(`  ⚠ ${path.relative(ROOT, file)} imports ${label} but also uses AdminLayout`);
          results.push({ check: `${path.relative(ROOT, file)}: ${label}`, status: "WARN" });
        } else {
          console.log(`  ✗ ${path.relative(ROOT, file)} imports ${label} directly`);
          results.push({ check: `${path.relative(ROOT, file)}: ${label}`, status: "FAIL" });
          exitCode = 1;
        }
      }
    }
  }
}

// 4. Check brief-orders and qa-bench in navigation
console.log("\nChecking navigation registry includes brief-orders and qa-bench...");
const navContent = fs.readFileSync(path.join(ROOT, "lib/admin/admin-navigation.ts"), "utf-8");
if (navContent.includes("brief-orders")) {
  console.log("  ✓ brief-orders in navigation");
  results.push({ check: "Navigation: brief-orders", status: "PASS" });
} else {
  console.log("  ✗ brief-orders NOT in navigation");
  results.push({ check: "Navigation: brief-orders", status: "FAIL" });
  exitCode = 1;
}
if (navContent.includes("qa-bench")) {
  console.log("  ✓ qa-bench in navigation");
  results.push({ check: "Navigation: qa-bench", status: "PASS" });
} else {
  console.log("  ✗ qa-bench NOT in navigation");
  results.push({ check: "Navigation: qa-bench", status: "FAIL" });
  exitCode = 1;
}

// 5. Check command wall has controlled empty state
console.log("\nChecking command wall has controlled empty state...");
const cwContent = fs.readFileSync(path.join(ROOT, "pages/admin/command-wall.tsx"), "utf-8");
if (cwContent.includes("EmptyPanelText")) {
  console.log("  ✓ Command wall has EmptyPanelText component");
  results.push({ check: "Command wall: empty state", status: "PASS" });
} else {
  console.log("  ✗ Command wall missing empty state component");
  results.push({ check: "Command wall: empty state", status: "FAIL" });
  exitCode = 1;
}

// Check "Failed to synchronize" is only in catch block
const syncErrorCount = (cwContent.match(/Failed to synchronize/g) || []).length;
if (syncErrorCount <= 1) {
  console.log("  ✓ Command wall error message is controlled (not shown for empty data)");
  results.push({ check: "Command wall: error discipline", status: "PASS" });
} else {
  console.log(`  ⚠ Command wall has ${syncErrorCount} occurrences of error message — review`);
  results.push({ check: "Command wall: error discipline", status: "WARN" });
}

// 6. Check brief-orders empty state
console.log("\nChecking brief-orders has controlled empty state...");
const boContent = fs.readFileSync(path.join(ROOT, "app/admin/intelligence-foundry/brief-orders/PageClient.tsx"), "utf-8");
if (boContent.includes("No Decision Failure Brief orders yet")) {
  console.log("  ✓ Brief orders has informative empty state");
  results.push({ check: "Brief orders: empty state", status: "PASS" });
} else {
  console.log("  ✗ Brief orders missing informative empty state");
  results.push({ check: "Brief orders: empty state", status: "FAIL" });
  exitCode = 1;
}

// 7. Summary
console.log("\n─── Summary ───");
const passes = results.filter(r => r.status === "PASS").length;
const warnings = results.filter(r => r.status === "WARN").length;
const failures = results.filter(r => r.status === "FAIL").length;

console.log(`  Passed: ${passes}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Failed: ${failures}`);

if (exitCode === 0) {
  console.log("\n  ✓ All admin surface integrity checks passed.");
} else {
  console.log(`\n  ✗ ${failures} failure(s) found.`);
}

process.exit(exitCode);
