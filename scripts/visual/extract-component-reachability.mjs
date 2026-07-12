#!/usr/bin/env node
/**
 * scripts/visual/extract-component-reachability.mjs
 *
 * Phase 0 closure item: route classification alone (directory location)
 * can't correctly categorise a shared component — components/Button.tsx
 * might be imported by a PUBLIC_CUSTOMER route, an ADMIN route, and a
 * CONTROLLED_CUSTOMER route simultaneously. This walks the real transitive
 * import graph from every route entrypoint (same resolution logic as
 * scripts/authority-boundary-gate.mjs) and, for each component file,
 * records the SET of route classes that can actually reach it.
 *
 * Reachability classes (priority order — public wins if any path reaches it):
 *   SHARED_PUBLIC_REACHABLE      — reachable from >=1 PUBLIC_CUSTOMER or
 *                                   PUBLIC_ACCOUNTABILITY route
 *   SHARED_CONTROLLED_REACHABLE  — reachable from CONTROLLED_CUSTOMER routes,
 *                                   but never from a public route
 *   ADMIN_ONLY                   — reachable only from ADMIN routes
 *   INTERNAL_ONLY                — reachable only from INTERNAL_OPERATOR routes
 *   UNREACHABLE                  — not reached by any route file transitively
 *                                   (dead code from this analysis's viewpoint,
 *                                   or reached only via non-route entry points)
 *
 * Read-only. Writes reports/visual/component-reachability-register.json
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative, dirname, resolve, extname } from "node:path";

const ROOT = process.cwd();

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

function extractSpecifiers(src) {
  const specs = [];
  const staticRe = /import\s+[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  let m;
  while ((m = staticRe.exec(src)) !== null) specs.push(m[1]);
  const sideEffectRe = /import\s*["']([^"']+)["']\s*;/g;
  while ((m = sideEffectRe.exec(src)) !== null) specs.push(m[1]);
  const exportFromRe = /export\s+(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?)\s+from\s+["']([^"']+)["']/g;
  while ((m = exportFromRe.exec(src)) !== null) specs.push(m[1]);
  const dynamicRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRe.exec(src)) !== null) specs.push(m[1]);
  return specs;
}

function resolveSpec(spec, baseFile) {
  const baseDir = dirname(baseFile);
  let resolved;
  if (spec.startsWith("@/")) resolved = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) resolved = resolve(baseDir, spec);
  else return null;
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

const routeFiles = [...walk(join(ROOT, "pages")), ...walk(join(ROOT, "app"))]
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .filter(isRenderedRoute);

// componentFile -> Set of route classes that reach it
const reachedBy = new Map();

for (const route of routeFiles) {
  const cls = classifyRoute(route);
  const queue = [route];
  const visited = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const abs = join(ROOT, current);
    if (!existsSync(abs)) continue;
    let src;
    try {
      src = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const spec of extractSpecifiers(src)) {
      const resolved = resolveSpec(spec, current);
      if (!resolved || visited.has(resolved)) continue;
      queue.push(resolved);
      if (resolved.startsWith("components/")) {
        if (!reachedBy.has(resolved)) reachedBy.set(resolved, new Set());
        reachedBy.get(resolved).add(cls);
      }
    }
  }
}

// Every components/ file, including unreached ones
const allComponentFiles = walk(join(ROOT, "components"))
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .filter((f) => /\.(tsx|ts|jsx|js)$/.test(f));

function reachabilityClass(classes) {
  if (!classes || classes.size === 0) return "UNREACHABLE";
  if (classes.has("PUBLIC_CUSTOMER") || classes.has("PUBLIC_ACCOUNTABILITY")) return "SHARED_PUBLIC_REACHABLE";
  if (classes.has("CONTROLLED_CUSTOMER")) return "SHARED_CONTROLLED_REACHABLE";
  if (classes.has("ADMIN")) return "ADMIN_ONLY";
  if (classes.has("INTERNAL_OPERATOR")) return "INTERNAL_ONLY";
  return "UNREACHABLE";
}

const register = {};
const counts = {};
for (const file of allComponentFiles) {
  const classes = reachedBy.get(file);
  const rc = reachabilityClass(classes);
  register[file] = { reachabilityClass: rc, reachedByRouteClasses: classes ? [...classes] : [] };
  counts[rc] = (counts[rc] || 0) + 1;
}

writeFileSync(
  join(ROOT, "reports/visual/component-reachability-register.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      routeFilesWalked: routeFiles.length,
      componentFilesTotal: allComponentFiles.length,
      countsByReachabilityClass: counts,
      register,
    },
    null,
    2,
  ) + "\n",
);

console.log("── Component Reachability Analysis ──");
console.log(`Route files walked: ${routeFiles.length}`);
console.log(`Component files total: ${allComponentFiles.length}`);
for (const [cls, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cls}: ${n}`);
}
