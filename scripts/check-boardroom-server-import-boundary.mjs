/**
 * scripts/check-boardroom-server-import-boundary.mjs
 *
 * Guard script to ensure Pages Router Boardroom pages do not import
 * server-only Boardroom delivery modules transitively.
 *
 * Checks:
 *   1. pages/admin/boardroom/** /*.tsx files must not import from:
 *      - boardroom-delivery-state-machine (the server wrapper)
 *      - boardroom-delivery-events.server
 *      - governance-event-bus
 *   2. lib/boardroom/boardroom-delivery-state-machine.shared.ts must not import:
 *      - server-only
 *      - prisma
 *      - governance-event-bus
 *      - auditLogger
 *      - email services
 *
 * Usage:
 *   node scripts/check-boardroom-server-import-boundary.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

/** Imports that are FORBIDDEN in Boardroom Pages Router files */
const FORBIDDEN_IN_BOARDROOM_PAGES = [
  /boardroom-delivery-state-machine(?<!\.shared)/,  // NOT .shared
  /boardroom-delivery-events\.server/,
  /governance-event-bus/,
];

/** Imports that are FORBIDDEN in the shared module */
const FORBIDDEN_IN_SHARED = [
  /server-only/,
  /prisma/,
  /governance-event-bus/,
  /auditLogger/,
  /email/,
  /boardroom-delivery-events\.server/,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findImportPaths(content, patterns) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match both static and dynamic imports
    const match = line.match(
      /(?:import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|require\(["']([^"']+)["']\))/,
    );
    if (match) {
      const importPath = match[1] || match[2];
      if (importPath) {
        for (const pattern of patterns) {
          if (pattern.test(importPath)) {
            imports.push({ line: i + 1, text: line.trim(), importPath, pattern: pattern.toString() });
          }
        }
      }
    }
  }
  return imports;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let allPassed = true;
const violations = [];

console.log("\n═══ BOARDROOM SERVER IMPORT BOUNDARY CHECK ═══\n");

// ── Check 1: Boardroom Pages Router .tsx files ────────────────────────────────

console.log("── 1. Checking Boardroom Pages Router files for server-only imports ──\n");

const boardroomPagesDir = path.join(ROOT, "pages", "admin", "boardroom");

function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      results.push(fullPath);
    }
  }
  return results;
}

const boardroomFiles = collectFiles(boardroomPagesDir);
console.log(`   Found ${boardroomFiles.length} Boardroom page files`);

for (const file of boardroomFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const imports = findImportPaths(content, FORBIDDEN_IN_BOARDROOM_PAGES);

  if (imports.length > 0) {
    const relativePath = path.relative(ROOT, file).replace(/\\/g, "/");
    for (const imp of imports) {
      violations.push({
        file: relativePath,
        line: imp.line,
        text: imp.text,
        importPath: imp.importPath,
        pattern: imp.pattern,
      });
      allPassed = false;
    }
  }
}

if (violations.length === 0) {
  console.log("   ✓ No Boardroom pages import server-only modules\n");
} else {
  console.log(`   ✗ Found ${violations.length} violations:\n`);
  for (const v of violations) {
    console.log(`     ${v.file}:${v.line}`);
    console.log(`       Import: ${v.text}`);
    console.log(`       Matched pattern: ${v.pattern}\n`);
  }
}

// ── Check 2: Shared module purity ─────────────────────────────────────────────

console.log("── 2. Checking shared module purity ──\n");

const sharedModulePath = path.join(ROOT, "lib", "boardroom", "boardroom-delivery-state-machine.shared.ts");

if (fs.existsSync(sharedModulePath)) {
  const content = fs.readFileSync(sharedModulePath, "utf-8");
  const imports = findImportPaths(content, FORBIDDEN_IN_SHARED);

  if (imports.length > 0) {
    const relativePath = path.relative(ROOT, sharedModulePath).replace(/\\/g, "/");
    console.log(`   ✗ Shared module has forbidden imports:\n`);
    for (const imp of imports) {
      console.log(`     ${relativePath}:${imp.line}`);
      console.log(`       Import: ${imp.text}`);
      console.log(`       Matched pattern: ${imp.pattern}\n`);
      allPassed = false;
    }
  } else {
    console.log("   ✓ Shared module is pure (no server-only imports)\n");
  }
} else {
  console.log("   ⚠ Shared module not found — skipping check\n");
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("═══ RESULT ═══\n");
console.log(`   Gate: ${allPassed ? "PASSED" : "FAILED"}\n`);

if (!allPassed) {
  console.log("   Failures:");
  for (const v of violations) {
    console.log(`     • ${v.file}:${v.line} — imports ${v.importPath}`);
  }
  console.log("");
}

process.exitCode = allPassed ? 0 : 1;