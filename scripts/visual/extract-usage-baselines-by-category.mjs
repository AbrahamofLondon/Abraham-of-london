#!/usr/bin/env node
/**
 * scripts/visual/extract-usage-baselines-by-category.mjs
 *
 * Refines the flat raw-colour/tiny-type baseline into governance and
 * semantic categories, so gate:visual-raw-colour / gate:visual-type-floor
 * (Phase 2) can set category-appropriate baselines instead of one
 * undifferentiated global count (brief §13.2 explicitly requires an
 * allowlist for chart/dataviz/third-party-wrapper files — a flat count
 * can't express that distinction).
 *
 * Route files (pages/, app/) are classified with the EXACT SAME taxonomy
 * as scripts/authority-boundary-gate.mjs (ADMIN / INTERNAL_OPERATOR /
 * PUBLIC_ACCOUNTABILITY / CONTROLLED_CUSTOMER / PUBLIC_CUSTOMER) — reused,
 * not reinvented, per the "extend don't fragment" principle.
 * components/ files don't have a single route classification (shared
 * across route classes), so they get their own bucket, further split into
 * a heuristic "likely chart/dataviz" sub-bucket by path/name pattern.
 *
 * Read-only. Writes reports/visual/raw-colour-baseline-by-category.json
 * and reports/visual/type-floor-baseline-by-category.json.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

// ── Route classifier — copied verbatim from authority-boundary-gate.mjs ───
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

const CHART_HEURISTIC_RE = /chart|graph|sparkline|dataviz|data-viz|visuali[sz]ation|heatmap|dashboard.*chart|radar|gauge/i;

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

function isRouteFile(rel) {
  if (rel.startsWith("pages/")) return rel.endsWith(".tsx") && !rel.startsWith("pages/api/") && !/\/_app\.|\/_document\./.test(rel);
  if (rel.startsWith("app/")) return rel.endsWith("/page.tsx") || rel.endsWith("/layout.tsx");
  return false;
}

function categoryFor(rel) {
  if (rel.startsWith("pages/") || rel.startsWith("app/")) {
    if (isRouteFile(rel)) return classifyRoute(rel);
    return rel.startsWith("pages/") ? "PAGES_NON_ROUTE" : "APP_NON_ROUTE"; // e.g. _app.tsx, api/, non-page app files
  }
  if (rel.startsWith("components/")) {
    return CHART_HEURISTIC_RE.test(rel) ? "COMPONENT_CHART_DATAVIZ_CANDIDATE" : "COMPONENT_SHARED";
  }
  return "OTHER";
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
  join(ROOT, "reports/visual/raw-colour-baseline-by-category.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), filesScanned: files.length, byCategory: colourByCategory }, null, 2) + "\n",
);
writeFileSync(
  join(ROOT, "reports/visual/type-floor-baseline-by-category.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), filesScanned: files.length, floorPx: 11, byCategory: typeByCategory }, null, 2) + "\n",
);

console.log("── Usage Baselines by Governance Category ──");
console.log("\nRaw colour (hex + rgb) by category:");
for (const [cat, d] of Object.entries(colourByCategory).sort((a, b) => (b[1].hex + b[1].rgb) - (a[1].hex + a[1].rgb))) {
  console.log(`  ${cat}: hex=${d.hex} rgb=${d.rgb} files=${d.files}`);
}
console.log("\nTiny type (<11px) by category:");
for (const [cat, d] of Object.entries(typeByCategory).sort((a, b) => b[1].violations - a[1].violations)) {
  console.log(`  ${cat}: violations=${d.violations} files=${d.files}`);
}
