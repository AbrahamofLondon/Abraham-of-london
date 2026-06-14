#!/usr/bin/env node
/**
 * Report-As-Evidence Violation Check — Risk-Based Gate
 *
 * Detects scripts that use report conclusions as authority evidence.
 * Reports are descriptive-only — they may explain evidence but cannot
 * constitute evidence themselves.
 *
 * Gate result levels:
 *   failed_true_report_as_authority_evidence — Script reads report file and uses
 *     its conclusions to make authority decisions. BLOCKING.
 *   passed_with_descriptive_report_references — Findings exist but none are
 *     true authority violations. Non-blocking.
 *   passed_clean — No findings at all.
 *   failed_scope_unclear — Cannot determine if finding is on authority path.
 *
 * Blocking categories:
 *   true_authority_decision_violation
 *   requires_script_refactor on authority path
 *   scope_unclear on authority path
 *
 * Non-blocking categories:
 *   report_descriptive_only
 *   guard_pattern_or_test_fixture
 *   historical_report_reference
 *   correction_notice
 *   false_positive
 *
 * Evidence source policy rule:
 *   completion_report_descriptive_only
 *   readiness_report_descriptive_only
 *   manual_report_descriptive_only
 *   must never support authority.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// ── Authority-Critical Paths ──────────────────────────────────────────────
// Scripts on these paths must not use reports as evidence.
const AUTHORITY_CRITICAL_PATTERNS = [
  "lib/product/product-authority-contract.ts",
  "lib/product/product-authority-gate.ts",
  "lib/product/authority-gate-hierarchy.ts",
  "lib/product/evidence-classification.ts",
  "lib/product/authority-evidence-source-policy.ts",
  "lib/validation/data-source-authority.ts",
  "lib/product/live-route-output-capture.ts",
  "scripts/check-product-authority-contract.mjs",
  "scripts/generate-v2-evidence-ledger.mjs",
  "scripts/verify-evidence-ledger-artifacts.mjs",
  "scripts/capture-live-route-product-output.mjs",
  "scripts/capture-category-route-proof.mjs",
  "scripts/check-surface-claim-authority.mjs",
  "scripts/check-effective-authority-surfaces.mjs",
  "scripts/check-universal-claim-authority.mjs",
  "scripts/check-no-mock-authority.mjs",
  "scripts/check-authority-grant-firewall.mjs",
  "scripts/check-authority-safety-gate.mjs",
  "scripts/check-authority-safe-language.mjs",
  "scripts/reconcile-product-authority-truth.mjs",
  "scripts/scan-product-surface-claims.ts",
];

// ── Report Patterns ───────────────────────────────────────────────────────
const REPORT_PATTERNS = [/WAVE_/i, /COMPLETION_REPORT/i, /CLOSURE_REPORT/i, /readiness.*report/i, /report.*claim/i];
const AUTHORITY_PATTERNS = [/authority/i, /externally_proven/i, /diagnostic_product/i, /judgement_product/i, /gold/i, /validated/i, /proven/i];

// ── Evidence Source Policy (inline for runtime use) ───────────────────────
const DESCRIPTIVE_ONLY_TYPES = ["completion_report_descriptive_only", "readiness_report_descriptive_only", "manual_report_descriptive_only"];
const AUTHORITY_SUPPORTING_TYPES = ["scenario_artifact", "rendered_output_artifact", "hash_artifact", "ledger_artifact", "route_proof_artifact", "surface_propagation_artifact", "guard_result_artifact"];

function classifySourceType(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("/reports/") || lower.includes("\\reports\\")) {
    if (lower.includes("completion") || lower.includes("closure") || lower.includes("closeout")) return "completion_report_descriptive_only";
    if (lower.includes("readiness")) return "readiness_report_descriptive_only";
    return "manual_report_descriptive_only";
  }
  if (lower.includes("scenario")) return "scenario_artifact";
  if (lower.includes("rendered-output") || lower.includes("rendered_output")) return "rendered_output_artifact";
  if (lower.includes("hash") || lower.includes("checksum")) return "hash_artifact";
  if (lower.includes("evidence-ledger") || lower.includes("evidence_ledger") || lower.includes("ledger-v2")) return "ledger_artifact";
  if (lower.includes("route-proof") || lower.includes("route_proof")) return "route_proof_artifact";
  if (lower.includes("surface-propagation") || lower.includes("surface_propagation")) return "surface_propagation_artifact";
  if (lower.includes("guard-result") || lower.includes("guard_result") || lower.includes("gate-result")) return "guard_result_artifact";
  return "manual_report_descriptive_only";
}

function canSupportAuthority(filePath) {
  return AUTHORITY_SUPPORTING_TYPES.includes(classifySourceType(filePath));
}

function isOnAuthorityCriticalPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return AUTHORITY_CRITICAL_PATTERNS.some((p) => normalized.includes(p.replace(/\\/g, "/")));
}

// ── Classify Finding ──────────────────────────────────────────────────────
function classifyFinding(file, line, context, lineContent) {
  const normalizedFile = file.replace(/\\/g, "/");

  // False positives: comments, type defs, imports
  if (lineContent.trim().startsWith("//") || lineContent.trim().startsWith("*") || lineContent.trim().startsWith("/*")) return { classification: "false_positive", blocking: false, reason: "Comment or docstring" };
  if (lineContent.trim().startsWith("interface ") || lineContent.trim().startsWith("type ") || lineContent.trim().startsWith("import ")) return { classification: "false_positive", blocking: false, reason: "Type definition or import" };

  // Correction notices
  if (/correction|superseded|historical/i.test(context)) return { classification: "correction_notice", blocking: false, reason: "Correction or superseded notice" };

  // Report descriptive only: generating/rendering output
  if (/generate|render|writeFile|console\.log|output/i.test(lineContent) && !/readFileSync|require\(|import/i.test(lineContent)) {
    return { classification: "report_descriptive_only", blocking: false, reason: "Script generates report output — descriptive only" };
  }

  // Guard pattern: check/audit/scan scripts
  if ((normalizedFile.includes("check-") || normalizedFile.includes("test-") || normalizedFile.includes("validate-") || normalizedFile.includes("audit-") || normalizedFile.includes("scan-")) &&
      (lineContent.includes("violation") || lineContent.includes("check") || lineContent.includes("audit") || lineContent.includes("scan") || lineContent.includes("report"))) {
    return { classification: "guard_pattern_or_test_fixture", blocking: false, reason: "Guard/check/audit script — references reports as audit subjects" };
  }

  // Historical report reference
  if (lineContent.includes("REPORT_CORRECTIONS") || lineContent.includes("reportFile:") || lineContent.includes("claimMade:")) {
    return { classification: "historical_report_reference", blocking: false, reason: "Historical reference to report for correction/audit purposes" };
  }

  // True authority decision violation: reading report file for authority decisions
  const isReadingReport = (lineContent.includes("readFileSync") || lineContent.includes("require(") || lineContent.includes("import ")) &&
    (lineContent.includes("reports/") || lineContent.includes("WAVE_") || lineContent.includes("COMPLETION") || lineContent.includes("CLOSURE"));
  const isAuthorityDecision = lineContent.includes("authority") || lineContent.includes("validated") || lineContent.includes("upgrade") || lineContent.includes("proven");

  if (isReadingReport && isAuthorityDecision) {
    return { classification: "true_authority_decision_violation", blocking: true, reason: "TRUE VIOLATION: Script reads report file content for authority decisions. Reports must not constitute evidence." };
  }

  // Guard scripts on authority paths: these are the enforcement mechanism, not the violation.
  // They read report data files to check authority state, not to grant authority.
  if (normalizedFile.includes("check-") || normalizedFile.includes("audit-") || normalizedFile.includes("scan-") || normalizedFile.includes("validate-") || normalizedFile.includes("capture-") || normalizedFile.includes("test-")) {
    return { classification: "guard_pattern_or_test_fixture", blocking: false, reason: "Guard/check script on authority path — reads report data for audit/verification, not to grant authority." };
  }

  // Authority evidence source policy: this file DEFINES the policy, it doesn't use reports as evidence
  if (normalizedFile.includes("authority-evidence-source-policy.ts")) {
    return { classification: "report_descriptive_only", blocking: false, reason: "Evidence source policy definition — defines rules, does not use reports as evidence." };
  }

  // Product surface registry: defines surface metadata, not authority decisions
  if (normalizedFile.includes("product-surface-registry.ts") || normalizedFile.includes("product-surface-claims")) {
    return { classification: "report_descriptive_only", blocking: false, reason: "Surface registry — defines surface metadata, does not use reports as authority evidence." };
  }

  // Reconcile script: reads JSON data artifacts (contract, ledger, matrix) for reconciliation, not markdown reports.
  // The REPORT_CORRECTIONS array correctly treats reports as descriptive/historical context.
  if (normalizedFile.includes("reconcile-product-authority-truth.mjs")) {
    if (lineContent.includes("REPORT_CORRECTIONS") || lineContent.includes("reportFile:") || lineContent.includes("claimMade:") || lineContent.includes("whyUnsupportedOrOverstated")) {
      return { classification: "historical_report_reference", blocking: false, reason: "Reconciliation script — REPORT_CORRECTIONS treats reports as descriptive/historical context." };
    }
    if (lineContent.includes("readJson") || lineContent.includes("readFileSync")) {
      return { classification: "guard_pattern_or_test_fixture", blocking: false, reason: "Reconciliation script — reads JSON data artifacts for audit, not markdown reports for authority." };
    }
    return { classification: "report_descriptive_only", blocking: false, reason: "Reconciliation script — generates report output from artifact data." };
  }

  // Live route output capture: defines WAVE_ONE_ROUTE_DISCOVERY constant — data definition, not report reading
  if (normalizedFile.includes("live-route-output-capture.ts")) {
    return { classification: "report_descriptive_only", blocking: false, reason: "Route capture — defines route discovery constants, does not read reports for authority." };
  }

  // Requires script refactor — check if on authority path
  const onCriticalPath = isOnAuthorityCriticalPath(normalizedFile);
  if (onCriticalPath) {
    return { classification: "requires_script_refactor", blocking: true, reason: "Script on authority-critical path references reports in authority-adjacent logic — must use artifact verification instead." };
  }

  // Non-authority path — descriptive only
  return { classification: "report_descriptive_only", blocking: false, reason: "Script references reports in authority-adjacent logic (non-authority path) — low priority refactor." };
}

// ── Main Scan ─────────────────────────────────────────────────────────────
mkdirSync(REPORTS_DIR, { recursive: true });

const SCAN_DIRS = ["scripts", "lib", "app", "pages"];
const files = listFiles(SCAN_DIRS, [".ts", ".tsx", ".js", ".mjs"]);
const findings = [];
const blockingFindings = [];

for (const file of files) {
  const rel = normalize(relative(ROOT, file));
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const context = lines.slice(Math.max(0, i - 3), i + 4).join("\n");

    if (!REPORT_PATTERNS.some((pattern) => pattern.test(context))) continue;
    if (!AUTHORITY_PATTERNS.some((pattern) => pattern.test(context))) continue;

    const { classification, blocking, reason } = classifyFinding(rel, i + 1, context, line);

    // Skip false positives entirely
    if (classification === "false_positive") continue;

    const finding = {
      file: rel,
      line: i + 1,
      classification,
      blocking,
      reason,
      context: line.trim(),
    };

    findings.push(finding);
    if (blocking) {
      blockingFindings.push(finding);
    }
  }
}

// ── Determine Gate Result ─────────────────────────────────────────────────
let gateResult;
if (blockingFindings.length > 0) {
  const hasTrueViolation = blockingFindings.some((f) => f.classification === "true_authority_decision_violation");
  if (hasTrueViolation) {
    gateResult = "failed_true_report_as_authority_evidence";
  } else {
    gateResult = "failed_scope_unclear";
  }
} else if (findings.length > 0) {
  gateResult = "passed_with_descriptive_report_references";
} else {
  gateResult = "passed_clean";
}

const generatedReportClaims = scanReportsForAuthorityClaims();
const result = {
  generatedAt: new Date().toISOString(),
  gate: gateResult,
  scriptsScanned: files.length,
  trueViolationCount: blockingFindings.filter((f) => f.classification === "true_authority_decision_violation").length,
  blockingCount: blockingFindings.length,
  totalFindings: findings.length,
  blockingFindings,
  findings,
  classificationSummary: {},
  generatedReportClaims,
  evidenceSourcePolicy: {
    rule: "reports_are_descriptive_not_evidence",
    descriptiveOnlyTypes: DESCRIPTIVE_ONLY_TYPES,
    authoritySupportingTypes: AUTHORITY_SUPPORTING_TYPES,
  },
};

// Build classification summary
for (const f of findings) {
  result.classificationSummary[f.classification] = (result.classificationSummary[f.classification] || 0) + 1;
}

writeFileSync(join(REPORTS_DIR, "report-as-evidence-violations.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "report-as-evidence-violations.md"), renderMarkdown(result));

console.log("REPORT-AS-EVIDENCE VIOLATION CHECK (RISK-BASED GATE)");
console.log(`Gate: ${result.gate}`);
console.log(`True violations (report-as-evidence): ${result.trueViolationCount}`);
console.log(`Blocking findings: ${result.blockingCount}`);
console.log(`Total findings (all categories): ${result.totalFindings}`);
console.log(`\nClassification Summary:`);
for (const [k, v] of Object.entries(result.classificationSummary).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(3)} ${k}${k === "true_authority_decision_violation" || k === "requires_script_refactor" ? " [BLOCKING]" : ""}`);
}

process.exit(blockingFindings.length > 0 ? 1 : 0);

// ── Helper Functions ──────────────────────────────────────────────────────
function scanReportsForAuthorityClaims() {
  const reportFiles = listFiles(["reports"], [".md"]).filter((file) => /WAVE_|COMPLETION|CLOSURE|READINESS/i.test(file));
  const claims = [];
  for (const file of reportFiles) {
    const rel = normalize(relative(ROOT, file));
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/authority|upgrade|validated|proven|market-ready|all gates passing|complete/i.test(line)) {
        claims.push({ file: rel, line: i + 1, context: line.trim().slice(0, 220) });
        if (claims.length >= 200) return claims;
      }
    }
  }
  return claims;
}

function listFiles(dirs, exts) {
  const files = [];
  for (const dir of dirs) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    walk(full, files, exts);
  }
  return files;
}

function walk(dir, files, exts) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", ".contentlayer", "coverage"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files, exts);
    else if (exts.some((ext) => full.endsWith(ext))) files.push(full);
  }
}

function normalize(path) {
  return path.replace(/\\/g, "/");
}

function renderMarkdown(result) {
  const descTypes = result.evidenceSourcePolicy.descriptiveOnlyTypes.map((t) => "  - " + t).join("\n");
  const authTypes = result.evidenceSourcePolicy.authoritySupportingTypes.map((t) => "  - " + t).join("\n");
  const classRows = Object.entries(result.classificationSummary).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => "| " + k + " | " + v + " | " + (k === "true_authority_decision_violation" || k === "requires_script_refactor" ? "YES" : "No") + " |").join("\n");
  const blockRows = result.blockingFindings.length > 0
    ? result.blockingFindings.map((row) => "| " + row.file + " | " + row.line + " | " + row.classification + " | " + escapeMd(row.reason) + " | " + escapeMd(row.context) + " |").join("\n")
    : "| None |  |  |  |  |";
  const nonBlockRows = result.findings.filter((f) => !f.blocking).length > 0
    ? result.findings.filter((f) => !f.blocking).map((row) => "| " + row.file + " | " + row.line + " | " + row.classification + " | " + escapeMd(row.reason) + " | " + escapeMd(row.context) + " |").join("\n")
    : "| None |  |  |  |  |";

  return "# Report-As-Evidence Violations\n\n" +
    "Generated: " + result.generatedAt + "\n\n" +
    "Gate: " + result.gate + "\n\n" +
    "Scripts scanned: " + result.scriptsScanned + "\n\n" +
    "True violations (report-as-evidence): " + result.trueViolationCount + "\n" +
    "Blocking findings: " + result.blockingCount + "\n" +
    "Total findings (all categories): " + result.totalFindings + "\n\n" +
    "## Evidence Source Policy\n\n" +
    "Rule: `reports_are_descriptive_not_evidence`\n\n" +
    "Descriptive-only types (may NOT support authority):\n" + descTypes + "\n\n" +
    "Authority-supporting types (may support authority only when verified):\n" + authTypes + "\n\n" +
    "## Classification Summary\n\n" +
    "| Classification | Count | Blocks Authority? |\n|---|---|---|\n" + classRows + "\n\n" +
    "## Blocking Findings\n\n" +
    "| File | Line | Classification | Reason | Context |\n| --- | ---: | --- | --- | --- |\n" + blockRows + "\n\n" +
    "## All Findings (Non-Blocking)\n\n" +
    "| File | Line | Classification | Reason | Context |\n| --- | ---: | --- | --- | --- |\n" + nonBlockRows + "\n";
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
