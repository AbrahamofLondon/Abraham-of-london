#!/usr/bin/env node
/**
 * retainer-claim-guard.mjs — CI-safe guard for premature retainer claims.
 *
 * Scans source files for language that would imply general 50k readiness,
 * always-on governance, or fully automated retained oversight before
 * those claims are defensible.
 *
 * Whitelist: files under docs/product/ (audit documents may reference
 * these terms in analysis context).
 */

import { readFileSync } from "fs";
import { globSync } from "glob";

const PATTERNS = [
  { pattern: /£50k ready/gi, label: "Premature claim: £50k ready" },
  { pattern: /50k ready/gi, label: "Premature claim: 50k ready" },
  { pattern: /always-on governance/gi, label: "Premature claim: always-on governance" },
  { pattern: /continuous monitoring/gi, label: "Premature claim: continuous monitoring" },
  { pattern: /automated oversight is active/gi, label: "Premature claim: automated oversight is active" },
  { pattern: /fully automated retained oversight/gi, label: "Premature claim: fully automated retained oversight" },
  { pattern: /enterprise-ready £50k/gi, label: "Premature claim: enterprise-ready £50k" },
  { pattern: /guaranteed governance/gi, label: "Premature claim: guaranteed governance" },
];

const WHITELIST_PREFIXES = [
  "docs/product/",
  "docs\\product\\",
  "lib/diagnostics/",
  "lib\\diagnostics\\",
];

/** Lines containing these phrases are negations/disclaimers, not claims. */
const NEGATION_PHRASES = [
  "not continuous monitoring",
  "no continuous monitoring",
  "not claimed",
  "what is not claimed",
  "unless actual verified outcome exists",
];

function isWhitelisted(file) {
  return WHITELIST_PREFIXES.some((prefix) => file.startsWith(prefix));
}

const files = globSync("{pages,components,app,lib,scripts}/**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**"],
});

let violations = 0;

for (const file of files) {
  if (isWhitelisted(file)) continue;

  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (const rule of PATTERNS) {
    // Reset regex state
    rule.pattern.lastIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lines[i])) {
        const lower = lines[i].toLowerCase();
        const isNegation = NEGATION_PHRASES.some((np) => lower.includes(np));
        if (isNegation) continue;
        violations++;
        console.error(`[FAIL] ${file}:${i + 1}: ${rule.label}`);
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} retainer claim violation(s) found.`);
  process.exit(1);
} else {
  console.log(`[RETAINER_CLAIM_GUARD] ${files.length} files scanned. No violations.`);
}
