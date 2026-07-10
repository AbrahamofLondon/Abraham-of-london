#!/usr/bin/env node
/**
 * scripts/visual/extract-usage-baselines.mjs
 *
 * Phase 0 baseline tool. Produces, over pages/, components/, app/
 * (excluding node_modules/.next/.contentlayer):
 *   - Tailwind alias consumer counts (softGold, cream, warmWhite, amber, ...)
 *   - raw hex/rgb(a) literal counts (the gate:visual-raw-colour baseline)
 *   - inline style={{ }} counts
 *   - tiny fontSize (<11px) counts
 *   - files that trip the custom Tailwind extractor's `.replace(/[-:.]` skip
 *
 * Read-only. Writes:
 *   reports/visual/tailwind-alias-consumer-matrix.csv
 *   reports/visual/raw-colour-baseline.json
 *   reports/visual/type-floor-baseline.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["pages", "app", "components"];
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

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

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

// ── Tailwind alias consumer counts ───────────────────────────────────────
const ALIASES = [
  "softGold", "cream", "warmWhite", "amber", "charcoal", "deepCharcoal",
  "softBlack", "obsidian", "lightGrey", "forest", "gold",
];
const aliasCounts = new Map(ALIASES.map((a) => [a, 0]));
const aliasFiles = new Map(ALIASES.map((a) => [a, new Set()]));

// ── Raw colour + inline style + tiny type ────────────────────────────────
let rawHexCount = 0;
let rawRgbCount = 0;
let inlineStyleCount = 0;
let tinyTypeCount = 0;
const rawColourByFile = [];
const tinyTypeByFile = [];
const extractorTriggerFiles = [];

const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
const rgbRe = /\brgba?\([^)]+\)/g;
const inlineStyleRe = /style=\{\{/g;
const tinyTypeRe = /fontSize:\s*["']?(\d(?:\.\d)?)(px)?["']?/g;

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = relative(ROOT, file).replace(/\\/g, "/");

  // Tailwind alias usage: match `text-<alias>`, `bg-<alias>`, `border-<alias>`, `from-<alias>` etc.
  for (const alias of ALIASES) {
    const aliasRe = new RegExp(`\\b(?:text|bg|border|from|to|via|ring|fill|stroke)-${alias}\\b`, "g");
    const matches = content.match(aliasRe);
    if (matches) {
      aliasCounts.set(alias, aliasCounts.get(alias) + matches.length);
      aliasFiles.get(alias).add(rel);
    }
  }

  const hexMatches = content.match(hexRe);
  const rgbMatches = content.match(rgbRe);
  const inlineMatches = content.match(inlineStyleRe);
  if (hexMatches) {
    rawHexCount += hexMatches.length;
    rawColourByFile.push({ file: rel, hex: hexMatches.length, rgb: 0 });
  }
  if (rgbMatches) {
    rawRgbCount += rgbMatches.length;
    const existing = rawColourByFile.find((r) => r.file === rel);
    if (existing) existing.rgb = rgbMatches.length;
    else rawColourByFile.push({ file: rel, hex: 0, rgb: rgbMatches.length });
  }
  if (inlineMatches) inlineStyleCount += inlineMatches.length;

  let tinyMatch;
  let fileTinyCount = 0;
  tinyTypeRe.lastIndex = 0;
  while ((tinyMatch = tinyTypeRe.exec(content)) !== null) {
    const px = parseFloat(tinyMatch[1]);
    if (px < 11) {
      tinyTypeCount++;
      fileTinyCount++;
    }
  }
  if (fileTinyCount > 0) tinyTypeByFile.push({ file: rel, count: fileTinyCount });

  if (content.includes(".replace(/[-:.]")) {
    extractorTriggerFiles.push(rel);
  }
}

// ── Write outputs ─────────────────────────────────────────────────────────
const aliasCsv = ["alias,consumerCount,fileCount"];
for (const alias of ALIASES) {
  aliasCsv.push(`${alias},${aliasCounts.get(alias)},${aliasFiles.get(alias).size}`);
}
writeFileSync(join(ROOT, "reports/visual/tailwind-alias-consumer-matrix.csv"), aliasCsv.join("\n") + "\n");

writeFileSync(
  join(ROOT, "reports/visual/raw-colour-baseline.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      dirsScanned: SCAN_DIRS,
      filesScanned: files.length,
      totalRawHex: rawHexCount,
      totalRawRgb: rawRgbCount,
      totalInlineStyle: inlineStyleCount,
      filesWithRawColour: rawColourByFile.length,
      byFile: rawColourByFile.sort((a, b) => b.hex + b.rgb - (a.hex + a.rgb)),
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  join(ROOT, "reports/visual/type-floor-baseline.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      floorPx: 11,
      totalViolations: tinyTypeCount,
      filesWithViolations: tinyTypeByFile.length,
      byFile: tinyTypeByFile.sort((a, b) => b.count - a.count),
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  join(ROOT, "reports/visual/tailwind-extractor-trigger-inventory.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      triggerPattern: ".replace(/[-:.]",
      filesTriggering: extractorTriggerFiles,
      count: extractorTriggerFiles.length,
    },
    null,
    2,
  ) + "\n",
);

console.log("── Usage Baselines ──");
console.log(`Files scanned (pages+app+components): ${files.length}`);
console.log(`\nTailwind alias consumers:`);
for (const alias of ALIASES) {
  console.log(`  ${alias}: ${aliasCounts.get(alias)} usages across ${aliasFiles.get(alias).size} files`);
}
console.log(`\nRaw colour baseline:`);
console.log(`  raw hex literals : ${rawHexCount}`);
console.log(`  raw rgb(a)()     : ${rawRgbCount}`);
console.log(`  files affected   : ${rawColourByFile.length}`);
console.log(`\nInline style={{ }} count: ${inlineStyleCount}`);
console.log(`\nTiny type (<11px) violations: ${tinyTypeCount} across ${tinyTypeByFile.length} files`);
console.log(`\nTailwind extractor trigger files: ${extractorTriggerFiles.length}`);
for (const f of extractorTriggerFiles) console.log(`  ${f}`);
