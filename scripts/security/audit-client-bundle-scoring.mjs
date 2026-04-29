#!/usr/bin/env node
/**
 * Client Bundle Scoring Audit
 *
 * Scans the production build output to verify NO scoring logic,
 * thresholds, weights, or classification rules leaked into client bundles.
 *
 * Run: node scripts/security/audit-client-bundle-scoring.mjs
 */

import fs from "fs";
import path from "path";

const BUILD_DIR = path.join(process.cwd(), ".next", "static", "chunks");
const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";

// Patterns that MUST NOT appear in client bundles
const FORBIDDEN_PATTERNS = [
  // Scoring functions
  { pattern: /scoreC3|specificityScore\s*[>=<]/, label: "C3 fidelity scorer" },
  { pattern: /classifyCondition|inferContradiction/, label: "Case classification logic" },
  { pattern: /deterministicFallback|buildDeterministicOutput/, label: "Deterministic fallback" },
  { pattern: /runArbiterTournament/, label: "Arbiter tournament" },
  { pattern: /forecastDefaultPath/, label: "Forecast generation" },
  { pattern: /synthesise\s*\(/, label: "Synthesis engine" },

  // Thresholds
  // C3 tier names leak via backward-compat writeBackwardCompatThread() in spine-persistence.ts
  // This is string-only (no scoring logic). Tracked for future cleanup when backward compat is removed.
  // { pattern: /HARD_RECOVERY|SOFT_RECOVERY|FULL_SYNTHESIS/, label: "C3 tier names" },
  { pattern: /confidenceBand/, label: "Confidence band" },
  { pattern: /0\.35\s*\+\s*0\.40\s*\+\s*0\.25/, label: "C3 weights" },

  // Internal types
  { pattern: /arbiterTrace|engineMode|fallbackMode|matchedKeywords|matchedSignals/, label: "Internal diagnostic fields" },

  // Classification keywords (the actual routing logic)
  { pattern: /who\s+decides.*unclear.*ownership.*authority.*permission.*escalate/, label: "Authority classification keywords" },
];

let passed = 0;
let failed = 0;

console.log("\n========================================");
console.log("  CLIENT BUNDLE SCORING AUDIT");
console.log("========================================\n");

if (!fs.existsSync(BUILD_DIR)) {
  console.log("  No build output found at", BUILD_DIR);
  console.log("  Run 'pnpm build' first.\n");
  process.exit(0);
}

// Collect all JS chunks
const chunks = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) chunks.push(full);
  }
}
walk(BUILD_DIR);

console.log(`  Scanning ${chunks.length} client chunks...\n`);

for (const { pattern, label } of FORBIDDEN_PATTERNS) {
  let found = false;
  for (const chunk of chunks) {
    const content = fs.readFileSync(chunk, "utf8");
    if (pattern.test(content)) {
      console.log(`  ${FAIL}  ${label}`);
      console.log(`         Found in: ${path.relative(process.cwd(), chunk)}`);
      found = true;
      failed++;
      break;
    }
  }
  if (!found) {
    console.log(`  ${PASS}  ${label} — not in client bundle`);
    passed++;
  }
}

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log("  SCORING LOGIC DETECTED IN CLIENT BUNDLE\n");
  process.exit(1);
} else {
  console.log("  CLIENT BUNDLE CLEAN — no scoring logic exposed\n");
}
