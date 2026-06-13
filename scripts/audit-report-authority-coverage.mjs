#!/usr/bin/env node
/**
 * Report authority coverage audit.
 *
 * Report and dossier products pass only when authority status, evidence state,
 * limitation, and next evidence action are visible in the report surface or the
 * product is explicitly static/reference by design.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const matrix = readMatrix();

const REPORT_TYPES = new Set(["executive_report_artifact", "human_reviewed_dossier", "free_asset"]);

const rows = matrix.products
  .filter((product) => product.reportSurfaceExists || REPORT_TYPES.has(product.fulfilmentType))
  .map((product) => {
    const files = [
      ...routeFiles(product.routePath),
      ...routeFiles(product.adminRoute),
      ...referenceFiles(product.productCode),
    ];
    const text = [...new Set(files)].map(read).join("\n");
    const authorityStatusVisible = product.authorityVisiblyRendered || hasExact(text, [
      "ProductAuthority",
      "currentAuthorityState",
      "Authority state",
      "authority status",
    ]);
    const evidenceStateVisible = product.evidenceStateVisiblyRendered || hasExact(text, [
      "ProductEvidenceStatus",
      "Evidence state",
      "evidenceSupportedClaim",
      "Evidence Ledger",
    ]);
    const limitationVisible = product.limitationVisiblyRendered || hasExact(text, [
      "limitation",
      "does not prove",
      "not currently released",
      "pending v2",
      "blocked",
      "unsupported",
    ]);
    const nextEvidenceActionVisible = product.nextEvidenceActionVisiblyRendered || hasExact(text, [
      "nextEvidenceAction",
      "Next evidence action",
      "next evidence",
      "next action",
    ]);
    const exemptionConfirmedByMatrix = Boolean(product.staticReferenceInternalExemption) &&
      ["static_reference_correctly_labelled", "internal_only_exempt"].includes(product.currentCoverageClassification);
    const productSpecificExemptionVisible = exemptionConfirmedByMatrix &&
      hasExact(text, [product.productCode, product.productName, product.productCode.replaceAll("_", "-")]) &&
      hasExact(text, ["static", "reference", "case dossier", "archived", "draft", "inactive", "manual", "internal-only", "internal only"]);
    const authorityClaimLanguagePresent = hasExact(text, [
      "board-grade",
      "diagnostic authority",
      "judgement product",
      "evidence-governed intelligence",
      "externally proven",
      "market-ready intelligence",
    ]);
    const exemptionShowsBoundary = productSpecificExemptionVisible && limitationVisible;
    const exemptionPass = exemptionConfirmedByMatrix &&
      productSpecificExemptionVisible &&
      exemptionShowsBoundary &&
      !authorityClaimLanguagePresent;
    const pass = exemptionPass ||
      (authorityStatusVisible && evidenceStateVisible && limitationVisible && nextEvidenceActionVisible);
    return {
      productCode: product.productCode,
      productName: product.productName,
      fulfilmentType: product.fulfilmentType,
      routePath: product.routePath,
      authorityStatusVisible,
      evidenceStateVisible,
      limitationVisible,
      nextEvidenceActionVisible,
      staticLabelVisible: productSpecificExemptionVisible,
      exemptionConfirmedByMatrix,
      exemptionShowsBoundary,
      authorityClaimLanguagePresent,
      exemptionPass,
      filesChecked: [...new Set(files)],
      result: pass ? "PASS" : "FAIL",
      requiredAction: pass
        ? "Maintain report authority coverage."
        : "Add authority status, evidence state, limitation, and next evidence action to report/dossier output, or record a product-specific static/internal exemption with explicit boundary language.",
    };
  });

const failures = rows.filter((row) => row.result === "FAIL");
const result = {
  generatedAt: new Date().toISOString(),
  gate: failures.length === 0 ? "PASSED" : "FAILED_WITH_FINDINGS",
  productsAudited: rows.length,
  failures: failures.length,
  rows,
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "report-authority-coverage.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "report-authority-coverage.md"), renderMarkdown(result));

console.log("REPORT AUTHORITY COVERAGE AUDIT");
console.log(`Gate: ${result.gate}`);
console.log(`Products audited: ${result.productsAudited}`);
console.log(`Failures: ${result.failures}`);

function readMatrix() {
  const path = join(ROOT, "reports/product-authority-coverage-matrix.json");
  if (!existsSync(path)) throw new Error("Missing reports/product-authority-coverage-matrix.json. Run audit-product-authority-coverage first.");
  return JSON.parse(readFileSync(path, "utf8"));
}

function routeFiles(route) {
  if (!route || !route.startsWith("/")) return [];
  const clean = route.split("?")[0].replace(/\/$/, "");
  const candidates = clean.startsWith("/api/")
    ? [`pages/api/${clean.replace(/^\/api\//, "")}.ts`, `app/api/${clean.replace(/^\/api\//, "")}/route.ts`]
    : [`pages${clean}.tsx`, `pages${clean}/index.tsx`, `app${clean}/page.tsx`];
  return candidates.filter((file) => existsSync(join(ROOT, file)));
}

function referenceFiles(productCode) {
  const slug = productCode.replaceAll("_", "-");
  const candidates = [
    `pages/report/[reportId].tsx`,
    `app/client/reports/[reportId]/ClientReportClient.tsx`,
    `pages/evidence/${slug}.tsx`,
    `pages/artifacts/${slug}.tsx`,
  ];
  return candidates.filter((file) => existsSync(join(ROOT, file)));
}

function read(file) {
  try {
    return readFileSync(join(ROOT, file), "utf8");
  } catch {
    return "";
  }
}

function hasExact(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function renderMarkdown(report) {
  return `# Report Authority Coverage Audit

## Gate Result

Gate: ${report.gate}

Products audited: ${report.productsAudited}

Failures: ${report.failures}

## Results

| Product | Fulfilment Type | Authority | Evidence | Limitation | Next Evidence | Matrix Exemption | Product-Specific Label | Claim Conflict | Result | Required Action |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${report.rows.map((row) => `| ${row.productCode} | ${row.fulfilmentType} | ${yes(row.authorityStatusVisible)} | ${yes(row.evidenceStateVisible)} | ${yes(row.limitationVisible)} | ${yes(row.nextEvidenceActionVisible)} | ${yes(row.exemptionConfirmedByMatrix)} | ${yes(row.staticLabelVisible)} | ${yes(row.authorityClaimLanguagePresent)} | ${row.result} | ${row.requiredAction} |`).join("\n")}
`;
}

function yes(value) {
  return value ? "yes" : "no";
}
