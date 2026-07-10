#!/usr/bin/env node
/**
 * scripts/authority-boundary-gate.mjs
 *
 * Phase 6A v2 — transitive import boundary gate.
 *
 * Walks the FULL local import graph from every governed route entrypoint
 * to detect forbidden internal authority modules at any depth.
 *
 * Route taxonomy (6 classes):
 *   ADMIN               — /admin/* paths
 *   INTERNAL_OPERATOR   — /inner-circle/admin/*, /api/admin/*, /api/internal/*
 *   PUBLIC_ACCOUNTABILITY — fixed allowlist (never a wildcard)
 *   PUBLIC_CUSTOMER     — no auth required, free access
 *   CONTROLLED_CUSTOMER — auth + entitlement check
 *   ENTITLED_CUSTOMER   — paid gating (currently none at route level)
 *
 * Enforcement: PUBLIC_CUSTOMER + CONTROLLED_CUSTOMER + ENTITLED_CUSTOMER
 * are gated. ADMIN, INTERNAL_OPERATOR, PUBLIC_ACCOUNTABILITY are exempt.
 *
 * Exit 1 on any violation.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";

const ROOT = process.cwd();

// Forbidden internal-module specifiers (regex)
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
  /lib\/product\/external-product-value-evidence/,
  /lib\/product\/generic-ai-comparison-engine/,
  /lib\/intelligence\/gmi-red-team-store/,
  /lib\/intelligence\/product-evidence-ledger/,
  /lib\/intelligence\/run-evidence-ledger/,
  /lib\/intelligence\/gmi-release-authority/,
  /lib\/intelligence\/gmi-release-store\.server/,
  /lib\/intelligence\/gmi-release-durable-resolver\.server/,
];

// Route classification
const PUBLIC_ACCOUNTABILITY = new Set([
  "pages/intelligence/gmi/red-team.tsx",
]);

const CONTROLLED_CUSTOMER_PREFIXES = [
  "pages/strategy-room",
  "pages/counsel",
  "pages/oversight",
  "pages/boardroom",
  "pages/client",
  "pages/portal",
  "pages/decision-centre/case",
  "pages/case/shared",
  "pages/report",
  "pages/retainer",
  "pages/retainers",
  "pages/return-brief",
  "pages/decision-instruments",
  "pages/diagnostics/executive-reporting/run",
  "pages/diagnostics/constitutional-diagnostic",
  "pages/diagnostics/enterprise-assessment",
  "pages/diagnostics/team-assessment",
  "pages/diagnostics/watch",
  "pages/inner-circle",
  "pages/private",
  "pages/private-clients",
  "pages/account",
  "pages/access",
  "pages/checkout",
  "pages/offers",
  "pages/premium",
  "pages/market-intelligence",
  "pages/provenance/case",
  "pages/provenance/anchor-log",
  "pages/enterprise/preview",
  "pages/kernel/signal",
  "pages/lab",
  "pages/my-instruments",
  "pages/outcome",
  "app/client",
  "app/portal",
  "app/restricted",
  "app/boardroom",
  "app/assessment",
  "app/audit",
  "app/enterprise",
  "app/strategy-room",
  "app/purpose-alignment",
  "app/settings",
  "app/account",
  "app/downloads",
  "app/foundry/case",
];

function classify(rel) {
  const p = rel.replace(/\\/g, "/");
  if (/(^|\/)admin(\/|$)/.test(p)) return "ADMIN";
  if (p.includes("inner-circle/admin")) return "INTERNAL_OPERATOR";
  if (PUBLIC_ACCOUNTABILITY.has(p)) return "PUBLIC_ACCOUNTABILITY";
  for (const prefix of CONTROLLED_CUSTOMER_PREFIXES) {
    if (p.startsWith(prefix)) return "CONTROLLED_CUSTOMER";
  }
  return "PUBLIC_CUSTOMER";
}

// Module resolution
function resolveSpec(spec, baseFile) {
  const baseDir = dirname(baseFile);
  let resolved;

  if (spec.startsWith("@/")) {
    resolved = join(ROOT, spec.slice(2));
  } else if (spec.startsWith(".")) {
    resolved = resolve(baseDir, spec);
  } else {
    return null;
  }

  for (const ext of ["", ".ts", ".tsx", ".js", ".mjs"]) {
    const candidate = resolved + ext;
    if (existsSync(candidate)) return relative(ROOT, candidate).replace(/\\/g, "/");
  }

  for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
    const candidate = join(resolved, "index" + ext);
    if (existsSync(candidate)) return relative(ROOT, candidate).replace(/\\/g, "/");
  }

  return null;
}

function extractSpecifiers(src) {
  const specs = [];
  const staticRe = /import\s+[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  let m;
  while ((m = staticRe.exec(src)) !== null) specs.push(m[1]);
  const dynamicRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRe.exec(src)) !== null) specs.push(m[1]);
  const requireRe = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = requireRe.exec(src)) !== null) specs.push(m[1]);
  return specs;
}

function walk(dir, acc) {
  let entries;
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (["node_modules", ".next", ".git", ".contentlayer"].includes(e)) continue;
      walk(full, acc);
    } else if (st.isFile()) acc.push(full);
  }
  return acc;
}

function isRenderedRoute(rel) {
  const p = rel.replace(/\\/g, "/");
  if (p.startsWith("pages/")) {
    if (p.startsWith("pages/api/")) return false;
    if (/\/_app\.|\/_document\./.test(p)) return false;
    return p.endsWith(".tsx");
  }
  if (p.startsWith("app/")) {
    if (p.startsWith("app/api/")) return false;
    return p.endsWith("/page.tsx");
  }
  return false;
}

// Main
const routeFiles = [
  ...walk(join(ROOT, "pages"), []),
  ...walk(join(ROOT, "app"), []),
]
  .map((f) => relative(ROOT, f))
  .filter(isRenderedRoute);

const byClass = {
  ADMIN: 0, INTERNAL_OPERATOR: 0, PUBLIC_ACCOUNTABILITY: 0,
  PUBLIC_CUSTOMER: 0, CONTROLLED_CUSTOMER: 0, ENTITLED_CUSTOMER: 0,
};

const GATED_CLASSES = new Set(["PUBLIC_CUSTOMER", "CONTROLLED_CUSTOMER", "ENTITLED_CUSTOMER"]);

const violations = [];
let audited = 0;
let totalImportsResolved = 0;

for (const rel of routeFiles) {
  const cls = classify(rel);
  byClass[cls]++;

  if (!GATED_CLASSES.has(cls)) continue;
  audited++;

  const queue = [rel];
  const localVisited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (localVisited.has(current)) continue;
    localVisited.add(current);

    const absPath = join(ROOT, current);
    if (!existsSync(absPath)) continue; try { if (!statSync(absPath).isFile()) continue; } catch { continue; }

    const src = readFileSync(absPath, "utf8");
    const specs = extractSpecifiers(src);

    for (const spec of specs) {
      let isForbidden = false;
      let matchedPattern = null;
      for (const bad of FORBIDDEN) {
        if (bad.test(spec)) {
          isForbidden = true;
          matchedPattern = bad;
          break;
        }
      }

      if (isForbidden) {
        violations.push({
          route: rel,
          chain: [...localVisited].slice(1),
          importSpec: spec,
          matchedPattern: matchedPattern.source,
        });
        continue;
      }

      const resolved = resolveSpec(spec, current);
      if (resolved && !localVisited.has(resolved)) {
        queue.push(resolved);
        totalImportsResolved++;
      }
    }
  }
}

console.log("--- Authority Boundary Gate (6A v2 -- transitive) ---");
console.log("Rendered routes discovered : " + routeFiles.length);
console.log("  ADMIN                  : " + byClass.ADMIN);
console.log("  INTERNAL_OPERATOR      : " + byClass.INTERNAL_OPERATOR);
console.log("  PUBLIC_ACCOUNTABILITY  : " + byClass.PUBLIC_ACCOUNTABILITY);
console.log("  PUBLIC_CUSTOMER        : " + byClass.PUBLIC_CUSTOMER);
console.log("  CONTROLLED_CUSTOMER    : " + byClass.CONTROLLED_CUSTOMER);
console.log("  ENTITLED_CUSTOMER      : " + byClass.ENTITLED_CUSTOMER);
console.log("Gated routes audited (transitive): " + audited);
console.log("Local imports resolved in graph  : " + totalImportsResolved);

if (violations.length > 0) {
  console.error("\n*** AUTHORITY BOUNDARY VIOLATIONS: " + violations.length);
  for (const v of violations) {
    console.error("  Route: " + v.route);
    if (v.chain.length > 0) console.error("    Chain: " + v.chain.join(" -> "));
    console.error("    Imports: " + v.importSpec);
    console.error("    Pattern: " + v.matchedPattern);
  }
  process.exit(1);
}

console.log("\n*** No gated route reaches a forbidden internal authority module at any depth.");
process.exit(0);
