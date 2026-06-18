#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

const DEFAULT_FILE_INPUTS = [
  { path: "pages/provenance/sample-export.tsx", surface: "PUBLIC_SAMPLE_COPY" },
];

const moduleUrl = pathToFileURL(
  join(ROOT, "lib/intelligence/truth-claim-firewall.ts")
).href;

const {
  inspectTruthClaimsInFile,
  inspectTruthClaimsInText,
} = await import(moduleUrl);

const args = process.argv.slice(2);
const fileInputs = [];
const textInputs = [];
const argumentErrors = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  const next = args[index + 1];

  if (arg === "--file") {
    if (!next) {
      argumentErrors.push("Missing value for --file.");
      continue;
    }
    fileInputs.push({
      path: next,
      surface: inferSurface(next),
    });
    index += 1;
    continue;
  }

  if (arg === "--text") {
    if (!next) {
      argumentErrors.push("Missing value for --text.");
      continue;
    }
    textInputs.push({
      label: `text:${textInputs.length + 1}`,
      text: next,
      surface: "PUBLIC_PRODUCT_COPY",
    });
    index += 1;
    continue;
  }

  if (arg === "--sample-text") {
    if (!next) {
      argumentErrors.push("Missing value for --sample-text.");
      continue;
    }
    textInputs.push({
      label: `sample:${textInputs.length + 1}`,
      text: next,
      surface: "PUBLIC_SAMPLE_COPY",
    });
    index += 1;
    continue;
  }

  argumentErrors.push(`Unknown argument: ${arg}`);
}

if (fileInputs.length === 0 && textInputs.length === 0) {
  fileInputs.push(...DEFAULT_FILE_INPUTS);
}

if (argumentErrors.length > 0) {
  for (const error of argumentErrors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

const scans = [];
const missingFiles = [];

for (const fileInput of fileInputs) {
  const fullPath = resolveWithinRoot(fileInput.path);
  if (!existsSync(fullPath)) {
    missingFiles.push(normalize(relative(ROOT, fullPath)));
    continue;
  }

  const result = inspectTruthClaimsInFile({
    filePath: fullPath,
    surface: fileInput.surface,
  });

  scans.push({
    kind: "file",
    label: normalize(relative(ROOT, fullPath)),
    surface: fileInput.surface,
    result,
  });
}

for (const textInput of textInputs) {
  const result = inspectTruthClaimsInText({
    text: textInput.text,
    surface: textInput.surface,
  });

  scans.push({
    kind: "text",
    label: textInput.label,
    surface: textInput.surface,
    result,
  });
}

const violations = scans.flatMap((scan) =>
  scan.result.violations.map((finding) => ({
    input: scan.label,
    surface: scan.surface,
    claimId: finding.claimId,
    matchedText: finding.matchedText,
    line: finding.line,
    column: finding.column,
    context: finding.context,
    blockers: finding.blockers,
  }))
);

const bounded = scans.flatMap((scan) =>
  scan.result.boundedFindings.map((finding) => ({
    input: scan.label,
    surface: scan.surface,
    claimId: finding.claimId,
    matchedText: finding.matchedText,
    line: finding.line,
    column: finding.column,
    context: finding.context,
  }))
);

const totalFindings = scans.reduce(
  (count, scan) => count + scan.result.findings.length,
  0
);

const gate =
  violations.length === 0 && missingFiles.length === 0
    ? "PASSED_TRUTH_CLAIM_FIREWALL"
    : "FAILED_TRUTH_CLAIM_FIREWALL";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  scannedInputs: scans.map((scan) => ({
    kind: scan.kind,
    label: scan.label,
    surface: scan.surface,
    findings: scan.result.findings.length,
    violations: scan.result.violations.length,
    boundedFindings: scan.result.boundedFindings.length,
  })),
  missingFiles,
  totalFindings,
  violationCount: violations.length,
  boundedCount: bounded.length,
  violations,
  bounded,
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "truth-claim-firewall.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(REPORTS_DIR, "truth-claim-firewall.md"),
  renderMarkdown(report),
  "utf8"
);

console.log("TRUTH CLAIM FIREWALL");
console.log(`Gate: ${report.gate}`);
console.log(`Inputs scanned: ${report.scannedInputs.length}`);
console.log(`Total findings: ${report.totalFindings}`);
console.log(`Violations: ${report.violationCount}`);
console.log(`Bounded findings: ${report.boundedCount}`);

if (missingFiles.length > 0) {
  console.log("\nMissing files:");
  for (const missing of missingFiles) {
    console.log(`  - ${missing}`);
  }
}

if (violations.length > 0) {
  console.log("\nViolations:");
  for (const violation of violations) {
    console.log(
      `  - ${violation.input}:${violation.line}:${violation.column} ${violation.claimId} -> ${violation.matchedText}`
    );
    for (const blocker of violation.blockers) {
      console.log(`      * ${blocker}`);
    }
  }
}

if (bounded.length > 0) {
  console.log("\nBounded findings:");
  for (const finding of bounded.slice(0, 10)) {
    console.log(
      `  - ${finding.input}:${finding.line}:${finding.column} ${finding.claimId} -> ${finding.matchedText}`
    );
  }
  if (bounded.length > 10) {
    console.log(`  ... and ${bounded.length - 10} more`);
  }
}

process.exit(report.gate === "PASSED_TRUTH_CLAIM_FIREWALL" ? 0 : 1);

function inferSurface(filePath) {
  const normalized = normalize(filePath);
  if (normalized.includes("pages/provenance/sample-export")) {
    return "PUBLIC_SAMPLE_COPY";
  }
  if (normalized.includes("pages/outcome/check")) {
    return "PUBLIC_PROOF_COPY";
  }
  return "PUBLIC_PRODUCT_COPY";
}

function resolveWithinRoot(filePath) {
  return isAbsolute(filePath) ? filePath : join(ROOT, filePath);
}

function normalize(value) {
  return value.replace(/\\/g, "/");
}

function renderMarkdown(report) {
  return `# Truth Claim Firewall

Generated: ${report.generatedAt}

Gate: ${report.gate}

## Summary

- Inputs scanned: ${report.scannedInputs.length}
- Total findings: ${report.totalFindings}
- Violations: ${report.violationCount}
- Bounded findings: ${report.boundedCount}
- Missing files: ${report.missingFiles.length}

## Violations

${report.violations.length > 0
    ? report.violations
        .map(
          (violation) =>
            `- ${violation.input}:${violation.line}:${violation.column} ${violation.claimId} -> ${violation.matchedText}\n  - ${violation.blockers.join("\n  - ")}`
        )
        .join("\n")
    : "- None"}

## Bounded Findings

${report.bounded.length > 0
    ? report.bounded
        .map(
          (finding) =>
            `- ${finding.input}:${finding.line}:${finding.column} ${finding.claimId} -> ${finding.matchedText}`
        )
        .join("\n")
    : "- None"}
`;
}
