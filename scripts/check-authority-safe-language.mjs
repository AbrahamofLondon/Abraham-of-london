#!/usr/bin/env node

/**
 * Authority-Safe Language Audit — Precision Scanner
 *
 * Classifies findings into categories so the gate fails only for
 * unsafe_operational_claim while reporting other categories as informational.
 *
 * Classification categories:
 *   unsafe_operational_claim     — Gate-failing: unscoped claim that authority is safe
 *   bounded_claim                — Claim is scoped with "while blocked", "pending", etc.
 *   historical_or_superseded     — Report has correction notice or superseded status
 *   correction_notice            — The correction notice itself (describing the problem)
 *   guard_pattern                — Inside a guard definition listing what it detects
 *   test_fixture                 — Test or example showing old/new patterns
 *   false_positive               — Not an actual claim (e.g., code comments, type defs)
 */

import { readFileSync } from "fs";
import { globSync } from "glob";

const UNSAFE_PHRASES = [
  "all gates passing",
  "authority safe",
  "market ready",
  "fully operational",
  "estate ready",
  "validated estate",
  "proven authority",
];

const REPORT_PATHS = ["reports/**/*.md", "reports/**/*.json"];

// Scope words that indicate a claim is bounded/qualified
const SCOPE_WORDS = ["while", "blocked", "failing", "pending", "cannot", "scoped", "flagged"];

// Patterns that indicate a line is inside a guard definition or test fixture
const GUARD_PATTERNS = [
  /"all gates passing"/i,
  /"authority safe"/i,
  /"market ready"/i,
  /"fully operational"/i,
  /"estate ready"/i,
  /"validated estate"/i,
  /"proven authority"/i,
  /detects? and rejects?/i,
  /unsafe phrases? detected/i,
  /not allowed/i,
  /old.*unsafe/i,
  /old.*new/i,
];

// Patterns that indicate a correction notice
const CORRECTION_PATTERNS = [
  /correction/i,
  /superseded/i,
  /historical/i,
  /does not currently grant/i,
  /must be read as/i,
];

// Patterns that indicate test fixtures or examples
const TEST_FIXTURE_PATTERNS = [
  /old.*unsafe/i,
  /new.*scoped/i,
  /example/i,
  /flagged when/i,
  /without acknowledging/i,
  /flagged while blocked/i,
];

console.log("AUTHORITY-SAFE LANGUAGE AUDIT (PRECISION SCANNER)");
console.log("=================================================\n");

const findings = {
  unsafe_operational_claim: [],
  bounded_claim: [],
  historical_or_superseded: [],
  correction_notice: [],
  guard_pattern: [],
  test_fixture: [],
  false_positive: [],
};

for (const pattern of REPORT_PATHS) {
  const files = globSync(pattern);

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const lowerContent = content.toLowerCase();

      for (const phrase of UNSAFE_PHRASES) {
        if (!lowerContent.includes(phrase.toLowerCase())) continue;

        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].toLowerCase().includes(phrase.toLowerCase())) continue;

          const line = lines[i];
          const lineLower = line.toLowerCase();

          // Check for scope words in the line itself or nearby context
          const context = lines
            .slice(Math.max(0, i - 2), Math.min(lines.length, i + 3))
            .join(" ")
            .toLowerCase();

          const isScoped = SCOPE_WORDS.some((w) => context.includes(w));

          // Classify the finding
          let classification;

          // 1. Check if this is a correction notice
          if (CORRECTION_PATTERNS.some((p) => p.test(line))) {
            classification = "correction_notice";
          }
          // 2. Check if this is inside a guard definition (detection list)
          else if (GUARD_PATTERNS.some((p) => p.test(line))) {
            classification = "guard_pattern";
          }
          // 3. Check if this is a test fixture or example
          else if (TEST_FIXTURE_PATTERNS.some((p) => p.test(line))) {
            classification = "test_fixture";
          }
          // 4. Check if it's a historical/superseded report
          else if (context.includes("correction") || context.includes("superseded")) {
            classification = "historical_or_superseded";
          }
          // 5. Check if it's bounded/scoped
          else if (isScoped) {
            classification = "bounded_claim";
          }
          // 6. Default: unsafe operational claim
          else {
            classification = "unsafe_operational_claim";
          }

          findings[classification].push({
            file,
            line: i + 1,
            phrase,
            text: line.trim().substring(0, 120),
          });
        }
      }
    } catch (err) {
      // Skip binary files
    }
  }
}

// Report findings by category
let totalUnsafe = 0;

for (const [category, items] of Object.entries(findings)) {
  if (items.length === 0) continue;

  const icon = category === "unsafe_operational_claim" ? "❌" : "ℹ️";
  console.log(`${icon} ${category}: ${items.length}`);

  if (category === "unsafe_operational_claim") {
    totalUnsafe += items.length;
    for (const item of items) {
      console.log(`   ${item.file}:${item.line} — "${item.phrase}" in: ${item.text}`);
    }
  } else {
    // Show first 3 as examples
    const examples = items.slice(0, 3);
    for (const item of examples) {
      console.log(`   ${item.file}:${item.line} — ${item.text.substring(0, 100)}`);
    }
    if (items.length > 3) {
      console.log(`   ... and ${items.length - 3} more`);
    }
  }
  console.log("");
}

// Summary
console.log("---");
console.log(`\nTotal unsafe operational claims: ${totalUnsafe}`);
console.log(`Total bounded claims (informational): ${findings.bounded_claim.length}`);
console.log(`Total guard patterns (informational): ${findings.guard_pattern.length}`);
console.log(`Total correction notices (informational): ${findings.correction_notice.length}`);
console.log(`Total historical/superseded (informational): ${findings.historical_or_superseded.length}`);
console.log(`Total test fixtures (informational): ${findings.test_fixture.length}`);
console.log(`Total false positives (informational): ${findings.false_positive.length}`);

if (totalUnsafe === 0) {
  console.log("\n✓ No unsafe operational claims detected");
  process.exit(0);
} else {
  console.log(`\n❌ Gate: FAILED_AUTHORITY_SAFE_LANGUAGE — ${totalUnsafe} unsafe operational claims`);
  console.log("Authority-safe claims must be scoped: 'while blocked', 'cannot report', etc.");
  process.exit(1);
}
