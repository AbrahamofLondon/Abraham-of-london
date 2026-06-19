import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import {
  CONTROLLED_TRUTH_CLAIMS,
  SUSPICIOUS_TRUTH_CLAIM_WARNINGS,
  type TruthClaimSurface,
} from "../../lib/intelligence/claim-vocabulary-registry";
import {
  inspectTruthClaimsInFile,
  inspectTruthClaimsInText,
} from "../../lib/intelligence/truth-claim-firewall";

type FileInput = {
  path: string;
  surface: TruthClaimSurface;
};

type TextInput = {
  label: string;
  text: string;
  surface: TruthClaimSurface;
};

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

const DEFAULT_FILE_INPUTS: FileInput[] = [
  { path: "pages/products.tsx", surface: "PUBLIC_PRODUCT_COPY" },
  { path: "pages/offers/fast-diagnostic-decision-support.tsx", surface: "PUBLIC_PRODUCT_COPY" },
  { path: "pages/offers/enterprise-assessment-advisory-review.tsx", surface: "PUBLIC_PRODUCT_COPY" },
  { path: "pages/boardroom-brief.tsx", surface: "PUBLIC_PRODUCT_COPY" },
  { path: "pages/boardroom-mode.tsx", surface: "PUBLIC_PRODUCT_COPY" },
  { path: "pages/outcome/check.tsx", surface: "PUBLIC_PROOF_COPY" },
  { path: "pages/provenance/sample-export.tsx", surface: "PUBLIC_SAMPLE_COPY" },
  { path: "pages/provenance/demo.tsx", surface: "PUBLIC_PROOF_COPY" },
  { path: "pages/provenance/explained.tsx", surface: "PUBLIC_PROOF_COPY" },
];

const args = process.argv.slice(2);
const fileInputs: FileInput[] = [];
const textInputs: TextInput[] = [];
const argumentErrors: string[] = [];

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
const missingFiles: string[] = [];

for (const fileInput of dedupeFileInputs(fileInputs)) {
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
  })),
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
  })),
);

const warnings = scans.flatMap((scan) =>
  scan.result.warnings.map((warning) => ({
    input: scan.label,
    surface: scan.surface,
    label: warning.label,
    matchedText: warning.matchedText,
    line: warning.line,
    column: warning.column,
    context: warning.context,
    note: warning.note,
  })),
);

const totalFindings = scans.reduce(
  (count, scan) => count + scan.result.findings.length,
  0,
);

const gate =
  violations.length === 0 && missingFiles.length === 0
    ? "PASSED_TRUTH_CLAIM_FIREWALL"
    : "FAILED_TRUTH_CLAIM_FIREWALL";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  controlledClaimIds: CONTROLLED_TRUTH_CLAIMS.map((claim) => claim.id),
  warningLabels: SUSPICIOUS_TRUTH_CLAIM_WARNINGS.map((warning) => warning.label),
  scannedInputs: scans.map((scan) => ({
    kind: scan.kind,
    label: scan.label,
    surface: scan.surface,
    findings: scan.result.findings.length,
    violations: scan.result.violations.length,
    boundedFindings: scan.result.boundedFindings.length,
    warnings: scan.result.warnings.length,
  })),
  missingFiles,
  totalFindings,
  violationCount: violations.length,
  boundedCount: bounded.length,
  warningCount: warnings.length,
  violations,
  bounded,
  warnings,
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "truth-claim-firewall.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  join(REPORTS_DIR, "truth-claim-firewall.md"),
  renderMarkdown(report),
  "utf8",
);

console.log("TRUTH CLAIM FIREWALL");
console.log(`Gate: ${report.gate}`);
console.log(`Controlled claims: ${report.controlledClaimIds.join(", ")}`);
console.log(`Inputs scanned: ${report.scannedInputs.length}`);
console.log(`Total findings: ${report.totalFindings}`);
console.log(`Violations: ${report.violationCount}`);
console.log(`Bounded findings: ${report.boundedCount}`);
console.log(`Warnings: ${report.warningCount}`);
console.log("Report written: reports/truth-claim-firewall.json");

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
      `  - ${violation.input}:${violation.line}:${violation.column} ${violation.claimId} -> ${violation.matchedText}`,
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
      `  - ${finding.input}:${finding.line}:${finding.column} ${finding.claimId} -> ${finding.matchedText}`,
    );
  }
  if (bounded.length > 10) {
    console.log(`  ... and ${bounded.length - 10} more`);
  }
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings.slice(0, 10)) {
    console.log(
      `  - ${warning.input}:${warning.line}:${warning.column} ${warning.label} -> ${warning.matchedText}`,
    );
    console.log(`      * ${warning.note}`);
  }
  if (warnings.length > 10) {
    console.log(`  ... and ${warnings.length - 10} more`);
  }
}

process.exit(report.gate === "PASSED_TRUTH_CLAIM_FIREWALL" ? 0 : 1);

function inferSurface(filePath: string): TruthClaimSurface {
  const normalized = normalize(filePath);
  if (normalized.includes("pages/provenance/sample-export")) {
    return "PUBLIC_SAMPLE_COPY";
  }
  if (
    normalized.includes("pages/provenance/") ||
    normalized.includes("pages/outcome/")
  ) {
    return "PUBLIC_PROOF_COPY";
  }
  return "PUBLIC_PRODUCT_COPY";
}

function resolveWithinRoot(filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(ROOT, filePath);
}

function normalize(value: string): string {
  return value.replace(/\\/g, "/");
}

function dedupeFileInputs(inputs: FileInput[]): FileInput[] {
  const seen = new Set<string>();
  const deduped: FileInput[] = [];

  for (const input of inputs) {
    const key = `${normalize(input.path)}::${input.surface}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(input);
  }

  return deduped;
}

function renderMarkdown(report: {
  generatedAt: string;
  gate: string;
  controlledClaimIds: string[];
  warningLabels: string[];
  scannedInputs: Array<{
    kind: string;
    label: string;
    surface: string;
    findings: number;
    violations: number;
    boundedFindings: number;
    warnings: number;
  }>;
  missingFiles: string[];
  totalFindings: number;
  violationCount: number;
  boundedCount: number;
  warningCount: number;
  violations: Array<{
    input: string;
    line: number;
    column: number;
    claimId: string;
    matchedText: string;
    blockers: string[];
  }>;
  bounded: Array<{
    input: string;
    line: number;
    column: number;
    claimId: string;
    matchedText: string;
  }>;
  warnings: Array<{
    input: string;
    line: number;
    column: number;
    label: string;
    matchedText: string;
    note: string;
  }>;
}): string {
  return `# Truth Claim Firewall

Generated: ${report.generatedAt}

Gate: ${report.gate}

## Summary

- Controlled claims: ${report.controlledClaimIds.join(", ")}
- Warning labels: ${report.warningLabels.join(", ")}
- Inputs scanned: ${report.scannedInputs.length}
- Total findings: ${report.totalFindings}
- Violations: ${report.violationCount}
- Bounded findings: ${report.boundedCount}
- Warnings: ${report.warningCount}
- Missing files: ${report.missingFiles.length}

## Violations

${report.violations.length > 0
    ? report.violations
        .map(
          (violation) =>
            `- ${violation.input}:${violation.line}:${violation.column} ${violation.claimId} -> ${violation.matchedText}\n  - ${violation.blockers.join("\n  - ")}`,
        )
        .join("\n")
    : "- None"}

## Bounded Findings

${report.bounded.length > 0
    ? report.bounded
        .map(
          (finding) =>
            `- ${finding.input}:${finding.line}:${finding.column} ${finding.claimId} -> ${finding.matchedText}`,
        )
        .join("\n")
    : "- None"}

## Warnings

${report.warnings.length > 0
    ? report.warnings
        .map(
          (warning) =>
            `- ${warning.input}:${warning.line}:${warning.column} ${warning.label} -> ${warning.matchedText}\n  - ${warning.note}`,
        )
        .join("\n")
    : "- None"}
`;
}
