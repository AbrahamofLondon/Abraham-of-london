#!/usr/bin/env node
/**
 * scripts/visual/extract-duplicate-selectors.mjs
 *
 * Phase 0 baseline tool. For a known list of class selectors defined in
 * multiple global CSS systems, records every definition (file/line/rule
 * body) and every consumer (component/page importing/using the class),
 * plus which router's stylesheet actually loads each definition.
 *
 * Read-only. Writes reports/visual/duplicate-selector-register.json
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const SELECTORS = [
  "city-gate-card",
  "architecture-card",
  "nav-pill-premium",
  "aol-grain",
  "aol-grain-overlay",
  "hairline-premium",
  "hairline-gold",
  "forensic-trace",
  "aol-mdx-content",
];

const CSS_SOURCES = [
  "styles/globals.css",
  "app/globals.css",
  "styles/design-system.css",
  "styles/brand-system.css",
];

// Which global stylesheet each router actually loads (established in prior audit).
const ROUTER_LOAD_MAP = {
  "styles/globals.css": "Pages Router (via pages/_app.tsx)",
  "app/globals.css": "App Router (via app/layout.tsx)",
  "styles/design-system.css": "Pages Router only (via pages/_app.tsx) — NOT loaded by App Router",
  "styles/brand-system.css": "Neither router — not imported anywhere",
};

function findRuleBody(src, className) {
  // Matches .className { ... } — first-level brace matching, not nested-aware,
  // sufficient for these flat utility-style rule definitions.
  const re = new RegExp(`\\.${className.replace(/[-]/g, "\\-")}\\s*\\{`, "g");
  const results = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const start = m.index;
    const lineNo = src.slice(0, start).split("\n").length;
    const braceStart = src.indexOf("{", start);
    let depth = 1;
    let i = braceStart + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
    results.push({ line: lineNo, body: src.slice(braceStart, i).trim() });
  }
  return results;
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
    } else if (st.isFile() && /\.(tsx|ts|jsx|js)$/.test(e)) {
      acc.push(full);
    }
  }
  return acc;
}

const consumerFiles = [
  ...walk(join(ROOT, "pages")),
  ...walk(join(ROOT, "app")),
  ...walk(join(ROOT, "components")),
];

const register = {};

for (const selector of SELECTORS) {
  const definitions = [];
  for (const src of CSS_SOURCES) {
    const abs = join(ROOT, src);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, "utf8");
    const rules = findRuleBody(content, selector);
    for (const r of rules) {
      definitions.push({
        file: src,
        line: r.line,
        loadedBy: ROUTER_LOAD_MAP[src] ?? "unknown",
        ruleBodyPreview: r.body.slice(0, 200).replace(/\s+/g, " "),
      });
    }
  }

  const consumers = [];
  for (const file of consumerFiles) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (content.includes(selector)) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const lineNo = content.split("\n").findIndex((l) => l.includes(selector)) + 1;
      consumers.push({ file: rel, line: lineNo });
    }
  }

  register[selector] = {
    definitionCount: definitions.length,
    definitions,
    consumerCount: consumers.length,
    consumers,
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  selectorsScanned: SELECTORS,
  cssSourcesScanned: CSS_SOURCES,
  routerLoadMap: ROUTER_LOAD_MAP,
  register,
};

const { writeFileSync } = await import("node:fs");
writeFileSync(
  join(ROOT, "reports/visual/duplicate-selector-register.json"),
  JSON.stringify(out, null, 2) + "\n",
);

console.log("── Duplicate Selector Inventory ──");
for (const [selector, data] of Object.entries(register)) {
  console.log(`${selector}: ${data.definitionCount} definition(s), ${data.consumerCount} consumer(s)`);
  if (data.definitionCount > 1) {
    console.log(`  ⚠ defined in ${new Set(data.definitions.map((d) => d.file)).size} file(s)`);
  }
}
