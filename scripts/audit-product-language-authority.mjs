#!/usr/bin/env node
/**
 * Product language authority audit.
 *
 * Searches product-facing language for strong claims and checks whether the
 * claim appears contract-backed, evidence-conditional, market-clear, or
 * overstated relative to current wiring.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const PUBLIC_ROOTS = ["pages", "app", "components", "content", "lib/commercial", "lib/product"];
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

const TERMS = [
  "gold",
  "validated",
  "proven",
  "diagnostic",
  "judgement",
  "governed",
  "board-grade",
  "intelligence",
  "authority",
  "decision infrastructure",
  "evidence-governed",
  "market-leading",
  "premium",
  "operator-grade",
  "enterprise-grade",
];

const files = listFiles(PUBLIC_ROOTS);
const findings = [];

for (const file of files) {
  const text = read(file);
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    for (const term of TERMS) {
      if (!lower.includes(term)) continue;
      if (isNoise(line)) continue;
      findings.push(classifyClaim({ file, line: index + 1, term, content: line.trim(), fileText: text }));
    }
  });
}

const byAction = groupBy(findings, "recommendation");
const publicOverclaims = findings.filter((finding) => ["remove", "soften", "make evidence-conditional"].includes(finding.recommendation));
const gate = "PASSED_WITH_FINDINGS";
const findingsSample = findings.slice(0, 500);
const highRiskFindings = findings
  .filter((finding) => ["remove", "soften", "make evidence-conditional"].includes(finding.recommendation))
  .slice(0, 500);
const result = {
  generatedAt: new Date().toISOString(),
  gate,
  productLanguageState: publicOverclaims.length > 20 ? "credible_but_too_complex" : "strong_but_needs_clarity",
  claimsScanned: findings.length,
  publicOverclaimCount: publicOverclaims.length,
  findingsSample,
  highRiskFindings,
  summaryByRecommendation: Object.fromEntries(Object.entries(byAction).map(([key, rows]) => [key, rows.length])),
  surfaceLanguageCorrections: buildCorrections(findings),
  recommendations: [
    "Keep strong category language where the route exposes evidence, authority, falsification, and limitations.",
    "Make gold/proven/validated claims evidence-conditional and tied to ProductAuthorityContract/public evidence ledger.",
    "Translate 'Evidence-Governed Decision Infrastructure' into buyer-visible consequences on public pages.",
    "Remove or condition board-grade/operator-grade/enterprise-grade copy where the route is static or authority is not visible.",
    "Use 'currently blocked/pending proof' language on product surfaces until live route evidence supports stronger claims.",
  ],
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "product-language-authority-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "product-language-authority-audit.md"), renderMarkdown(result));

console.log("PRODUCT LANGUAGE AUTHORITY AUDIT");
console.log(`Gate: ${result.gate}`);
console.log(`Claims scanned: ${result.claimsScanned}`);
console.log(`Public overclaim count: ${result.publicOverclaimCount}`);
console.log(`Language state: ${result.productLanguageState}`);

function classifyClaim({ file, line, term, content, fileText }) {
  const contractBacked = /ProductAuthorityContract|publicClaimLanguage|currentAuthorityState|resolveProductAuthority|ProductAuthorityPanel|ProductAuthorityBadge/i.test(fileText + content);
  const evidenceBacked = /evidence ledger|product-value-evidence-ledger|externally proven|anti-toy|red-team|market comparison|caseDerivedJudgement/i.test(fileText + content);
  const isReportOrInternal = /^(reports|scripts|lib\/product|lib\/validation)\//.test(file);
  const isPublicSurface = /^(pages|app|components|content)\//.test(file);
  const strongClaim = /gold|proven|validated|market-leading|board-grade|operator-grade|enterprise-grade|premium/i.test(term);
  const categoryClaim = /decision infrastructure|evidence-governed|governed|authority|intelligence|judgement/i.test(term);
  const blockedContext = /blocked|pending|not currently|legacy|requires|does not prove|not professional advice/i.test(content);

  let recommendation = "keep";
  let rationale = "Claim appears contextual or supported enough for its file context.";

  if (strongClaim && isPublicSurface && !contractBacked && !blockedContext) {
    recommendation = evidenceBacked ? "make evidence-conditional" : "soften";
    rationale = "Strong public claim is not visibly tied to ProductAuthorityContract in the same surface.";
  }
  if (/market-leading/i.test(content)) {
    recommendation = "remove";
    rationale = "Market-leading is not currently evidenced by product authority or external benchmark dominance.";
  }
  if (categoryClaim && isPublicSurface && !/evidence|authority|falsification|decision risk|trace/i.test(content.toLowerCase())) {
    recommendation = "make customer-clearer";
    rationale = "Category language is strong but too abstract unless paired with customer-visible proof.";
  }
  if (contractBacked && evidenceBacked) {
    recommendation = "keep";
    rationale = "Claim is tied to contract/evidence language.";
  }
  if (blockedContext) {
    recommendation = "keep";
    rationale = "Claim is self-limiting or evidence-conditional.";
  }
  if (isReportOrInternal && recommendation !== "remove") {
    recommendation = "keep";
    rationale = "Internal/reporting context; keep as audit language unless surfaced publicly.";
  }

  return {
    file,
    line,
    term,
    content,
    supportedByProductAuthorityContract: contractBacked,
    supportedByEvidenceLedger: evidenceBacked,
    actualProductBehaviourVisible: /caseDerivedJudgement|AssessmentResultSurface|ProductAuthority|evidence|falsification|limitation|next/i.test(fileText),
    understandableToMarket: !/currentAuthorityState|validationHash|gateStatus|ProductAuthorityContract/.test(content),
    commerciallyUseful: /decision|risk|evidence|board|team|operator|buyer|customer|next|cost|authority/i.test(content),
    recommendation,
    rationale,
  };
}

function buildCorrections(rows) {
  return rows
    .filter((row) => ["soften", "remove", "make evidence-conditional", "make customer-clearer"].includes(row.recommendation))
    .slice(0, 80)
    .map((row) => ({
      file: row.file,
      line: row.line,
      term: row.term,
      currentLanguage: row.content,
      recommendation: row.recommendation,
      suggestedDirection: suggestionFor(row),
    }));
}

function suggestionFor(row) {
  if (row.recommendation === "remove") return "Remove the superiority claim unless an external benchmark row proves it.";
  if (row.recommendation === "make evidence-conditional") return "Tie the claim to the evidence ledger and authority state, e.g. 'externally proven where the evidence ledger shows live-route proof'.";
  if (row.recommendation === "make customer-clearer") return "Translate category language into visible buyer value: evidence state, authority state, risk, falsification trigger, and next evidence action.";
  return "Use a capability description instead of an authority claim until the route shows contract-backed evidence.";
}

function renderMarkdown(data) {
  return `# Product Language Authority Audit

## Gate Result

${data.gate}

## Product Language Result

${data.productLanguageState}

## Summary

- Claims scanned: ${data.claimsScanned}
- Public overclaim count: ${data.publicOverclaimCount}

## Recommendation Counts

${Object.entries(data.summaryByRecommendation).map(([key, count]) => `- ${key}: ${count}`).join("\n")}

## Surface Language Corrections

| File | Line | Term | Recommendation | Current Language | Suggested Direction |
|---|---:|---|---|---|---|
${data.surfaceLanguageCorrections.map((row) => `| ${row.file} | ${row.line} | ${row.term} | ${row.recommendation} | ${escapeCell(row.currentLanguage)} | ${escapeCell(row.suggestedDirection)} |`).join("\n")}

## Claim Findings

| File | Line | Term | Contract | Evidence Ledger | Behaviour Visible | Market Clear | Commercially Useful | Recommendation |
|---|---:|---|---:|---:|---:|---:|---:|---|
${data.highRiskFindings.slice(0, 250).map((row) => `| ${row.file} | ${row.line} | ${row.term} | ${yes(row.supportedByProductAuthorityContract)} | ${yes(row.supportedByEvidenceLedger)} | ${yes(row.actualProductBehaviourVisible)} | ${yes(row.understandableToMarket)} | ${yes(row.commerciallyUseful)} | ${row.recommendation} |`).join("\n")}

The JSON report keeps the first ${data.findingsSample.length} scanned findings and first ${data.highRiskFindings.length} high-risk findings. The script still scans every matching usage before computing the counts above.

## Recommendations

${data.recommendations.map((item) => `- ${item}`).join("\n")}
`;
}

function listFiles(roots) {
  const out = [];
  for (const root of roots) walk(join(ROOT, root), out);
  return out.map((file) => relative(ROOT, file).replace(/\\/g, "/"));
}

function walk(dir, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".contentlayer"].includes(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (EXT.has(ext(entry.name))) {
      out.push(join(dir, entry.name));
    }
  }
}

function read(file) {
  try {
    return readFileSync(join(ROOT, file), "utf-8");
  } catch {
    return "";
  }
}

function isNoise(line) {
  return line.trim().length < 8 ||
    /import\s|from\s+["']|type\s+|interface\s+|const\s+[A-Z_]+\s*=|className|color:|background|#[0-9a-f]{3,6}/i.test(line);
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key];
    acc[value] ??= [];
    acc[value].push(row);
    return acc;
  }, {});
}

function ext(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index);
}

function yes(value) {
  return value ? "yes" : "no";
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
