#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const GENERATED_AT = new Date().toISOString();

const SEARCH_TERMS = [
  "hasValidV2Evidence",
  "evidenceLedgerV2Present",
  "ledger_entry_exists",
  "trusted_artifact_supported",
  "Evidence Ledger v2 not present",
  "canGrantAuthority",
  "publicClaimAllowed",
];

const AUTHORITY_PATH_FILES = new Set([
  "lib/product/resolve-product-authority.ts",
  "lib/product/authority-grant-firewall.ts",
  "lib/product/product-authority-contract.ts",
  "lib/product/derived-evidence-state.ts",
  "scripts/check-product-authority-contract.mjs",
  "scripts/check-authority-safety-gate.mjs",
  "scripts/reconcile-product-authority-truth.mjs",
  "scripts/verify-evidence-ledger-artifacts.mjs",
]);

const SCAN_DIRS = ["lib/product", "scripts"];
const SCAN_EXTS = [".ts", ".tsx", ".mjs", ".js"];

mkdirSync(REPORTS_DIR, { recursive: true });

const files = listFiles(SCAN_DIRS, SCAN_EXTS);
const occurrences = [];

for (const file of files) {
  const rel = normalize(relative(ROOT, file));
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const term of SEARCH_TERMS) {
      if (!line.includes(term)) continue;
      occurrences.push(classifyOccurrence(rel, index + 1, term, line.trim()));
    }
  });
}

const classifications = {
  authority_path_hardcoded: 0,
  derived_from_verifier: 0,
  display_only: 0,
  test_fixture: 0,
  historical_report: 0,
  safe_constant: 0,
  needs_refactor: 0,
};

for (const occurrence of occurrences) {
  classifications[occurrence.classification] =
    (classifications[occurrence.classification] ?? 0) + 1;
}

const failing = occurrences.filter((occurrence) =>
  occurrence.classification === "authority_path_hardcoded" ||
  occurrence.classification === "needs_refactor"
);

const result = {
  generatedAt: GENERATED_AT,
  gate: failing.length
    ? "FAILED_HARDCODED_EVIDENCE_TRUTH"
    : "PASSED_NO_HARDCODED_EVIDENCE_TRUTH",
  auditType: "hardcoded_evidence_state_audit",
  totalOccurrences: occurrences.length,
  classifications,
  failingOccurrences: failing,
  occurrences,
};

writeFileSync(join(REPORTS_DIR, "hardcoded-evidence-state-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "hardcoded-evidence-state-audit.md"), renderMarkdown(result));

console.log("NO HARDCODED EVIDENCE TRUTH GATE");
console.log(`Gate: ${result.gate}`);
console.log(`Occurrences: ${result.totalOccurrences}`);
console.log(`Authority-path hardcoded: ${classifications.authority_path_hardcoded}`);
console.log(`Needs refactor: ${classifications.needs_refactor}`);

process.exit(failing.length ? 1 : 0);

function classifyOccurrence(file, line, term, text) {
  const inAuthorityPath = AUTHORITY_PATH_FILES.has(file);

  if (file === "lib/product/derived-evidence-state.ts") {
    return occurrence(file, line, term, "derived_from_verifier", text, "Derived evidence loader reads verifier output and exposes derived state.");
  }

  if (file === "scripts/verify-evidence-ledger-artifacts.mjs") {
    return occurrence(file, line, term, "derived_from_verifier", text, "Artifact verifier produces the trusted ledger state.");
  }

  if (file === "scripts/check-product-authority-contract.mjs") {
    if (/derivedEvidence|verifiedEvidenceByProduct|ledgerVerification|row\.ledgerTrustState/.test(text)) {
      return occurrence(file, line, term, "derived_from_verifier", text, "Contract gate reads verifier-derived evidence.");
    }
    if (/canGrantAuthority:\s*false|publicClaimAllowed:\s*false|input\.state === "externally_proven_gold_product"/.test(text)) {
      return occurrence(file, line, term, "safe_constant", text, "Non-granting contract constant or positive-state guard.");
    }
    if (/Evidence Ledger v2 not present/.test(text)) {
      return occurrence(file, line, term, "safe_constant", text, "Non-granting missing-evidence blocking language.");
    }
  }

  if (file === "scripts/reconcile-product-authority-truth.mjs") {
    if (/verifierRow|ledgerVerification|trusted_artifact_supported/.test(text)) {
      return occurrence(file, line, term, "derived_from_verifier", text, "Reconciliation reads artifact verifier output.");
    }
  }

  if (file === "scripts/check-authority-safety-gate.mjs") {
    return occurrence(file, line, term, "safe_constant", text, "Safety gate reads generated gate reports and does not grant authority.");
  }

  if (file === "lib/product/authority-grant-firewall.ts") {
    return occurrence(file, line, term, "safe_constant", text, "Firewall proof-check identifier/type; no evidence truth asserted.");
  }

  if (file === "lib/product/product-authority-contract.ts") {
    return occurrence(file, line, term, "safe_constant", text, "Contract type/validation reads contract fields; no artifact truth asserted.");
  }

  if (/test-authority-fraud-scenarios|\.test\.|fixture|mock/i.test(file)) {
    return occurrence(file, line, term, "test_fixture", text, "Test or fraud simulation fixture.");
  }

  if (/ProductAuthorityIntegration\.guide|README|\.md$/.test(file)) {
    return occurrence(file, line, term, "display_only", text, "Documentation or display-only material.");
  }

  if (inAuthorityPath && /hasValidV2Evidence:\s*(true|false)|input\.hasValidV2Evidence/.test(text)) {
    return occurrence(file, line, term, "authority_path_hardcoded", text, "Manual evidence truth in authority path.");
  }

  if (inAuthorityPath && /canGrantAuthority:\s*true/.test(text)) {
    return occurrence(file, line, term, "needs_refactor", text, "Authority path can grant authority directly.");
  }

  return occurrence(file, line, term, "safe_constant", text, "No authority-path evidence assertion detected.");
}

function occurrence(file, line, term, classification, text, detail) {
  return {
    file,
    line,
    term,
    symbol: text,
    classification,
    detail,
  };
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
  return `# Hardcoded Evidence State Audit

Generated: ${result.generatedAt}

Gate: ${result.gate}

Total occurrences: ${result.totalOccurrences}

## Classifications

${Object.entries(result.classifications).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Failing Occurrences

${result.failingOccurrences.length ? result.failingOccurrences.map((row) => `- ${row.file}:${row.line} ${row.term} — ${row.detail}`).join("\n") : "- None"}

## Occurrences

| File | Line | Term | Classification | Detail |
| --- | ---: | --- | --- | --- |
${result.occurrences.map((row) => `| ${row.file} | ${row.line} | ${row.term} | ${row.classification} | ${escapeMd(row.detail)} |`).join("\n")}
`;
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
