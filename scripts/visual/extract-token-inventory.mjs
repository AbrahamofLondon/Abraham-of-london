#!/usr/bin/env node
/**
 * scripts/visual/extract-token-inventory.mjs
 *
 * Phase 0 baseline tool. Extracts every CSS custom-property definition from
 * the known token source files, plus the Tailwind color namespace and the
 * TS token files' exported color constants, and cross-references them into
 * a duplicate/conflict register.
 *
 * Read-only. Writes:
 *   reports/visual/token-ownership-matrix.csv
 *   reports/visual/token-conflict-register.json
 *
 * Usage: node scripts/visual/extract-token-inventory.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const CSS_SOURCES = [
  "styles/globals.css",
  "app/globals.css",
  "styles/design-system.css",
  "styles/brand-system.css",
];

function extractCssVars(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return [];
  const src = readFileSync(abs, "utf8");
  const lines = src.split("\n");
  const results = [];
  const re = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/;
  lines.forEach((line, i) => {
    const m = line.match(re);
    if (m) {
      results.push({ file: relPath, line: i + 1, name: m[1], value: m[2].trim() });
    }
  });
  return results;
}

function extractTsColorConstants(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return [];
  const src = readFileSync(abs, "utf8");
  const lines = src.split("\n");
  const results = [];
  // Matches: key: "#hex" or key: '#hex' — simple leaf color assignments.
  const re = /^\s*([a-zA-Z0-9_]+)\s*:\s*["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))["']/;
  lines.forEach((line, i) => {
    const m = line.match(re);
    if (m) {
      results.push({ file: relPath, line: i + 1, name: m[1], value: m[2] });
    }
  });
  return results;
}

// ── CSS custom properties ────────────────────────────────────────────────
const allCssVars = CSS_SOURCES.flatMap(extractCssVars);

// Group by variable name across files
const byName = new Map();
for (const v of allCssVars) {
  if (!byName.has(v.name)) byName.set(v.name, []);
  byName.get(v.name).push(v);
}

const conflicts = [];
const scopedVariants = [];
const duplicatesSameValue = [];
for (const [name, defs] of byName.entries()) {
  if (defs.length < 2) continue;
  const distinctValues = new Set(defs.map((d) => d.value.replace(/\s+/g, " ").trim()));
  if (distinctValues.size > 1) {
    const distinctFiles = new Set(defs.map((d) => d.file));
    if (distinctFiles.size > 1) {
      // Different values across different source files under (likely) global
      // :root scope — this is a genuine cross-router/cross-source conflict.
      conflicts.push({ name, definitions: defs, kind: "CROSS_FILE_CONFLICT" });
    } else {
      // Different values within one file — almost certainly a selector-scoped
      // variant (e.g. per-surface or per-theme override), not a true conflict.
      // Flagged separately so it isn't miscounted as router-parity defect.
      scopedVariants.push({ name, definitions: defs, kind: "SAME_FILE_SCOPED_VARIANT" });
    }
  } else {
    duplicatesSameValue.push({ name, definitions: defs });
  }
}

// ── TS token constants (leaf color values only, for cross-reference) ────
const tsSources = ["lib/design/tokens.ts", "lib/design-system/tokens.ts"];
const tsVars = tsSources.flatMap(extractTsColorConstants);

// ── Tailwind color namespace extraction (from tailwind.config.cjs) ──────
const twConfigPath = join(ROOT, "tailwind.config.cjs");
const twSrc = existsSync(twConfigPath) ? readFileSync(twConfigPath, "utf8") : "";
const twColorsBlockMatch = twSrc.match(/colors:\s*\{([\s\S]*?)\n\s{4}\},/);
const twNamespaces = twColorsBlockMatch
  ? [...twColorsBlockMatch[1].matchAll(/^\s{8}([a-zA-Z0-9_-]+):\s*\{?/gm)].map((m) => m[1])
  : [];

// ── Write token-ownership-matrix.csv ─────────────────────────────────────
const csvRows = ["file,line,variable,value"];
for (const v of allCssVars) {
  csvRows.push(`${v.file},${v.line},${v.name},"${v.value.replace(/"/g, '""')}"`);
}
writeFileSync(join(ROOT, "reports/visual/token-ownership-matrix.csv"), csvRows.join("\n") + "\n");

// ── Write token-conflict-register.json ───────────────────────────────────
const register = {
  generatedAt: new Date().toISOString(),
  sourcesScanned: CSS_SOURCES,
  totalCssVarDefinitions: allCssVars.length,
  distinctVarNames: byName.size,
  crossFileConflictCount: conflicts.length,
  sameFileScopedVariantCount: scopedVariants.length,
  duplicateSameValueVarNames: duplicatesSameValue.length,
  conflicts,
  scopedVariants,
  duplicatesSameValue,
  tsLeafColorConstants: tsVars,
  tailwindColorNamespaces: twNamespaces,
};
writeFileSync(
  join(ROOT, "reports/visual/token-conflict-register.json"),
  JSON.stringify(register, null, 2) + "\n",
);

console.log("── Token Inventory Extraction ──");
console.log(`CSS var definitions scanned : ${allCssVars.length}`);
console.log(`Distinct var names          : ${byName.size}`);
console.log(`CROSS-FILE CONFLICTS        : ${conflicts.length}  (genuine router-parity defects)`);
console.log(`Same-file scoped variants   : ${scopedVariants.length}  (likely intentional — needs manual confirm)`);
console.log(`Duplicate (same value)      : ${duplicatesSameValue.length}`);
console.log(`Tailwind color namespaces   : ${twNamespaces.join(", ")}`);
console.log("\nCross-file conflicts (genuine defects):");
for (const c of conflicts) {
  console.log(`  ${c.name}:`);
  for (const d of c.definitions) console.log(`    ${d.file}:${d.line} = ${d.value}`);
}
