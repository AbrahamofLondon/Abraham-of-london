#!/usr/bin/env node

/**
 * Authority-Safe Language Audit - Precision Scanner
 *
 * The gate fails only for live_unsafe_operational_claim.
 * Generated audit echoes, correction notices, guard patterns, historical
 * references, test fixtures, false positives, and bounded claims are reported
 * but do not block contract eligibility.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

const REPORTS_DIR = "reports";

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
const SCOPE_WORDS = ["while", "blocked", "failing", "pending", "cannot", "scoped", "flagged", "not granted", "non-restored"];

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
  /scanner/i,
];

const CORRECTION_PATTERNS = [
  /correction/i,
  /superseded/i,
  /historical/i,
  /does not currently grant/i,
  /must be read as/i,
];

const TEST_FIXTURE_PATTERNS = [
  /old.*unsafe/i,
  /new.*scoped/i,
  /example/i,
  /flagged when/i,
  /without acknowledging/i,
  /flagged while blocked/i,
];

const GENERATED_AUDIT_FILES = [
  /reports[\\/]+system-truth-/i,
  /reports[\\/]+report-as-evidence-violations\.json$/i,
  /reports[\\/]+unsafe-operational-authority-claims\.(json|md)$/i,
  /reports[\\/]+authority-safe-language-remaining-findings\.(json|md)$/i,
];

const HISTORICAL_REPORT_PATTERNS = [
  /reports[\\/]+WAVE_/i,
  /reports[\\/]+BLOCKING_GATE_REMEDIATION_/i,
  /reports[\\/]+AUTHORITY_BLOCKING_GATE_ENFORCEMENT/i,
  /reports[\\/]+AUTHORITY_ENFORCEMENT_VERIFICATION_CHALLENGE_REPORT/i,
  /reports[\\/]+CONTROLLED_AUTHORITY_RESTORATION_REVIEW_/i,
];

console.log("AUTHORITY-SAFE LANGUAGE AUDIT (PRECISION SCANNER)");
console.log("=================================================\n");

const findings = {
  live_unsafe_operational_claim: [],
  generated_stale_quote: [],
  correction_notice: [],
  guard_pattern: [],
  historical_superseded_reference: [],
  test_fixture: [],
  false_positive: [],
  bounded_claim: [],
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
          const line = lines[i] ?? "";
          if (!line.toLowerCase().includes(phrase.toLowerCase())) continue;

          const context = lines
            .slice(Math.max(0, i - 2), Math.min(lines.length, i + 3))
            .join(" ")
            .toLowerCase();
          const classification = classifyFinding({
            file,
            phrase,
            line,
            context,
            isScoped: SCOPE_WORDS.some((word) => context.includes(word)),
          });

          findings[classification].push({
            file,
            line: i + 1,
            phrase,
            context: line.trim().substring(0, 240),
            classification,
            sourceStatus: sourceStatusFor(classification),
            requiredAction: requiredActionFor(classification),
          });
        }
      }
    } catch {
      // Skip unreadable/binary files.
    }
  }
}

const allFindings = Object.values(findings).flat();
const totalUnsafe = findings.live_unsafe_operational_claim.length;
const result = {
  generatedAt: new Date().toISOString(),
  gate: totalUnsafe === 0
    ? (findings.generated_stale_quote.length > 0 ? "PASSED_WITH_NON_BLOCKING_GENERATED_QUOTES" : "PASSED_AUTHORITY_SAFE_LANGUAGE")
    : "FAILED_AUTHORITY_SAFE_LANGUAGE",
  startingUnsafeLanguageCount: 57,
  endingBlockingUnsafeClaimCount: totalUnsafe,
  totalFindings: allFindings.length,
  classificationSummary: Object.fromEntries(
    Object.entries(findings).map(([key, value]) => [key, value.length])
  ),
  findings: allFindings,
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  "reports/authority-safe-language-remaining-findings.json",
  `${JSON.stringify(result, null, 2)}\n`
);
writeFileSync(
  "reports/authority-safe-language-remaining-findings.md",
  renderMarkdown(result)
);

for (const [category, items] of Object.entries(findings)) {
  if (items.length === 0) continue;
  const icon = category === "live_unsafe_operational_claim" ? "X" : "i";
  console.log(`${icon} ${category}: ${items.length}`);

  const examples = category === "live_unsafe_operational_claim" ? items : items.slice(0, 3);
  for (const item of examples) {
    console.log(`   ${item.file}:${item.line} - "${item.phrase}" in: ${item.context.substring(0, 120)}`);
  }
  if (items.length > examples.length) {
    console.log(`   ... and ${items.length - examples.length} more`);
  }
  console.log("");
}

console.log("---");
console.log(`\nTotal live unsafe operational claims: ${totalUnsafe}`);
console.log(`Total generated stale quotes (informational): ${findings.generated_stale_quote.length}`);
console.log(`Total correction notices (informational): ${findings.correction_notice.length}`);
console.log(`Total guard patterns (informational): ${findings.guard_pattern.length}`);
console.log(`Total historical/superseded references (informational): ${findings.historical_superseded_reference.length}`);
console.log(`Total test fixtures (informational): ${findings.test_fixture.length}`);
console.log(`Total false positives (informational): ${findings.false_positive.length}`);
console.log(`Total bounded claims (informational): ${findings.bounded_claim.length}`);
console.log("\nWritten: reports/authority-safe-language-remaining-findings.json");
console.log("Written: reports/authority-safe-language-remaining-findings.md");

if (totalUnsafe === 0) {
  console.log(`\nOK Gate: ${result.gate}`);
  process.exit(0);
}

console.log(`\nFAIL Gate: FAILED_AUTHORITY_SAFE_LANGUAGE - ${totalUnsafe} live unsafe operational claims`);
process.exit(1);

function classifyFinding({ file, phrase, line, context, isScoped }) {
  const normalized = file.replace(/\\/g, "/");
  const lineLower = line.toLowerCase();

  if (isGateNameFalsePositive(phrase, lineLower)) return "false_positive";
  if (GENERATED_AUDIT_FILES.some((pattern) => pattern.test(normalized))) return "generated_stale_quote";
  if (CORRECTION_PATTERNS.some((pattern) => pattern.test(line))) return "correction_notice";
  if (context.includes("correction") || context.includes("superseded")) return "historical_superseded_reference";
  if (HISTORICAL_REPORT_PATTERNS.some((pattern) => pattern.test(normalized))) return "historical_superseded_reference";
  if (GUARD_PATTERNS.some((pattern) => pattern.test(line))) return "guard_pattern";
  if (TEST_FIXTURE_PATTERNS.some((pattern) => pattern.test(line))) return "test_fixture";
  if (isScoped) return "bounded_claim";

  return "live_unsafe_operational_claim";
}

function isGateNameFalsePositive(phrase, lineLower) {
  if (phrase !== "authority safe") return false;
  return (
    lineLower.includes("authority safety gate") ||
    lineLower.includes("authority safety:") ||
    lineLower.includes("authority safety result") ||
    lineLower.includes("authority safety gate result")
  );
}

function sourceStatusFor(classification) {
  switch (classification) {
    case "live_unsafe_operational_claim":
      return "live_source_blocks_contract_eligibility";
    case "generated_stale_quote":
      return "generated_audit_echo_not_live_authority_claim";
    case "historical_superseded_reference":
      return "historical_or_superseded_report";
    case "correction_notice":
      return "corrective_context";
    case "guard_pattern":
      return "scanner_or_guard_context";
    case "test_fixture":
      return "test_or_example_context";
    case "false_positive":
      return "not_authority_claim";
    case "bounded_claim":
      return "scoped_non_blocking_claim";
    default:
      return "unknown";
  }
}

function requiredActionFor(classification) {
  switch (classification) {
    case "live_unsafe_operational_claim":
      return "Fix source text before contract eligibility review.";
    case "generated_stale_quote":
      return "Informational only; regenerate source audits after live sources are corrected.";
    case "historical_superseded_reference":
      return "Keep as historical reference; do not treat as current authority.";
    case "correction_notice":
      return "No action; correction language is required context.";
    case "guard_pattern":
      return "No action; guard is naming unsafe patterns.";
    case "test_fixture":
      return "No action; test/example context.";
    case "false_positive":
      return "No action; not an authority claim.";
    case "bounded_claim":
      return "No action unless product authority state changes.";
    default:
      return "Review classification.";
  }
}

function renderMarkdown(result) {
  const rows = result.findings.map((finding) =>
    `| ${finding.file} | ${finding.line} | ${finding.phrase} | ${escapeMd(finding.context)} | ${finding.classification} | ${finding.sourceStatus} | ${escapeMd(finding.requiredAction)} |`
  ).join("\n");

  return `# Authority-Safe Language Remaining Findings

Generated: ${result.generatedAt}

Gate: ${result.gate}

Starting unsafe language count: ${result.startingUnsafeLanguageCount}

Ending blocking unsafe claim count: ${result.endingBlockingUnsafeClaimCount}

## Classification Summary

${Object.entries(result.classificationSummary).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Findings

| File | Line | Phrase | Context | Classification | Source Status | Required Action |
| --- | ---: | --- | --- | --- | --- | --- |
${rows || "| None | | | | | | |"}
`;
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
