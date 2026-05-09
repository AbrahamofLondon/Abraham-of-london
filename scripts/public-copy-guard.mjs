#!/usr/bin/env node
/**
 * public-copy-guard.mjs — CI-safe regression guard for public messaging integrity.
 *
 * Scans pages/ and components/ for forbidden phrases that must never appear
 * in user-facing public surfaces. Exits non-zero if violations found.
 */

import { readFileSync } from "fs";
import { globSync } from "glob";

const FORBIDDEN = [
  { pattern: /AI-accelerated market baseline/gi, label: "AI-accelerated market baseline" },
  { pattern: /proprietary algorithm/gi, label: "proprietary algorithm" },
  { pattern: /kernel graph/gi, label: "kernel graph" },
  { pattern: /graph mechanics/gi, label: "graph mechanics" },
  { pattern: /arbiter rules/gi, label: "arbiter rules" },
  { pattern: /scoring formula/gi, label: "scoring formula" },
  { pattern: /machine learning/gi, label: "machine learning" },
  { pattern: /neural network/gi, label: "neural network" },
  { pattern: /deep learning/gi, label: "deep learning" },
  { pattern: /Upgrade Now/g, label: "Upgrade Now (SaaS language)" },
  { pattern: /href="\/consulting(?:\/|")/g, label: "href to /consulting (stale route)" },
  { pattern: /book a call/gi, label: "book a call" },
];

const files = globSync("{pages,components,app}/**/*.tsx");
let violations = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  for (const rule of FORBIDDEN) {
    const matches = content.match(rule.pattern);
    if (matches) {
      for (const m of matches) {
        violations++;
        console.error(`[FAIL] ${file}: "${m}" — ${rule.label}`);
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ ${violations} public copy violation(s) found.`);
  process.exit(1);
} else {
  console.log(`✅ [PUBLIC_COPY_GUARD] ${files.length} files scanned. No violations.`);
}
