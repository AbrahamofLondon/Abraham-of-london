#!/usr/bin/env node
/**
 * earned-progression-guard.mjs — CI-safe guard for earned progression language.
 *
 * Scans user-facing components for SaaS paywall language that contradicts
 * the earned-progression model.
 */

import { readFileSync } from "fs";
import { globSync } from "glob";

const PATTERNS = [
  { pattern: /Unlock premium/gi, label: "SaaS paywall: Unlock premium" },
  { pattern: /Unlock Access/g, label: "SaaS paywall: Unlock Access" },
  { pattern: /Upgrade Now/g, label: "SaaS paywall: Upgrade Now" },
  { pattern: /unlock premium resources/gi, label: "SaaS paywall: unlock premium resources" },
  { pattern: /exclusive insights/gi, label: "SaaS: exclusive insights" },
  { pattern: /Subscribe to unlock/gi, label: "SaaS: Subscribe to unlock" },
];

const files = globSync("{pages,components,app}/**/*.tsx");
let violations = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  for (const rule of PATTERNS) {
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
  console.error(`\n❌ ${violations} earned-progression violation(s) found.`);
  process.exit(1);
} else {
  console.log(`✅ [EARNED_PROGRESSION_GUARD] ${files.length} files scanned. No violations.`);
}
