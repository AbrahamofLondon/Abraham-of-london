#!/usr/bin/env node
/**
 * scripts/visual/extract-token-blast-radius.mjs
 *
 * Phase 1 prerequisite (brief: "Before changing token definitions, produce
 * the class-mediated blast-radius inventory"). For each of the 15
 * owner-authorized tokens, inventories:
 *   - direct var(--token) usage
 *   - every Tailwind alias/class family that resolves to it (background/
 *     foreground/ring, legacy surface-*, the dead aol.* literal namespace,
 *     the correctly-wired brand.* namespace, and the convenience aliases)
 *   - Shadcn adapter status (currently NONE — app/globals.css's Shadcn
 *     block is independent OKLCH, not derived from --aol-*)
 *   - DS adapter status (currently NONE — styles/design-system.css's
 *     base :root block independently hardcodes values, not derived either)
 *   - shared component reachability breakdown (cross-referenced against
 *     component-reachability-register.json)
 *   - route family breakdown (which route classes contain direct/class
 *     consumers)
 *
 * Read-only. Requires component-reachability-register.json to exist.
 * Writes reports/visual/token-blast-radius-inventory.json and .md
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

const reachPath = join(ROOT, "reports/visual/component-reachability-register.json");
const reachability = existsSync(reachPath) ? JSON.parse(readFileSync(reachPath, "utf8")).register : {};

// Token -> { directVarName, tailwindClassPatterns: [{ family, pattern (regex source), wired }] }
const TOKENS = {
  "--aol-bg": {
    classPatterns: [
      { family: "top-level semantic", cls: "background", wired: true },
      { family: "legacy surface-* (fallback)", cls: "surface-bg", wired: true },
      { family: "brand.* (correct)", cls: "brand-obsidian", wired: true },
      { family: "convenience alias", cls: "softBlack", wired: true },
      { family: "convenience alias", cls: "obsidian", wired: true },
      { family: "aol.* (DEAD literal, does not reference var)", cls: "aol-void", wired: false },
      { family: "aol.* (DEAD literal, does not reference var)", cls: "aol-base", wired: false },
    ],
  },
  "--aol-bg-2": {
    classPatterns: [
      { family: "legacy surface-* (fallback)", cls: "surface-bg-muted", wired: true },
      { family: "brand.* (correct)", cls: "brand-obsidian-2", wired: true },
      { family: "convenience alias", cls: "deepCharcoal", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-lifted", wired: false },
    ],
  },
  "--aol-bg-3": {
    classPatterns: [
      { family: "brand.* (correct)", cls: "brand-charcoal", wired: true },
      { family: "convenience alias", cls: "charcoal", wired: true },
    ],
  },
  "--aol-panel": {
    classPatterns: [
      { family: "legacy surface-* (fallback)", cls: "surface-panel", wired: true },
      { family: "brand.* (correct)", cls: "brand-panel", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-panel", wired: false },
    ],
  },
  "--aol-panel-2": {
    classPatterns: [
      { family: "legacy surface-* (fallback)", cls: "surface-panel-alt", wired: true },
      { family: "brand.* (correct)", cls: "brand-panel-2", wired: true },
    ],
  },
  "--aol-panel-3": {
    classPatterns: [{ family: "brand.* (correct)", cls: "brand-panel-3", wired: true }],
  },
  "--aol-ink": {
    classPatterns: [
      { family: "top-level semantic", cls: "foreground", wired: true },
      { family: "legacy surface-* (fallback)", cls: "surface-text", wired: true },
      { family: "brand.* (correct)", cls: "brand-cream", wired: true },
      { family: "convenience alias", cls: "cream", wired: true },
      { family: "convenience alias", cls: "warmWhite", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-heading", wired: false },
      { family: "aol.* (DEAD literal)", cls: "aol-body", wired: false },
    ],
  },
  "--aol-ink-dim": {
    classPatterns: [
      { family: "brand.* (correct)", cls: "brand-cream-dim", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-dim", wired: false },
    ],
  },
  "--aol-ink-muted": {
    classPatterns: [
      { family: "legacy surface-* (fallback)", cls: "surface-text-muted", wired: true },
      { family: "brand.* (correct)", cls: "brand-cream-muted", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-muted", wired: false },
      { family: "aol.* (DEAD literal)", cls: "aol-faint", wired: false },
    ],
  },
  "--aol-gold": {
    classPatterns: [
      { family: "top-level semantic", cls: "ring", wired: true },
      { family: "legacy surface-* (fallback)", cls: "surface-accent", wired: true },
      { family: "brand.* (correct)", cls: "brand-gold", wired: true },
      { family: "convenience alias", cls: "softGold", wired: true },
      { family: "convenience alias", cls: "gold", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-gold", wired: false },
    ],
  },
  "--aol-gold-strong": {
    classPatterns: [
      { family: "brand.* (correct)", cls: "brand-gold-strong", wired: true },
      { family: "convenience alias", cls: "amber", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-gold-strong", wired: false },
      { family: "aol.* (DEAD literal)", cls: "aol-amber", wired: false },
    ],
  },
  "--aol-gold-soft": {
    classPatterns: [
      { family: "legacy surface-* (fallback)", cls: "surface-accent-soft", wired: true },
      { family: "brand.* (correct)", cls: "brand-gold-soft", wired: true },
      { family: "aol.* (DEAD literal)", cls: "aol-gold-soft", wired: false },
    ],
  },
  "--aol-danger": {
    classPatterns: [{ family: "brand.* (correct)", cls: "brand-danger", wired: true }],
  },
  "--aol-success": {
    classPatterns: [{ family: "brand.* (correct)", cls: "brand-success", wired: true }],
  },
  "--aol-warning": {
    classPatterns: [{ family: "brand.* (correct)", cls: "brand-warning", wired: true }],
  },
};

function escapeRegExp(v) { return v.replace(/[.*+?^${}()|[\]\\]/g, "$&"); }

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
    } else if (st.isFile() && EXTS.has(extname(e))) acc.push(full);
  }
  return acc;
}

function isRouteOrComponent(rel) {
  return rel.startsWith("pages/") || rel.startsWith("app/") || rel.startsWith("components/");
}

const files = [...walk(join(ROOT, "pages")), ...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .filter(isRouteOrComponent);

const fileContents = new Map();
for (const f of files) {
  try {
    fileContents.set(f, readFileSync(join(ROOT, f), "utf8"));
  } catch {
    /* skip */
  }
}

// CSS source files are a separate, important direct-var() consumer category
// — the router globals and the DS bridge reference --aol-* tokens directly
// in their own rule bodies (e.g. app/globals.css's link/visited states).
// These are NOT page/component/route files and must be tracked separately
// from the reachability-classified consumer breakdown above.
const CSS_SOURCES = ["styles/globals.css", "app/globals.css", "styles/design-system.css", "styles/brand-system.css"];
const cssFileContents = new Map();
for (const f of CSS_SOURCES) {
  const abs = join(ROOT, f);
  if (existsSync(abs)) cssFileContents.set(f, readFileSync(abs, "utf8"));
}

function fileCategory(rel) {
  if (rel.startsWith("pages/") || rel.startsWith("app/")) {
    if (isRouteFile(rel)) return { kind: "route", cls: classifyRoute(rel) };
    return { kind: "non-route", cls: rel.startsWith("pages/") ? "PAGES_NON_ROUTE" : "APP_NON_ROUTE" };
  }
  if (rel.startsWith("components/")) {
    const entry = reachability[rel];
    return { kind: "component", cls: entry ? entry.reachabilityClass : "UNREACHABLE" };
  }
  return { kind: "other", cls: "OTHER" };
}

const inventory = {};

for (const [token, def] of Object.entries(TOKENS)) {
  const varName = token; // e.g. --aol-bg
  const directRe = new RegExp(`var\\(${escapeRegExp(varName)}[),/ ]`, "g");

  const directConsumers = [];
  for (const [f, content] of fileContents) {
    directRe.lastIndex = 0;
    const matches = content.match(directRe);
    if (matches) directConsumers.push({ file: f, count: matches.length });
  }

  const cssDirectConsumers = [];
  for (const [f, content] of cssFileContents) {
    directRe.lastIndex = 0;
    const matches = content.match(directRe);
    if (matches) cssDirectConsumers.push({ file: f, count: matches.length });
  }

  const classResults = [];
  for (const cp of def.classPatterns) {
    // (?!-\d) excludes shade-suffixed Tailwind-default-palette forms like
    // bg-amber-500 from matching our bare convenience alias bg-amber — this
    // is the exact false-positive class found in the Phase 0 raw baseline
    // (amber: 3723 usages / 483 files, later understood to be almost
    // entirely plain Tailwind amber-400/500/etc, not this repo's alias).
    const clsRe = new RegExp(`\\b(?:text|bg|border|from|to|via|ring|fill|stroke)-${cp.cls}(?!-\\d)\\b`, "g");
    const consumers = [];
    for (const [f, content] of fileContents) {
      clsRe.lastIndex = 0;
      const matches = content.match(clsRe);
      if (matches) consumers.push({ file: f, count: matches.length });
    }
    classResults.push({
      ...cp,
      totalUsages: consumers.reduce((a, c) => a + c.count, 0),
      fileCount: consumers.length,
      consumers,
    });
  }

  // Cross-reference: file categories for ALL consumers (direct + class-mediated)
  const allConsumerFiles = new Set([
    ...directConsumers.map((c) => c.file),
    ...classResults.flatMap((cr) => cr.consumers.map((c) => c.file)),
  ]);
  const byCategory = {};
  for (const f of allConsumerFiles) {
    const cat = fileCategory(f);
    const key = `${cat.kind}:${cat.cls}`;
    byCategory[key] = (byCategory[key] || 0) + 1;
  }

  inventory[token] = {
    directVarUsage: { totalUsages: directConsumers.reduce((a, c) => a + c.count, 0), fileCount: directConsumers.length, consumers: directConsumers },
    cssSourceDirectUsage: { totalUsages: cssDirectConsumers.reduce((a, c) => a + c.count, 0), fileCount: cssDirectConsumers.length, consumers: cssDirectConsumers },
    tailwindClasses: classResults,
    shadcnAdapterStatus: "NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.",
    dsAdapterStatus: "NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.",
    totalDistinctConsumerFiles: allConsumerFiles.size,
    consumersByFileCategory: byCategory,
  };
}

writeFileSync(
  join(ROOT, "reports/visual/token-blast-radius-inventory.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), tokens: inventory }, null, 2) + "\n",
);

// Markdown summary
let md = "# Token Blast-Radius Inventory — Phase 1 Prerequisite\n\n";
md += "Produced before any token definition changes, per the Phase 1 authorization. ";
md += "For each owner-authorized token: direct `var()` usage, every Tailwind class family that resolves to it (including the dead `aol.*` literal namespace, which does NOT reference the var), Shadcn/DS adapter status (currently none exist — that's what Phase 1A/1B establishes), and consumer breakdown by file category.\n\n";

for (const [token, data] of Object.entries(inventory)) {
  md += `## \`${token}\`\n\n`;
  md += `- **Direct \`var()\` usage (pages/app/components):** ${data.directVarUsage.totalUsages} usages across ${data.directVarUsage.fileCount} files\n`;
  md += `- **Direct \`var()\` usage (CSS source files):** ${data.cssSourceDirectUsage.totalUsages} usages across ${data.cssSourceDirectUsage.fileCount} files${data.cssSourceDirectUsage.consumers.length ? " — " + data.cssSourceDirectUsage.consumers.map((c) => `${c.file} (${c.count})`).join(", ") : ""}\n`;
  md += `- **Tailwind class families:**\n`;
  for (const cr of data.tailwindClasses) {
    const wiredNote = cr.wired ? "" : " ⚠ DOES NOT REFERENCE THE VAR (dead literal)";
    md += `  - \`${cr.cls}\` (${cr.family})${wiredNote}: ${cr.totalUsages} usages / ${cr.fileCount} files\n`;
  }
  md += `- **Shadcn adapter:** ${data.shadcnAdapterStatus}\n`;
  md += `- **DS adapter:** ${data.dsAdapterStatus}\n`;
  md += `- **Total distinct consumer files:** ${data.totalDistinctConsumerFiles}\n`;
  md += `- **By file category:**\n`;
  for (const [cat, n] of Object.entries(data.consumersByFileCategory).sort((a, b) => b[1] - a[1])) {
    md += `    - ${cat}: ${n}\n`;
  }
  md += "\n";
}

writeFileSync(join(ROOT, "reports/visual/token-blast-radius-inventory.md"), md);

console.log("── Token Blast-Radius Inventory ──");
for (const [token, data] of Object.entries(inventory)) {
  console.log(`${token}: direct(components)=${data.directVarUsage.totalUsages}, direct(css)=${data.cssSourceDirectUsage.totalUsages}, classConsumerFiles=${data.totalDistinctConsumerFiles}`);
}
