#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const SCAN_DIRS = ["scripts", "lib", "app", "pages"];
const REPORT_PATTERNS = [/WAVE_/i, /COMPLETION_REPORT/i, /CLOSURE_REPORT/i, /readiness.*report/i, /report.*claim/i];
const AUTHORITY_PATTERNS = [/authority/i, /externally_proven/i, /diagnostic_product/i, /judgement_product/i, /gold/i, /validated/i, /proven/i];

mkdirSync(REPORTS_DIR, { recursive: true });

const files = listFiles(SCAN_DIRS, [".ts", ".tsx", ".js", ".mjs"]);
const violations = [];

for (const file of files) {
  const rel = normalize(relative(ROOT, file));
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const context = lines.slice(Math.max(0, i - 3), i + 4).join("\n");
    if (!REPORT_PATTERNS.some((pattern) => pattern.test(context))) continue;
    if (!AUTHORITY_PATTERNS.some((pattern) => pattern.test(context))) continue;
    if (/correction|audit|violation|scan|report-as-evidence|descriptive only/i.test(context)) continue;
    violations.push({
      file: rel,
      line: i + 1,
      severity: "HIGH",
      reason: "Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence.",
      context: line.trim(),
    });
  }
}

const generatedReportClaims = scanReportsForAuthorityClaims();
const result = {
  generatedAt: new Date().toISOString(),
  gate: violations.length ? "FAILED_REPORT_AS_EVIDENCE_VIOLATIONS" : "PASSED_REPORTS_DESCRIPTIVE_ONLY",
  scriptsScanned: files.length,
  violations,
  generatedReportClaims,
};

writeFileSync(join(REPORTS_DIR, "report-as-evidence-violations.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "report-as-evidence-violations.md"), renderMarkdown(result));

console.log("REPORT-AS-EVIDENCE VIOLATION CHECK");
console.log(`Gate: ${result.gate}`);
console.log(`Violations: ${violations.length}`);
console.log(`Generated report authority claims sampled: ${generatedReportClaims.length}`);
process.exit(violations.length ? 1 : 0);

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
  return `# Report-As-Evidence Violations

Generated: ${result.generatedAt}

Gate: ${result.gate}

Scripts scanned: ${result.scriptsScanned}

Violations: ${result.violations.length}

## Rule

Reports can describe evidence, but cannot themselves constitute evidence.

## Violations

| File | Line | Reason | Context |
| --- | ---: | --- | --- |
${result.violations.map((row) => `| ${row.file} | ${row.line} | ${row.reason} | ${escapeMd(row.context)} |`).join("\n") || "| None |  |  |  |"}

## Generated Report Authority Claims Sample

| File | Line | Context |
| --- | ---: | --- |
${result.generatedReportClaims.map((row) => `| ${row.file} | ${row.line} | ${escapeMd(row.context)} |`).join("\n")}
`;
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
