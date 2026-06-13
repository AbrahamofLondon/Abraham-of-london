#!/usr/bin/env node
/**
 * Checkout authority coverage audit.
 *
 * Reads the estate coverage matrix and isolates paid/manual checkout products.
 * A checkout path passes only if authority state, limitation, and next evidence
 * action are visible before purchase or the product is explicitly exempt.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const matrix = readMatrix();

const rows = matrix.products
  .filter((product) => product.checkoutPath || product.checkoutPathExists || product.commercialStatus === "paid")
  .map((product) => {
    const checkoutFiles = routeFiles(product.checkoutPath);
    const checkoutText = checkoutFiles.map(read).join("\n");
    const authorityBeforePurchase = product.authorityVisiblyRendered || hasExact(checkoutText, [
      "ProductAuthority",
      "currentAuthorityState",
      "publicClaimLanguage",
      "authority state",
    ]);
    const limitationBeforePurchase = product.limitationVisiblyRendered || hasExact(checkoutText, [
      "blockingReasons",
      "limitation",
      "not currently released",
      "pending v2",
      "blocked",
      "unsupported",
    ]);
    const nextEvidenceBeforePurchase = product.nextEvidenceActionVisiblyRendered || hasExact(checkoutText, [
      "nextEvidenceAction",
      "Next evidence action",
      "next evidence",
      "next action",
    ]);
    const pass = Boolean(product.staticReferenceInternalExemption) ||
      (authorityBeforePurchase && limitationBeforePurchase && nextEvidenceBeforePurchase);
    return {
      productCode: product.productCode,
      productName: product.productName,
      checkoutPath: product.checkoutPath,
      checkoutPathExists: product.checkoutPathExists,
      currentAuthorityState: product.currentAuthorityState,
      authorityBeforePurchase,
      limitationBeforePurchase,
      nextEvidenceBeforePurchase,
      checkoutFiles,
      result: pass ? "PASS" : "FAIL",
      requiredAction: pass
        ? "Maintain checkout authority coverage."
        : "Render authority state, limitation, and next evidence action before purchase or disable checkout.",
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
writeFileSync(join(REPORTS, "checkout-authority-coverage.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "checkout-authority-coverage.md"), renderMarkdown(result));

console.log("CHECKOUT AUTHORITY COVERAGE AUDIT");
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
    ? [
        `pages/api/${clean.replace(/^\/api\//, "")}.ts`,
        `pages/api/${clean.replace(/^\/api\//, "")}/index.ts`,
        `app/api/${clean.replace(/^\/api\//, "")}/route.ts`,
      ]
    : [`pages${clean}.tsx`, `pages${clean}/index.tsx`, `app${clean}/page.tsx`];
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
  return `# Checkout Authority Coverage Audit

## Gate Result

Gate: ${report.gate}

Products audited: ${report.productsAudited}

Failures: ${report.failures}

## Results

| Product | Checkout | Authority | Limitation | Next Evidence | Result | Required Action |
| --- | --- | ---: | ---: | ---: | --- | --- |
${report.rows.map((row) => `| ${row.productCode} | ${row.checkoutPath ?? "none"} | ${yes(row.authorityBeforePurchase)} | ${yes(row.limitationBeforePurchase)} | ${yes(row.nextEvidenceBeforePurchase)} | ${row.result} | ${row.requiredAction} |`).join("\n")}
`;
}

function yes(value) {
  return value ? "yes" : "no";
}
