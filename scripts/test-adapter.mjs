#!/usr/bin/env node
/**
 * scripts/test-adapter.mjs
 *
 * Single command to run all tests for a specific adapter.
 * Usage: node scripts/test-adapter.mjs <adapter-id>
 *
 * Example: node scripts/test-adapter.mjs executive-reporting
 *          node scripts/test-adapter.mjs boardroom-dossier
 *
 * Lists available adapters if no argument provided.
 */

import { execSync } from "child_process";

// Map adapter IDs to test file patterns
const TEST_MAP = {
  "executive-reporting": "tests/research/engines/executive-reporting-adapter.test.ts",
  "boardroom-dossier": "tests/research/engines/boardroom-mode-adapter.test.ts",
  "executive-report-boardroom-bridge": [
    "tests/research/engines/executive-report-boardroom-bridge-adapter.test.ts",
    "tests/research/bridges/executive-report-to-intelligence-spine.test.ts",
  ],
  "strategy-room": "tests/research/engines/strategy-room-adapter.test.ts",
  "fast-diagnostic": "tests/research/engines/fast-diagnostic-adapter.test.ts",
  "constitutional-diagnostic": "tests/research/engines/constitutional-diagnostic-adapter.test.ts",
  "pattern-recurrence": "tests/research/engines/pattern-recurrence-adapter.test.ts",
  "cost-of-delay": "tests/research/engines/cost-of-delay-engine.test.ts",
};

const adapterId = process.argv[2];

if (!adapterId) {
  console.log("\n📋 Available adapters:");
  for (const [id, pattern] of Object.entries(TEST_MAP)) {
    const patterns = Array.isArray(pattern) ? pattern.join(", ") : pattern;
    console.log(`  ${id}`);
  }
  console.log("\nUsage: node scripts/test-adapter.mjs <adapter-id>\n");
  process.exit(0);
}

const testPatterns = TEST_MAP[adapterId];
if (!testPatterns) {
  console.error(`\n❌ Unknown adapter: "${adapterId}". Run without arguments to see available adapters.\n`);
  process.exit(1);
}

const patterns = Array.isArray(testPatterns) ? testPatterns.join(" ") : testPatterns;

console.log(`\n🧪 Running tests for adapter: ${adapterId}\n`);

try {
  execSync(`pnpm vitest run ${patterns} 2>&1`, {
    cwd: process.cwd(),
    encoding: "utf-8",
    stdio: "inherit",
  });
} catch (err) {
  process.exit(1);
}