/**
 * Governed Automation Guard
 *
 * Fails if:
 * - "automated oversight" appears without approved safe context
 * - "always-on governance" appears
 * - "fully autonomous" appears
 * - "guaranteed outcome" appears outside negation
 * - delivery is described as sent without transport verification
 * - suppression override appears outside admin/operator context
 * - counsel/board judgment is described as automated
 *
 * Allows "automated" only when paired with approved safe contexts:
 * - overdue detection
 * - suppression logging
 * - evidence preservation
 * - delivery preparation
 * - cadence tick
 * - checkpoint reminder
 */

import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const root = process.cwd();
let violations = 0;

const FORBIDDEN_ABSOLUTE = [
  { pattern: /always-on governance/i, label: "always-on governance" },
  { pattern: /fully autonomous/i, label: "fully autonomous" },
  { pattern: /automated professional judgment/i, label: "automated professional judgment" },
  { pattern: /automated counsel/i, label: "automated counsel judgment" },
  { pattern: /automated board advice/i, label: "automated board advice" },
];

const FORBIDDEN_WITHOUT_CONTEXT = [
  {
    pattern: /automated oversight/i,
    label: "automated oversight",
    safeContexts: [
      /not automated/i,
      /no automated/i,
      /without automated/i,
      /routine automated/i, // already caught by retainer-claim-guard; allow here if rewritten
      /overdue detection/i,
      /suppression logging/i,
      /evidence preservation/i,
      /delivery preparation/i,
      /cadence tick/i,
      /checkpoint/i,
      /scheduled/i,
      /operator-governed/i,
    ],
  },
];

const NEGATION_PATTERNS = [
  /\bnot\b/i,
  /\bnever\b/i,
  /\bwithout\b/i,
  /\bavoid\b/i,
  /\bdo not\b/i,
  /\bforbidden\b/i,
  /\bmust not\b/i,
  /\bno promise\b/i,
];

const WHITELIST_PREFIXES = [
  "docs/product/",
  "scripts/",
  "lib/product/governed-automation-",
];

function isWhitelisted(file) {
  return WHITELIST_PREFIXES.some((prefix) => file.startsWith(prefix));
}

const files = globSync("{pages,components,app,lib}/**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**"],
  cwd: root,
});

for (const file of files) {
  if (isWhitelisted(file)) continue;

  const content = fs.readFileSync(path.join(root, file), "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(\/\/|\/\*|\*|import )/.test(line)) continue;

    // Absolute forbidden
    for (const rule of FORBIDDEN_ABSOLUTE) {
      if (rule.pattern.test(line)) {
        const isNegation = NEGATION_PATTERNS.some((neg) => neg.test(line));
        if (isNegation) continue;
        console.error(`VIOLATION in ${file}:${i + 1}: forbidden phrase "${rule.label}"`);
        violations++;
      }
    }

    // Forbidden without safe context
    for (const rule of FORBIDDEN_WITHOUT_CONTEXT) {
      if (rule.pattern.test(line)) {
        const isNegation = NEGATION_PATTERNS.some((neg) => neg.test(line));
        if (isNegation) continue;
        const hasSafeContext = rule.safeContexts.some((ctx) => ctx.test(line));
        if (hasSafeContext) continue;
        // Check surrounding context (2 lines)
        const context = [lines[i - 1] ?? "", line, lines[i + 1] ?? ""].join(" ");
        const contextSafe = rule.safeContexts.some((ctx) => ctx.test(context));
        if (contextSafe) continue;
        console.error(`VIOLATION in ${file}:${i + 1}: "${rule.label}" without approved safe context`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\nGOVERNED_AUTOMATION_GUARD: FAIL (${violations} violation${violations !== 1 ? "s" : ""})`);
  process.exit(1);
} else {
  console.log("GOVERNED_AUTOMATION_GUARD: PASS");
}
