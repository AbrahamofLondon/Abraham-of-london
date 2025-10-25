#!/usr/bin/env node
/**
 * Global Project Cleaner
 * - Strips mojibake & invisible chars
 * - Normalizes YAML front-matter (fixes: key value → key: value, kind→type)
 * - Ensures sane defaults for slug/type (by folder)
 * - Removes invalid trailing junk after quoted values (fixes “Unexpected scalar at node end”)
 * - Removes invalid baseColor prop in code
 */

import fs from "node:fs";
import path from "node:path";

/* CONFIG */
const TARGET_DIRS = ["./pages", "./components", "./content", "./config"];
const CODE_EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs"]);
const DATA_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
]);

/* GLOBAL FIXES */
const INVIS = /[\u00A0\u200B\uFEFF\u2009]/g; // NBSP, ZWSP, BOM, thin space
const CP1252 = [
  [/—/g, "—"],
  [/–/g, "–"],
  [/'/g, "'"],
  [/'/g, "'"],
  [/"/g, '"'],
  [/â€\x9d/g, '"'],
  [/"/g, '"'],
  [/©/g, "©"],
  [/•/g, "•"],
  [/…/g, "…"],
  [/\s/g, ""],
];
const GLOBAL_TEXT_FIXES = [[INVIS, ""], ...CP1252];

const CODE_FIXES = [
  ...GLOBAL_TEXT_FIXES,
  [/\s*baseColor="[^"]*"\s*/g, ""], // remove invalid prop
];

const FM_LINE_FIXES = [
  [/^\s*\/\/.*$/gm, ""], // drop full-line // comments
  [/^(.*?)(\s+\/\/.*)$/gm, (_m, a) => a], // strip inline // comments
  [/[ \t]+$/gm, ""], // trim EOL spaces
];

const TRIM_AFTER_QUOTED =
  /^(\s*[A-Za-z_][\w-]*\s*:\s*"(?:[^"\\]|\\.)*")\s.*$/gm; // keep after closing quote clean

/* UTIL */
let filesProcessed = 0;
let filesModified = 0;

const norm = (p) => p.replaceAll("\\", "/");
const read = (p) => fs.readFileSync(p, "utf8");
function writeWithBackup(p, txt) {
  const bak = p + ".bak";
  if (!fs.existsSync(bak) && fs.existsSync(p)) fs.copyFileSync(p, bak);
  fs.writeFileSync(p, txt, "utf8");
}
function applyPairs(s, pairs) {
  let t = s;
  for (const [re, rep] of pairs) t = t.replace(re, rep);
  return t;
}
function list(dir) {
  const out = [];
  const st = [dir];
  while (st.length) {
    const d = st.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (!IGNORE_DIRS.has(ent.name)) st.push(p);
      } else out.push(p);
    }
  }
  return out;
}
function extractFM(raw) {
  const m = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] ?? "" };
}
const kebab = (s) =>
  s
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();

/* FRONT-MATTER NORMALIZER */
function normalizeFM(fmRaw, ctx) {
  let fm = fmRaw;

  // line/global cleaning
  fm = applyPairs(fm, FM_LINE_FIXES);
  fm = applyPairs(fm, GLOBAL_TEXT_FIXES);

  // key value  → key: value  (handles: kind "template", kind template, kind Resource)
  fm = fm.replace(
    /^(\s*[A-Za-z_][\w-]*)\s+("[^"\r\n]+"|'[^'\r\n]+'|[^:\s#][^\r\n#]*)\s*$/gm,
    (_m, k, v) => `${k.trim()}: ${String(v).trim()}`,
  );

  // orphan bare keys to empty values
  fm = fm
    .split(/\r?\n/)
    .map((l) => (/^\s*[A-Za-z_][\w-]*\s*$/.test(l) ? `${l.trim()}: ""` : l))
    .join("\n");

  // kind → type
  fm = fm.replace(/^(?<i>\s*)kind(\s*):/gm, "$<i>type$2:");

  // remove junk after closing quotes (fixes "Unexpected scalar at node end")
  fm = fm.replace(TRIM_AFTER_QUOTED, "$1");

  // coerce a few type variants
  fm = fm.replace(/^(\s*)type\s*:\s*Resource\s*$/gim, `$1type: "guide"`);
  fm = fm.replace(/^(\s*)type\s*:\s*template\s*$/gim, `$1type: "template"`);

  // slug defaults / fixme
  if (!/^(\s*)slug\s*:/m.test(fm)) fm = `slug: "${ctx.filenameSlug}"\n` + fm;
  fm = fm.replace(
    /^(\s*)slug\s*:\s*"?fixme"?\s*$/m,
    `$1slug: "${ctx.filenameSlug}"`,
  );

  // type defaults by folder
  if (!/^(\s*)type\s*:/m.test(fm)) {
    fm = `${ctx.isDownload ? `type: "download"` : ctx.isResource ? `type: "guide"` : `type: "page"`}\n${fm}`;
  }

  // final tidy
  fm = fm
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trimEnd();
  return fm;
}

/* PROCESSORS */
function processDataFile(p) {
  const orig = read(p);
  const fmObj = extractFM(orig);
  if (!fmObj) return false;

  const posix = norm(p);
  const filenameSlug = kebab(path.basename(p));
  const isResource = posix.includes("/content/resources/");
  const isDownload =
    posix.includes("/content/downloads/") || posix.includes("/downloads/");

  const fmFixed = normalizeFM(fmObj.fm, {
    isResource,
    isDownload,
    filenameSlug,
  });
  const rebuilt = `---\n${fmFixed}\n---\n\n${fmObj.body}`;

  if (rebuilt !== orig) {
    writeWithBackup(p, rebuilt);
    console.log(`✅ FM fixed: ${p}`);
    return true;
  }
  return false;
}

function processCodeFile(p) {
  const orig = read(p);
  let fixed = applyPairs(orig, CODE_FIXES);

  // Patch known framer-motion typing hiccup (safe cast)
  if (norm(p).endsWith("/components/Header.tsx")) {
    fixed = fixed.replace(
      /transition=\{motionTransition\}/,
      "transition={motionTransition as any}",
    );
  }

  if (fixed !== orig) {
    writeWithBackup(p, fixed);
    console.log(`✅ Code fixed: ${p}`);
    return true;
  }
  return false;
}

/* WALK */
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(p);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!CODE_EXTS.has(ext) && !DATA_EXTS.has(ext)) continue;

    filesProcessed++;
    try {
      if (DATA_EXTS.has(ext)) {
        if (processDataFile(p)) filesModified++;
      } else {
        if (processCodeFile(p)) filesModified++;
      }
    } catch (e) {
      console.error(`❌ Error processing ${p}: ${e.message}`);
    }
  }
}

/* MAIN */
(function main() {
  console.log(`🚀 Global cleanup across: ${TARGET_DIRS.join(", ")}`);
  for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) walk(dir);
    else console.log(`⚠️ Skip missing: ${dir}`);
  }
  console.log("\n-------------------------------------------");
  console.log("✨ Cleanup Complete.");
  console.log(`Total files scanned:  ${filesProcessed}`);
  console.log(`Total files modified: ${filesModified}`);
  console.log("-------------------------------------------\n");
})();
