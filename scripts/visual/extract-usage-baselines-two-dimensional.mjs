#!/usr/bin/env node
/**
 * scripts/visual/extract-usage-baselines-two-dimensional.mjs
 *
 * Phase 0 closure refinement: combines FILE OWNERSHIP CLASS (route
 * taxonomy, for pages/app files) with REACHABILITY CLASS (import-graph
 * analysis, for components/ files — see
 * component-reachability-register.json) into a single baseline, per the
 * closure review's point that directory location alone can't categorise a
 * shared component correctly.
 *
 * Read-only (requires component-reachability-register.json to already
 * exist — run extract-component-reachability.mjs first).
 * Writes reports/visual/raw-colour-baseline-two-dimensional.json and
 * reports/visual/type-floor-baseline-two-dimensional.json.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

const PUBLIC_ACCOUNTABILITY = new Set(["pages/intelligence/gmi/red-team.tsx"]);
const CONTROLLED_CUSTOMER_PREFIXES = [
  "pages/strategy-room", "pages/counsel", "pages/oversight", "pages/boardroom",
  "pages/client", "pages/portal", "pages/decision-centre/case", "pages/case/shared",
  "pages/report", "pages/retainer", "pages/retainers", "pages/return-brief",
  "pages/decision-instruments", "pages/diagnostics/executive-reporting/run",
  "pages/diagnostics/constitutional-diagnostic", "pages/diagnostics/enterprise-assessment",
  "pages/diagnostics/team-assessment", "pages/diagnostics/watch", "pages/inner-circle",
  "pages/private", "pages/private-clients", "pages/account", "pages/access",
  "pages/checkout", "pages/offers", "pages/premium", "pages/market-intelligence",
  "pages/provenance/case", "pages/provenance/anchor-log", "pages/enterprise/preview",
  "pages/kernel/signal", "pages/lab", "pages/my-instruments", "pages/outcome",
  "app/client", "app/portal", "app/restricted", "app/boardroom", "app/assessment",
  "app/audit", "app/enterprise", "app/strategy-room", "app/purpose-alignment",
  "app/settings", "app/account", "app/downloads", "app/foundry/case",
];
function classifyRoute(rel) {
  const p = rel.replace(/\\/g, "/");
  if (/(^|\/)admin(\/|$)/.test(p)) return "ADMIN";
  if (p.includes("inner-circle/admin")) return "INTERNAL_OPERATOR";
  if (PUBLIC_ACCOUNTABILITY.has(p)) return "PUBLIC_ACCOUNTABILITY";
  for (const prefix of CONTROLLED_CUSTOMER_PREFIXES) {
    if (p.startsWith(prefix)) return "CONTROLLED_CUSTOMER";
  }
  return "PUBLIC_CUSTOMER";
}
function isRouteFile(rel) {
  if (rel.startsWith("pages/")) return rel.endsWith(".tsx") && !rel.startsWith("pages/api/") && !/\/_app\.|\/_document\./.test(rel);
  if (rel.startsWith("app/")) return rel.endsWith("/page.tsx") || rel.endsWith("/layout.tsx");
  return false;
}

const reachabilityRegisterPath = join(ROOT, "reports/visual/component-reachability-register.json");
if (!existsSync(reachabilityRegisterPath)) {
  console.error("component-reachability-register.json not found — run extract-component-reachability.mjs first.");
  process.exit(1);
}
const reachability = JSON.parse(readFileSync(reachabilityRegisterPath, "utf8")).register;

function categoryFor(rel) {
  if (rel.startsWith("pages/") || rel.startsWith("app/")) {
    if (isRouteFile(rel)) return classifyRoute(rel); // FILE OWNERSHIP CLASS
    return rel.startsWith("pages/") ? "PAGES_NON_ROUTE" : "APP_NON_ROUTE";
  }
  if (rel.startsWith("components/")) {
    const entry = reachability[rel];
    return entry ? entry.reachabilityClass : "UNREACHABLE"; // REACHABILITY CLASS
  }
  return "OTHER";
}

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (["node_modules", ".next", ".git", ".contentlayer"].includes(e)) continue;
      walk(full, acc);
    } else if (st.isFile() && EXTS.has(extname(e))) {
      acc.push(full);
    }
  }
  return acc;
}

const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
const rgbRe = /\brgba?\([^)]+\)/g;
const tinyTypeRe = /fontSize:\s*["']?(\d(?:\.\d)?)(px)?["']?/g;

const files = [...walk(join(ROOT, "pages")), ...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))];

const colourByCategory = {};
const typeByCategory = {};

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const cat = categoryFor(rel);

  const hexMatches = content.match(hexRe) || [];
  const rgbMatches = content.match(rgbRe) || [];
  if (hexMatches.length || rgbMatches.length) {
    colourByCategory[cat] ??= { hex: 0, rgb: 0, files: 0 };
    colourByCategory[cat].hex += hexMatches.length;
    colourByCategory[cat].rgb += rgbMatches.length;
    colourByCategory[cat].files += 1;
  }

  let tinyCount = 0;
  tinyTypeRe.lastIndex = 0;
  let m;
  while ((m = tinyTypeRe.exec(content)) !== null) {
    if (parseFloat(m[1]) < 11) tinyCount++;
  }
  if (tinyCount > 0) {
    typeByCategory[cat] ??= { violations: 0, files: 0 };
    typeByCategory[cat].violations += tinyCount;
    typeByCategory[cat].files += 1;
  }
}

writeFileSync(
  join(ROOT, "reports/visual/raw-colour-baseline-two-dimensional.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      dimensions: "pages/app files: FILE OWNERSHIP CLASS (route taxonomy). components/ files: REACHABILITY CLASS (import-graph analysis, not directory location).",
      filesScanned: files.length,
      byCategory: colourByCategory,
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  join(ROOT, "reports/visual/type-floor-baseline-two-dimensional.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      dimensions: "pages/app files: FILE OWNERSHIP CLASS (route taxonomy). components/ files: REACHABILITY CLASS (import-graph analysis, not directory location).",
      floorPx: 11,
      filesScanned: files.length,
      byCategory: typeByCategory,
    },
    null,
    2,
  ) + "\n",
);

console.log("── Two-Dimensional Usage Baseline (ownership + reachability) ──");
console.log("\nRaw colour by category:");
for (const [cat, d] of Object.entries(colourByCategory).sort((a, b) => (b[1].hex + b[1].rgb) - (a[1].hex + a[1].rgb))) {
  console.log(`  ${cat}: hex=${d.hex} rgb=${d.rgb} files=${d.files}`);
}
console.log("\nTiny type (<11px) by category:");
for (const [cat, d] of Object.entries(typeByCategory).sort((a, b) => b[1].violations - a[1].violations)) {
  console.log(`  ${cat}: violations=${d.violations} files=${d.files}`);
}
