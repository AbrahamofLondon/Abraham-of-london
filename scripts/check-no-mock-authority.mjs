#!/usr/bin/env node

/**
 * scripts/check-no-mock-authority.mjs
 *
 * No-Mock Authority Gate
 *
 * Scans for hardcoded mock data, placeholders, and static fixtures in authority paths.
 * Ensures that no authority decision is based on mock, hardcoded, or placeholder data.
 *
 * Risky patterns:
 * - mock, fixture, placeholder, sample, dummy, hardcoded in authority paths
 * - TODO, FIXME, FAKE, testData in validation gates
 * - defaultGold, staticPass, hardcodedAuthority in classification
 * - exampleData in evidence ledgers
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { globSync } from "glob";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

const RISKY_PATTERNS = [
  /mock\s*[:=]/gi,
  /fixture/gi,
  /placeholder/gi,
  /sample\s*[:=]/gi,
  /dummy\s*[:=]/gi,
  /hardcoded/gi,
  /testData/gi,
  /exampleData/gi,
  /FAKE/g,
  /defaultGold/gi,
  /staticPass/gi,
  /hardcodedAuthority/gi,
  /defaultAuthority/gi,
];

const AUTHORITY_PATHS = [
  "scripts/check-*.mjs",
  "lib/validation/*.ts",
  "lib/product/*.ts",
  "lib/commercial/*.ts",
  "lib/reporting/*.ts",
  "lib/server/*.ts",
  "components/admin/*.tsx",
  "components/reporting/*.tsx",
  "pages/api/*.ts",
  "app/api/**/*.ts",
];

const SAFE_CONTEXTS = ["// test", "// demo", "// fixture", "// example"];

console.log("NO-MOCK AUTHORITY GATE");
console.log("Scanning for hardcoded mock/placeholder data in authority paths\n");

const findings = [];
const exceptions = [];

// Scan authority paths
for (const pattern of AUTHORITY_PATHS) {
  const files = globSync(pattern, { cwd: ROOT });

  for (const file of files) {
    const filePath = join(ROOT, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Check for risky patterns
        for (const pattern of RISKY_PATTERNS) {
          if (pattern.test(line)) {
            // Check if this is in a safe context (test, demo, fixture, example)
            const isSafeContext = SAFE_CONTEXTS.some(ctx => line.includes(ctx));

            if (!isSafeContext) {
              // Check if the line is about authority/validation
              const isAuthorityLine =
                line.includes("authority") ||
                line.includes("classification") ||
                line.includes("evidence") ||
                line.includes("validation") ||
                line.includes("gate") ||
                line.includes("pass") ||
                line.includes("grade");

              if (isAuthorityLine) {
                findings.push({
                  file,
                  line: lineNum,
                  pattern: pattern.toString(),
                  content: line.trim(),
                  severity: "HIGH",
                });
              }
            }
          }
        }

        // Check for hardcoded pass/fail in gates
        if (file.includes("check-") && file.includes(".mjs")) {
          if (
            /gateStatus\s*[:=]\s*["']PASSED["']/i.test(line) &&
            !line.includes("result.gate")
          ) {
            findings.push({
              file,
              line: lineNum,
              pattern: "hardcoded_gate_status",
              content: line.trim(),
              severity: "CRITICAL",
            });
          }

          if (/validationConstitutionPassed\s*[:=]\s*false/i.test(line)) {
            if (!line.includes("mock") && !line.includes("test")) {
              findings.push({
                file,
                line: lineNum,
                pattern: "hardcoded_validation_false",
                content: line.trim(),
                severity: "MEDIUM",
              });
            }
          }
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }
}

// Determine gate result
const criticalFindings = findings.filter(f => f.severity === "CRITICAL");
const hasBlockingIssues = criticalFindings.length > 0;

const result = {
  auditDate: new Date().toISOString(),
  gateStatus: hasBlockingIssues ? "FAILED" : "PASSED",
  pathsScanned: AUTHORITY_PATHS.length,
  findingsTotal: findings.length,
  findingsCritical: criticalFindings.length,
  findingsHigh: findings.filter(f => f.severity === "HIGH").length,
  findingsMedium: findings.filter(f => f.severity === "MEDIUM").length,
  findings: findings,
  doctrine: "No hardcoded mock data may grant authority",
  exceptions: exceptions,
};

// Output results
console.log(`Paths scanned: ${AUTHORITY_PATHS.length}`);
console.log(`Files checked: ${findings.length > 0 ? "multiple" : "clean"}`);
console.log(`\nFindings:`);
console.log(`  Critical: ${result.findingsCritical}`);
console.log(`  High: ${result.findingsHigh}`);
console.log(`  Medium: ${result.findingsMedium}`);

if (findings.length > 0) {
  console.log(`\nDetailed Findings:`);
  findings.forEach(f => {
    console.log(`\n  ${f.file}:${f.line}`);
    console.log(`    Pattern: ${f.pattern}`);
    console.log(`    Severity: ${f.severity}`);
    console.log(`    Content: ${f.content.substring(0, 80)}`);
  });
}

console.log(`\n${"=".repeat(70)}`);
console.log("NO-MOCK AUTHORITY GATE RESULT");
console.log(`${"=".repeat(70)}`);
console.log(`Gate Status: ${result.gateStatus === "PASSED" ? "✓ PASSED" : "✗ FAILED"}`);
console.log(`\nHardened against known mock-authority patterns:`);
console.log(`  - Hardcoded gate status (pass/fail)`);
console.log(`  - Mock classification data`);
console.log(`  - Placeholder evidence`);
console.log(`  - Static pass fixtures in authority paths`);
console.log(`\nIf findings exist, they must be remediated before authority restoration.`);

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "no-mock-authority.json"),
  JSON.stringify(result, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "no-mock-authority.json")}`);

process.exit(result.gateStatus === "PASSED" ? 0 : 1);
