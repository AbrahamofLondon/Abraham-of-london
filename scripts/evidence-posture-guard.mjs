#!/usr/bin/env node
/**
 * evidence-posture-guard.mjs — CI-safe guard for evidence posture integrity.
 *
 * Ensures "VERIFIED" confidence labels are only used with OUTCOME_VERIFIED
 * or OPERATOR_REVIEWED postures, never for self-reported or system-inferred data.
 *
 * Also checks that VERIFIED_CASE_EVIDENCE classification is not used
 * (replaced by SOURCE_LABELLED_EVIDENCE).
 */

import { readFileSync } from "fs";
import { globSync } from "glob";

const files = globSync("{lib,components,pages,app}/**/*.{ts,tsx}");
let violations = 0;

const RULES = [
  {
    pattern: /VERIFIED_CASE_EVIDENCE/g,
    label: "VERIFIED_CASE_EVIDENCE classification (must use SOURCE_LABELLED_EVIDENCE)",
  },
  {
    // Catches confidenceLabel: "VERIFIED" when paired with SYSTEM_MEASURED, SYSTEM_INFERRED, USER_REPORTED
    pattern: /confidenceLabel:\s*["']VERIFIED["']/g,
    label: 'confidenceLabel "VERIFIED" — must be "MEASURED", "REVIEWED", or used only with OUTCOME_VERIFIED posture',
    // Allow in outcome-verification-contract.ts where VERIFIED is a legitimate posture
    exclude: ["outcome-verification-contract.ts", "contradiction-graph-presenter.ts"],
  },
];

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  for (const rule of RULES) {
    if (rule.exclude && rule.exclude.some((ex) => file.includes(ex))) continue;
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
  console.error(`\n❌ ${violations} evidence posture violation(s) found.`);
  process.exit(1);
} else {
  console.log(`✅ [EVIDENCE_POSTURE_GUARD] ${files.length} files scanned. No violations.`);
}
