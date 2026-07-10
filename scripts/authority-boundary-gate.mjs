#!/usr/bin/env node
/**
 * scripts/authority-boundary-gate.mjs
 *
 * Phase 6A — static import boundary gate.
 *
 * Rejects public / controlled-customer RENDERED routes that import internal
 * authority modules. Admin, internal-operator, and explicitly-classified
 * public-accountability routes are allowlisted (the exemption is a fixed set,
 * never a wildcard).
 *
 * Exit 1 on any violation.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

// ── Forbidden internal-module specifiers ─────────────────────────────────────
const FORBIDDEN = [
  /components\/product\/ProductAuthority(Panel|Notice|Badge|Wrapper)/,
  /lib\/product\/resolve-product-authority/,
  /lib\/product\/product-authority-contract/,
  /lib\/product\/universal-claim-authority/,
  /lib\/product\/market-comparison-engine/,
  /lib\/product\/anti-toy-/,
  /lib\/product\/red-team-/,
  /lib\/product\/product-red-team-reviewers/,
  /lib\/product\/anti-gaming-validation-authority/,
  /lib\/product\/derived-evidence-state/,
  /lib\/product\/frozen-validation-scenarios/,
  /lib\/product\/product-qualification-backbone/,
  /lib\/intelligence\/gmi-red-team-store/,
  /lib\/intelligence\/product-evidence-ledger/,
  /lib\/intelligence\/run-evidence-ledger/,
  /lib\/intelligence\/gmi-release-authority/,
  /lib\/intelligence\/gmi-release-store\.server/,
  /lib\/intelligence\/gmi-release-durable-resolver\.server/,
];

// ── Route classification ─────────────────────────────────────────────────────
// ADMIN / INTERNAL_OPERATOR: any path segment "admin".
// PUBLIC_ACCOUNTABILITY: fixed allowlist (never a wildcard).
const PUBLIC_ACCOUNTABILITY = new Set([
  "pages/intelligence/gmi/red-team.tsx",
]);

function classify(rel) {
  const p = rel.replace(/\\/g, "/");
  if (/(^|\/)admin(\/|$)/.test(p)) return "ADMIN";
  if (PUBLIC_ACCOUNTABILITY.has(p)) return "PUBLIC_ACCOUNTABILITY";
  return "PUBLIC_CUSTOMER";
}

// ── Enumerate rendered route files ───────────────────────────────────────────
// pages/**/*.tsx  (excluding api, _app, _document) + app/**/page.tsx
function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (e === "node_modules" || e === ".next" || e === ".git") continue;
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function isRenderedRoute(rel) {
  const p = rel.replace(/\\/g, "/");
  if (p.startsWith("pages/")) {
    if (p.startsWith("pages/api/")) return false;         // API JSON covered by serialization tests
    if (/\/_app\.|\/_document\./.test(p)) return false;
    return p.endsWith(".tsx");
  }
  if (p.startsWith("app/")) {
    if (p.startsWith("app/api/")) return false;
    return p.endsWith("/page.tsx");
  }
  return false;
}

function importSpecifiers(src) {
  const specs = [];
  const re = /(?:import[\s\S]*?from|import|require\()\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) specs.push(m[1]);
  return specs;
}

const files = [
  ...walk(join(ROOT, "pages")),
  ...walk(join(ROOT, "app")),
]
  .map((f) => relative(ROOT, f))
  .filter(isRenderedRoute);

const violations = [];
let audited = 0;
const byClass = { ADMIN: 0, PUBLIC_ACCOUNTABILITY: 0, PUBLIC_CUSTOMER: 0 };

for (const rel of files) {
  const cls = classify(rel);
  byClass[cls]++;
  if (cls !== "PUBLIC_CUSTOMER") continue; // only public/customer routes are gated
  audited++;
  const src = readFileSync(join(ROOT, rel), "utf8");
  for (const spec of importSpecifiers(src)) {
    for (const bad of FORBIDDEN) {
      if (bad.test(spec)) violations.push({ route: rel, importSpec: spec });
    }
  }
}

console.log("── Authority Boundary Gate (6A) ──");
console.log(`Rendered routes discovered : ${files.length}`);
console.log(`  ADMIN / operator         : ${byClass.ADMIN}`);
console.log(`  PUBLIC_ACCOUNTABILITY    : ${byClass.PUBLIC_ACCOUNTABILITY}`);
console.log(`  PUBLIC_CUSTOMER (gated)  : ${byClass.PUBLIC_CUSTOMER}`);
console.log(`Public/customer routes audited for forbidden imports: ${audited}`);

if (violations.length > 0) {
  console.error(`\n❌ AUTHORITY BOUNDARY VIOLATIONS: ${violations.length}`);
  for (const v of violations) console.error(`  ${v.route}  imports  ${v.importSpec}`);
  process.exit(1);
}

console.log("\n✅ No public/customer route imports a forbidden internal authority module.");
process.exit(0);
