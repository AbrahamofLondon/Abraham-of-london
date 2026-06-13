#!/usr/bin/env node
/**
 * Admin authority coverage audit.
 *
 * Admin fulfilment and release surfaces pass only if the operator can see
 * product authority state before releasing, delivering, or approving output.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const matrix = readMatrix();

const rows = matrix.products
  .filter((product) => product.adminRoute || product.adminSurfaceExists || product.requiresAdminRelease)
  .map((product) => {
    const files = routeFiles(product.adminRoute);
    const text = files.map(read).join("\n");
    const authorityBeforeRelease = product.authorityVisiblyRendered || hasExact(text, [
      "ProductAuthority",
      "currentAuthorityState",
      "Authority state",
      "authority status",
      "resolveProductAuthority",
    ]);
    const evidenceBeforeRelease = product.evidenceStateVisiblyRendered || hasExact(text, [
      "ProductEvidenceStatus",
      "Evidence state",
      "evidenceSupportedClaim",
      "Evidence Ledger",
    ]);
    const blockingBeforeRelease = product.unsupportedClaimBlockingVisible || hasExact(text, [
      "publicClaimAllowed",
      "blockingReasons",
      "blocked",
      "pending v2",
      "unsupported",
      "not currently released",
    ]);
    const pass = Boolean(product.staticReferenceInternalExemption) ||
      !product.requiresAdminRelease ||
      (authorityBeforeRelease && evidenceBeforeRelease && blockingBeforeRelease);
    return {
      productCode: product.productCode,
      productName: product.productName,
      adminRoute: product.adminRoute,
      adminSurfaceExists: product.adminSurfaceExists,
      requiresAdminRelease: product.requiresAdminRelease,
      authorityBeforeRelease,
      evidenceBeforeRelease,
      blockingBeforeRelease,
      filesChecked: files,
      result: pass ? "PASS" : "FAIL",
      requiredAction: pass
        ? "Maintain admin release coverage."
        : "Render authority, evidence, and blocking state before admin release/delivery.",
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
writeFileSync(join(REPORTS, "admin-authority-coverage.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "admin-authority-coverage.md"), renderMarkdown(result));

console.log("ADMIN AUTHORITY COVERAGE AUDIT");
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
  const candidates = [
    `pages${clean}.tsx`,
    `pages${clean}/index.tsx`,
    `app${clean}/page.tsx`,
  ];
  const parts = clean.split("/").filter(Boolean);
  if (parts.length > 1) {
    candidates.push(`pages/${parts[0]}/${parts[1]}/[id].tsx`);
    candidates.push(`app/${parts[0]}/${parts[1]}/[id]/page.tsx`);
  }
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
  return `# Admin Authority Coverage Audit

## Gate Result

Gate: ${report.gate}

Products audited: ${report.productsAudited}

Failures: ${report.failures}

## Results

| Product | Admin Route | Release Surface | Authority | Evidence | Blocking | Result | Required Action |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${report.rows.map((row) => `| ${row.productCode} | ${row.adminRoute ?? "none"} | ${yes(row.requiresAdminRelease)} | ${yes(row.authorityBeforeRelease)} | ${yes(row.evidenceBeforeRelease)} | ${yes(row.blockingBeforeRelease)} | ${row.result} | ${row.requiredAction} |`).join("\n")}
`;
}

function yes(value) {
  return value ? "yes" : "no";
}
