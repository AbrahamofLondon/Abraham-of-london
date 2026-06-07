#!/usr/bin/env node
/**
 * Product Estate Reality Audit
 *
 * Static inventory of commercial, route, runtime, test, and authority evidence.
 * This script intentionally does not call production or mutate the database.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const JSON_MODE = process.argv.includes("--json");
const MARKDOWN_MODE = process.argv.includes("--markdown");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf-8"));
}

function readText(relativePath) {
  const full = join(ROOT, relativePath);
  return existsSync(full) ? readFileSync(full, "utf-8") : "";
}

function walk(dir, matcher = () => true) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return [];
  const out = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const child = join(full, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".contentlayer"].includes(entry.name)) continue;
      out.push(...walk(child.slice(ROOT.length + 1), matcher));
    } else if (matcher(child)) {
      out.push(child);
    }
  }
  return out;
}

function toPosix(relativePath) {
  return relativePath.split(sep).join("/");
}

function routeToCandidates(route, mode = "page") {
  const pathname = route.split("?")[0].replace(/\/$/, "") || "/";
  const parts = pathname.split("/").filter(Boolean);
  const file = parts.length === 0 ? "index" : parts[parts.length - 1];
  const dir = parts.slice(0, -1).join("/");
  const pagesBase = dir ? `pages/${dir}/${file}` : `pages/${file}`;
  const appBase = parts.length === 0 ? "app" : `app/${parts.join("/")}`;
  if (mode === "api") {
    const apiBase = parts.join("/");
    return [
      `pages/${apiBase}.ts`,
      `pages/${apiBase}.tsx`,
      `pages/${apiBase}/index.ts`,
      `app/${apiBase}/route.ts`,
      `app/${apiBase}/route.tsx`,
    ];
  }
  return [
    `${pagesBase}.tsx`,
    `${pagesBase}.ts`,
    `${pagesBase}/index.tsx`,
    `${pagesBase}/index.ts`,
    `${appBase}/page.tsx`,
    `${appBase}/page.ts`,
  ];
}

function routeExists(route, mode = "page") {
  if (!route || route.includes("*")) return false;
  if (route.includes("[") || route.includes("]")) return true;
  return routeToCandidates(route, mode).some((candidate) => existsSync(join(ROOT, candidate)));
}

function parseCatalogProducts() {
  const text = readText("lib/commercial/catalog.ts");
  const matches = [...text.matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*\{\s*\n\s*code:\s*["']([^"']+)["']/gm)];
  return matches.map((match) => match[2]).sort();
}

function parsePrismaModels() {
  const text = readText("prisma/schema.prisma");
  return [...text.matchAll(/^model\s+([A-Za-z0-9_]+)/gm)].map((match) => match[1]).sort();
}

function testsForProduct(product) {
  const tests = walk("tests", (file) => [".ts", ".tsx", ".js", ".jsx"].includes(extname(file)));
  const haystacks = tests.map((file) => {
    const relative = toPosix(file.slice(ROOT.length + 1));
    return { relative, text: readFileSync(file, "utf-8") };
  });
  const needles = [product.productCode, product.route, product.productName]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return haystacks
    .filter(({ relative, text }) => {
      const haystack = `${relative}\n${text}`.toLowerCase();
      return needles.some((needle) => haystack.includes(needle));
    })
    .map(({ relative }) => relative)
    .slice(0, 12);
}

const audit = readJson("lib/product/product-estate-reality-audit.json");
const catalogProducts = parseCatalogProducts();
const prismaModels = parsePrismaModels();

const products = audit.products.map((product) => {
  const routeStatus = routeExists(product.route) ? "PASS" : "FAIL";
  const apiStatus = (product.apiRoutes ?? []).map((route) => ({
    route,
    status: route.includes("*") ? "NEEDS_MANUAL_CHECK" : routeExists(route, "api") ? "PASS" : "FAIL",
  }));
  const adminStatus = (product.adminRoutes ?? []).map((route) => ({
    route,
    status: routeExists(route) ? "PASS" : "FAIL",
  }));
  const dbModelStatus = (product.dbModelsUsed ?? []).map((model) => ({
    model,
    status: prismaModels.includes(model) ? "PASS" : "FAIL",
  }));

  return {
    ...product,
    catalogPresent: catalogProducts.includes(product.productCode),
    routeStatus,
    apiStatus,
    adminStatus,
    dbModelStatus,
    testsCoveringIt: Array.from(new Set([...(product.testsCoveringIt ?? []), ...testsForProduct(product)])),
  };
});

const summary = {
  productCount: products.length,
  verifiedActive: products.filter((p) => p.classification === "VERIFIED_ACTIVE").length,
  activeButUnverified: products.filter((p) => p.classification === "ACTIVE_BUT_UNVERIFIED").length,
  runtimeRiskFindings: audit.crossCuttingFindings.filter((finding) => finding.classification === "STATIC_OR_FAKE_RUNTIME").length,
  routeFailures: products.filter((p) => p.routeStatus === "FAIL").map((p) => p.productCode),
  averageRealityGrade: Number((products.reduce((sum, p) => sum + p.realityGrade, 0) / products.length).toFixed(1)),
};

const report = {
  generatedAt: new Date().toISOString(),
  version: audit.version,
  standard: audit.standard,
  quarterlyEditionPolicy: audit.quarterlyEditionPolicy,
  summary,
  ladder: audit.ladder,
  products,
  crossCuttingFindings: audit.crossCuttingFindings,
};

// ─── Authority dimension fail-below check ─────────────────────────────────────

// Updated 2026-06-07: decision_instruments 9/10 (1 FAIL: commercial catalog duplication)
// retainer_oversight 9/10 (0 FAIL: all dims PASS, 1 PARTIAL: evidence_input automation)
const AUTHORITY_DIMENSION_SCORES = {
  decision_pressure_signal: { FAIL: 1, PARTIAL: 3 },
  boardroom_brief:          { FAIL: 0, PARTIAL: 2 },   // market_authority PARTIAL (smoke gate)
  strategy_room:            { FAIL: 0, PARTIAL: 1 },
  executive_reporting:      { FAIL: 0, PARTIAL: 1 },
  decision_instruments:     { FAIL: 1, PARTIAL: 1 },   // commercial FAIL; market_authority PARTIAL
  professional:             { FAIL: 0, PARTIAL: 1 },
  retainer_oversight:       { FAIL: 0, PARTIAL: 1 },   // evidence_input PARTIAL (threshold automation)
  inner_circle:             { FAIL: 0, PARTIAL: 4 },
  gmi_quarterly:            { FAIL: 0, PARTIAL: 2 },
  briefs_vault_editorial:   { FAIL: 0, PARTIAL: 1 },
}

const FAIL_BELOW_FLAG = process.argv.find((a) => a.startsWith("--fail-below"))
const FAIL_BELOW_THRESHOLD = FAIL_BELOW_FLAG
  ? parseInt(FAIL_BELOW_FLAG.includes("=") ? FAIL_BELOW_FLAG.split("=")[1] : (process.argv[process.argv.indexOf(FAIL_BELOW_FLAG) + 1] ?? "9"), 10)
  : null

if (MARKDOWN_MODE) {
  console.log(`# Product Estate Reality Audit\n`);
  console.log(`Generated: ${report.generatedAt}\n`);
  console.log(`Standard: ${report.standard}\n`);
  console.log(`Quarterly edition policy: ${report.quarterlyEditionPolicy}\n`);
  console.log(`## Summary\n`);
  for (const [key, value] of Object.entries(summary)) {
    console.log(`- ${key}: ${Array.isArray(value) ? value.join(", ") || "none" : value}`);
  }
  console.log(`\n## Products\n`);
  for (const product of products) {
    console.log(`### ${product.productName}`);
    console.log(`- code: ${product.productCode}`);
    console.log(`- classification: ${product.classification}`);
    console.log(`- grade: ${product.realityGrade}/10`);
    console.log(`- route: ${product.route} (${product.routeStatus})`);
    console.log(`- runtime truth: ${product.runtimeTruth}`);
    console.log(`- blockers: ${product.knownBlockers.length ? product.knownBlockers.join("; ") : "none"}`);
    console.log("");
  }
} else if (JSON_MODE) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Product Estate Reality Audit");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Products: ${summary.productCount}`);
  console.log(`Average grade: ${summary.averageRealityGrade}/10`);
  console.log(`Runtime risk findings: ${summary.runtimeRiskFindings}`);
  console.log("");
  for (const product of products) {
    console.log(`${product.realityGrade}/10 ${product.classification.padEnd(38)} ${product.productCode} -> ${product.route} [${product.routeStatus}]`);
  }
  console.log("");
  console.log("Use --json or --markdown for full output.");
}

// ─── Exit code ────────────────────────────────────────────────────────────────

if (FAIL_BELOW_THRESHOLD !== null) {
  const below = products.filter((p) => p.realityGrade < FAIL_BELOW_THRESHOLD)
  if (below.length > 0) {
    if (!JSON_MODE && !MARKDOWN_MODE) {
      console.error(`\nAUDIT FAILED: ${below.length} product(s) below grade ${FAIL_BELOW_THRESHOLD}:`)
      for (const b of below) {
        console.error(`  - ${b.productCode} (grade ${b.realityGrade})`)
      }
    }
    process.exit(1)
  }
}
