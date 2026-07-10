#!/usr/bin/env node
/**
 * scripts/authority-dom-vocabulary-scan.mjs
 *
 * Phase 6C — rendered-vocabulary leak scan.
 *
 * Scans customer rendered routes for internal authority vocabulary that must
 * never appear in customer-visible text. Admin / internal-operator routes and
 * the fixed PUBLIC_ACCOUNTABILITY allowlist are excluded.
 *
 * Two modes:
 *   (default)   scan route SOURCE files (JSX/string literals)
 *   --built     scan built static HTML under .next/server/pages (true rendered DOM)
 *
 * Emits: route | phrase | classification | result. Exit 1 on any leak.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const BUILT = process.argv.includes("--built");

// Internal vocabulary that must not reach a customer surface.
const FORBIDDEN_PHRASES = [
  "Missing evidence ledger entry",
  "product_evidence_object",
  "evidence_ledger_inventory_record",
  "generic_ai_comparison_source",
  "market_comparison_source",
  "anti_toy_validation",
  "red_team_validation",
  "Full validation chain not complete",
  "Canonical evidence location",
  "Legacy Authority",
  "v2 revalidation",
];

const PUBLIC_ACCOUNTABILITY = new Set([
  "pages/intelligence/gmi/red-team.tsx",
]);

function classify(rel) {
  const p = rel.replace(/\\/g, "/");
  if (/(^|\/)admin(\/|$)/.test(p)) return "ADMIN";
  if (PUBLIC_ACCOUNTABILITY.has(p)) return "PUBLIC_ACCOUNTABILITY";
  return "PUBLIC_CUSTOMER";
}

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (["node_modules", ".git"].includes(e)) continue;
      walk(full, acc);
    } else acc.push(full);
  }
  return acc;
}

function sourceRoutes() {
  return [...walk(join(ROOT, "pages")), ...walk(join(ROOT, "app"))]
    .map((f) => relative(ROOT, f))
    .filter((p) => {
      const s = p.replace(/\\/g, "/");
      if (s.startsWith("pages/api/") || s.startsWith("app/api/")) return false;
      if (/\/_app\.|\/_document\./.test(s)) return false;
      if (s.startsWith("pages/")) return s.endsWith(".tsx");
      if (s.startsWith("app/")) return s.endsWith("/page.tsx");
      return false;
    });
}

function builtRoutes() {
  const dir = join(ROOT, ".next", "server", "pages");
  if (!existsSync(dir)) {
    console.error("❌ --built requested but .next/server/pages not found; run `npm run build` first.");
    process.exit(2);
  }
  return walk(dir).map((f) => relative(ROOT, f)).filter((p) => p.endsWith(".html"));
}

const routes = BUILT ? builtRoutes() : sourceRoutes();
const findings = [];
let scanned = 0;

for (const rel of routes) {
  const cls = BUILT ? "PUBLIC_CUSTOMER" : classify(rel);
  if (!BUILT && cls !== "PUBLIC_CUSTOMER") continue;
  // Built HTML: skip admin html paths.
  if (BUILT && /(^|\/|\\)admin(\/|\\|$)/.test(rel)) continue;
  scanned++;
  const text = readFileSync(join(ROOT, rel), "utf8");
  for (const phrase of FORBIDDEN_PHRASES) {
    if (text.includes(phrase)) {
      findings.push({ route: rel, phrase, classification: cls, result: "FORBIDDEN" });
    }
  }
}

console.log(`── Authority DOM Vocabulary Scan (6C) [${BUILT ? "built HTML" : "source"}] ──`);
console.log(`routes scanned: ${scanned}`);
if (findings.length > 0) {
  console.error(`\n❌ LEAKS: ${findings.length}`);
  console.error("route | visible phrase | classification | result");
  for (const f of findings) console.error(`${f.route} | ${f.phrase} | ${f.classification} | ${f.result}`);
  process.exit(1);
}
console.log("✅ No internal authority vocabulary found on customer routes.");
process.exit(0);
