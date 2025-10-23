```javascript
#!/usr/bin/env node
/**
 * Abraham of London – Global Project Manager (Enhanced)
 * ---------------------------------------------------------
 * Goals:
 * - Fix file corruption (mojibake, invisible chars, HTML entities).
 * - Normalize and validate Contentlayer/MDX front-matter (FM).
 * - Restore missing critical files (e.g., christianity-not-extremism.mdx).
 * - Remove Contentlayer imports/references.
 * - Normalize line endings (LF) and remove trailing whitespace.
 * - Validate filenames to prevent syntax errors.
 * - Generate a detailed JSON report.
 * - Integrate with repair-encoding.mjs for encoding fixes.
 *
 * Usage:
 *   node scripts/global_project_manager.mjs [--dry=true] [--fix=true] [--strict=false] [--report=scripts/_reports/global_report.json]
 *   [--fix-line-endings] [--fix-whitespace] [--restore-files] [--remove-contentlayer]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

/* ───────────────────────── CONFIG ───────────────────────── */

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^-+/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);
const DRY = String(args.dry ?? args["dry-run"] ?? "false").toLowerCase() === "true";
const FIX = String(args.fix ?? "true").toLowerCase() === "true";
const STRICT = String(args.strict ?? "false").toLowerCase() === "true";
const FIX_LINE_ENDINGS = String(args["fix-line-endings"] ?? "true").toLowerCase() === "true";
const FIX_WHITESPACE = String(args["fix-whitespace"] ?? "true").toLowerCase() === "true";
const RESTORE_FILES = String(args["restore-files"] ?? "true").toLowerCase() === "true";
const REMOVE_CONTENTLAYER = String(args["remove-contentlayer"] ?? "true").toLowerCase() === "true";
const REPORT_PATH = args.report || "scripts/_reports/global_report.json";

/* ───────────────────── Project Layout ─────────────────── */

const ROOT = process.cwd();
const r = (...p) => path.join(ROOT, ...p);

const TARGET_DIRS = [r("pages"), r("components"), r("content"), r("config"), r("scripts")]
  .filter(p => exists(p));

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", ".vscode", "out", "public/downloads"]);

/* ───────────────────── Utilities ──────────────────────── */

let filesProcessed = 0;
let filesModified = 0;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function read(p) {
  return fs.readFile(p, "utf8");
}

async function write(p, textOrBuffer) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, textOrBuffer, typeof textOrBuffer === "string" ? "utf8" : undefined);
}

async function writeWithBackup(p, text) {
  if (DRY) return;
  if ((await exists(p)) && !(await exists(p + ".bak"))) {
    try {
      await fs.copyFile(p, p + ".bak");
      console.log(`📂 Created backup: ${p}.bak`);
    } catch (e) {
      console.warn(`⚠️ Could not create backup for ${p}: ${e.message}`);
    }
  }
  await write(p, text);
}

async function list(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    try {
      const entries = await fs.readdir(d, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) {
          if (IGNORE_DIRS.has(ent.name)) continue;
          stack.push(p);
        } else if (isValidFilename(p)) {
          out.push(p);
        } else {
          console.warn(`⚠️ Skipping invalid filename: ${norm(p)}`);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Skipping inaccessible directory: ${norm(d)}`);
    }
  }
  return out;
}

const norm = (p) => p.replaceAll("\\", "/");
const kebab = (s) =>
  s.replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
const titleCase = (s) =>
  s.replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return {};
  }
}

function isValidFilename(p) {
  return !/[<>:"|?*]/.test(path.basename(p));
}

function normalizeTextContent(content) {
  let result = content;
  if (FIX_LINE_ENDINGS) result = result.replace(/\r\n/g, "\n");
  if (FIX_WHITESPACE) result = result.replace(/[ \t]+$/gm, "");
  return result;
}

/* ───────────────────── Patterns / Fixes ───────────────── */

const CODE_EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs"]);
const DATA_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const JSON_EXTS = new Set([".json"]);

// Invisible characters (NBSP, ZWSP, BOM, Thin Space)
const INVIS_CHARS = /[\u00A0\u200B\uFEFF\u2009]/g;

// Common Windows-1252 (mojibake) fixes + project-specific patterns
const CP1252_FIXES = [
  [/â€”/g, "—"], [/â€“/g, "–"], [/â€™/g, "'"], [/â€˜/g, "'"], [/â€œ/g, '"'],
  [/â€\x9d/g, '"'], [/â€/g, '"'], [/Â©/g, "©"], [/â€¢/g, "•"], [/â€¦/g, "…"],
  [/Â\s/g, ""],
  // From fix-corrupted-files.ps1 and repair-encoding.mjs
  [/ÃƒÆ’Ã†â€™Ãƒâ€Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢/g, "'"],
  [/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬/g, "-"],
  [/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢/g, "'"],
  [/ÃƒÆ’Ã†â€™Ãƒâ€Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬/g, "-"],
  [/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, '"'],
  [/ÃƒÆ’Ã†â€™Ãƒâ€Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, '"'],
  [/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å¡/g, '"'],
  [/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/g, '"'],
  [/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢/g, "'"],
  [/Ã‚Â/g, ""],
];

const CODE_FIXES = [
  [INVIS_CHARS, ""],
  ...CP1252_FIXES,
  [/import\s+(\w+)\s+from\s+["']node:(\w+)["']/g, 'import $1 from "$2"'],
  // Remove Contentlayer imports/references
  [/import \{.*?\} from ['"]contentlayer\/generated['"]/g, ""],
  [/\ballBooks\b/g, "[]"],
  [/\ballEvents\b/g, "[]"],
  [/\ballPrints\b/g, "[]"],
];

const DATA_LINE_FIXES = [
  [/^\s*\/\/.*$/gm, ""],
  [/^(.*?)(\s+\/\/.*)$/gm, (_m, a) => a],
  [/[ \t]+$/gm, ""],
  [INVIS_CHARS, ""],
  ...CP1252_FIXES,
  [/📄/g, '\\uD83D\\uDCC4 '],
  [/📚/g, '\\uD83D\\uDCDA '],
  [/🔗/g, '\\uD83D\\uDD17 '],
];

const REQUIRED_DL_FIELDS = ["title", "slug", "date", "author", "readTime", "category", "type"];

// Files to restore if missing
const FILES_TO_RESTORE = [
  {
    path: "content/books/fathering-without-fear.mdx",
    content: `---
kind: Book
title: Fathering Without Fear (The Field Memoir)
slug: fathering-without-fear
date: "2026-03-01"
author: Abraham of London
readTime: "4 hours"
category: Memoir
description: Forged in courtrooms and prayer rooms. A father's fight through fire-purpose, grace, and the long road to legacy.
ogDescription: Not a victim. A watchman. Fathering Without Fear is a field-memoir for dads who refuse to disappear.
coverImage: /assets/images/book-covers/fathering-without-fear-book.jpg
tags:
  - memoir
  - fatherhood
  - faith
---
"Not a plea, a standard." *Fathering Without Fear* is a memoir of clarity under pressure-faith lived in the open, a father's stubborn refusal to surrender the future that bears his name.

They called him a miracle before he could walk. They tried to break him before he could rise. They underestimated him every step of the way.

*Fathering Without Fear* is the untold memoir of Abraham of London-a triplet born too soon in 1977 Lagos, raised under the shadow of loss, and forged in fire by the deaths of siblings, betrayals of friends, and battles that blurred the line between the spiritual and the political. It is the story of a boy who bargained with God at eight, a young man who toppled political strongholds at university, and a father who found himself silenced by courts, systems, and the cold walls of restricted contact.

But silence did not erase him. It sharpened him.

When denied the right to work, he built strategy. When stripped of funds, he fought with faith. When pushed out of his son's life, he learnt to write to battle. This memoir doesn't ask for sympathy-it demands attention. It is raw, luminous, and unrelenting: a journey from miracle child to movement-maker, from whispered losses to a roar of resilience.

He didn't survive by chance. He stayed by grace. And because something always happens-so does he.

Read it, and you will ache when it ends, beg for more, and never forget the man who refused to disappear.
`
  },
  {
    path: "content/blog/christianity-not-extremism.mdx",
    content: `---
kind: Blog
title: Christianity is Not Extremism
slug: christianity-not-extremism
date: 2025-10-13
author: Abraham of London
readTime: 4 min read
category: Blog
excerpt: "Why: Christianity cannot be lumped under the banner of extremism: a call for ..."
tags:
  - faith
  - society
---
Content here...
`
  },
  {
    path: "content/strategy/events-blueprint.md",
    content: `---
kind: Strategy
title: Events Blueprint
slug: events-blueprint
date: 2025-10-13
author: Abraham of London
readTime: 4 min read
category: Strategy
tags:
  - events
  - strategy
---
Content here...
`
  },
  {
    path: "content/downloads/board-update-onepager.mdx",
    content: `---
kind: Download
title: Board Update One-Pager
slug: board-update-onepager
date: 2025-10-13
author: Abraham of London
readTime: 2 min read
category: Resources
pdfPath: /downloads/Board_Update_Onepager.pdf
coverImage: /assets/images/downloads/board-update-onepager.jpg
tags:
  - board
  - update
---
# Board Update One-Pager
Content for the board update one-pager goes here...
`
  }
];

/* ───────────────────── Report Class ───────────────────── */

class Report {
  constructor() {
    this.data = {
      startedAt: new Date().toISOString(),
      dryRun: DRY,
      applyFixes: FIX,
      strict: STRICT,
      fixLineEndings: FIX_LINE_ENDINGS,
      fixWhitespace: FIX_WHITESPACE,
      restoreFiles: RESTORE_FILES,
      removeContentlayer: REMOVE_CONTENTLAYER,
      filesScanned: 0,
      filesModified: 0,
      codeFixed: [],
      dataFixed: [],
      jsonFixed: [],
      fmMissingFields: [],
      linkErrors: [],
      brandFrameUsage: [],
      notes: [],
      endedAt: null,
    };
  }
  record(key, value) {
    if (Array.isArray(this.data[key])) {
      this.data[key].push(value);
    } else {
      this.data[key] = value;
    }
  }
  increment(key) { this.data[key]++; }
  finalize() { this.data.endedAt = new Date().toISOString(); }
  get() { return this.data; }
}

const report = new Report();

/* ───────────────── JSON Sanity (package.json) ─────────── */

async function sanitizeJsonFile(p) {
  if (!(await exists(p))) return;
  let raw = await read(p);
  const orig = raw;
  raw = raw.replace(/^\uFEFF/, ""); // Remove BOM
  raw = applyPairs(raw, [[INVIS_CHARS, ""], ...CP1252_FIXES]);
  raw = normalizeTextContent(raw);

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    report.record("notes", `JSON parse error in ${norm(p)}: ${e.message}`);
    return;
  }

  if (orig !== raw || JSON.stringify(parsed, null, 2) + "\n" !== orig) {
    report.record("jsonFixed", { file: norm(p), changes: ["reformatted", "mojibake", "line-endings"] });
    report.increment("filesModified");
    if (FIX) await writeWithBackup(p, JSON.stringify(parsed, null, 2) + "\n");
  }
}

/* ───────────────── FM helpers ─────────────────────────── */

function extractFM(raw) {
  const m = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] ?? "" };
}

function applyPairs(text, pairs) {
  let out = text;
  for (const [re, repl] of pairs) out = out.replace(re, repl);
  return out;
}

function normalizeFM(fmRaw, ctx) {
  let fm = fmRaw;
  fm = applyPairs(fm, DATA_LINE_FIXES);

  fm = fm.replace(
    /^(\s*)(title|type|date|author|readTime|category|slug)\s*\r?\n/gim,
    (match, indent, key) => {
      if (key.toLowerCase() === "type") return `${indent}type: "guide"\n`;
      return `${indent}${key}: ""\n`;
    }
  );

  fm = fm.replace(
    /^(\s*[A-Za-z_][\w-]*)\s+("?)([^"\r\n#]+)\2\s*$/gm,
    (_m, k, _q, v) => `${k}: ${v.trim()}`
  );

  fm = fm.replace(/^(?<i>\s*)kind(\s*):/gm, "$<i>type$2:");
  fm = fm.replace(/^(\s*)type\s*:\s*Resource\s*$/gmi, `$1type: "guide"`);
  fm = fm.replace(/^(\s*)type\s*:\s*template\s*$/gmi, `$1type: "template"`);

  const slugLine = new RegExp(`^\\s*slug\\s*:`, "m");
  if (!slugLine.test(fm)) fm = `slug: "${ctx.filenameSlug}"\n` + fm;
  fm = fm.replace(/^(\s*)slug\s*:\s*"?fixme"?\s*$/m, `$1slug: "${ctx.filenameSlug}"`);

  if (!/^(\s*)type\s*:/m.test(fm)) {
    if (ctx.isDownload) fm = `type: "download"\n` + fm;
    else if (ctx.isResource) fm = `type: "guide"\n` + fm;
    else if (ctx.isBlog) fm = `type: "blog"\n` + fm;
  }

  fm = fm.replace(
    /^(\s*)(title|subtitle|category|author|type|coverImage|excerpt|slug)\s*:\s*(.+)$/gm,
    (_m, i, key, val) => {
      let v = String(val).trim();
      if (!/^("|'|true|false|\d|\{|\[)/i.test(v)) {
        v = `"${v.replace(/"/g, '\\"')}"`;
      }
      return `${i}${key}: ${v}`;
    }
  );

  fm = fm.split(/\r?\n/).map((l) => l.replace(/[ \t]+$/g, "")).join("\n").trimEnd();
  return fm;
}

/* ───────────────── Restore Files ──────────────────────── */

async function restoreFiles() {
  if (!RESTORE_FILES) return;
  for (const { path: filePath, content } of FILES_TO_RESTORE) {
    const absPath = r(filePath);
    try {
      if (!(await exists(absPath))) {
        await writeWithBackup(absPath, content);
        report.record("dataFixed", { file: norm(absPath), changes: ["restored"] });
        report.increment("filesModified");
        console.log(`🗄️ Restored missing file: ${norm(absPath)}`);
      }
    } catch (e) {
      report.record("notes", `Error restoring ${norm(absPath)}: ${e.message}`);
    }
  }
}

/* ───────────────── Check BrandFrame Usage ─────────────── */

async function checkBrandFrame(p) {
  if (!p.endsWith(".mdx")) return null;
  const content = await read(p);
  const matches = content.match(/<BrandFrame\b[^>]*>/g);
  return matches ? { file: norm(p), brandFrameCount: matches.length } : null;
}

/* ───────────────────── Pass A: Clean files ────────────────── */

async function passCleanFile(p) {
  const ext = path.extname(p).toLowerCase();
  if (![...CODE_EXTS, ...DATA_EXTS, ...JSON_EXTS].includes(ext)) return;

  report.increment("filesScanned");

  if (JSON_EXTS.has(ext) && path.basename(p).toLowerCase() === "package.json") {
    await sanitizeJsonFile(p);
    return;
  }

  const brandFrameResult = await checkBrandFrame(p);
  if (brandFrameResult) report.record("brandFrameUsage", brandFrameResult);

  if (CODE_EXTS.has(ext)) {
    const orig = await read(p);
    let fixed = orig;
    fixed = applyPairs(fixed, CODE_FIXES);
    fixed = normalizeTextContent(fixed);

    if (fixed !== orig) {
      report.increment("filesModified");
      report.record("codeFixed", { file: norm(p), changes: ["mojibake", "contentlayer", "line-endings"] });
      if (FIX) await writeWithBackup(p, fixed);
    }
    return;
  }

  if (DATA_EXTS.has(ext)) {
    const raw = await read(p);
    let fixed = normalizeTextContent(raw);
    const fmObj = extractFM(fixed);
    if (!fmObj) return;

    const filenameSlug = kebab(path.basename(p));
    const posix = norm(p);
    const ctx = {
      filenameSlug,
      isResource: posix.includes("/content/resources/"),
      isDownload: posix.includes("/content/downloads/") || posix.includes("/downloads/"),
      isBlog: posix.includes("/content/blog/"),
    };

    let fmFixed = normalizeFM(fmObj.fm, ctx);
    let changed = fmFixed !== fmObj.fm || fixed !== raw;

    if (ctx.isDownload) {
      const missing = REQUIRED_DL_FIELDS.filter((k) => !new RegExp(`^\\s*${k}\\s*:[^\\n]`, "m").test(fmFixed));
      if (missing.length) {
        report.record("fmMissingFields", { file: norm(p), missing });
        if (FIX) {
          let adds = [];
          if (!/^\s*title\s*:/m.test(fmFixed)) adds.push(`title: "${titleCase(filenameSlug)}"`);
          if (!/^\s*date\s*:/m.test(fmFixed)) adds.push(`date: "2025-10-13"`);
          if (!/^\s*author\s*:/m.test(fmFixed)) adds.push(`author: "Abraham of London"`);
          if (!/^\s*readTime\s*:/m.test(fmFixed)) adds.push(`readTime: "4 min read"`);
          if (!/^\s*category\s*:/m.test(fmFixed)) adds.push(`category: "Resources"`);
          if (adds.length) {
            fmFixed = adds.join("\n") + "\n" + fmFixed;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      const rebuilt = `---\n${fmFixed}\n---\n\n${fmObj.body}`;
      report.increment("filesModified");
      report.record("dataFixed", { file: norm(p), changes: ["front-matter", "line-endings", "mojibake"] });
      if (FIX) await writeWithBackup(p, rebuilt);
    }
  }
}

/* ───────────────────── Pass F: Formatters ───────────────── */

async function runFormatters() {
  if (DRY) return;
  console.log("\nRunning Prettier and ESLint...");
  try {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    spawnSync(npx, ["--yes", "prettier", "-w", "."], { stdio: "inherit" });
    spawnSync(npx, ["--yes", "eslint", "--fix", "."], { stdio: "inherit" });
  } catch (e) {
    report.record("notes", `Prettier/ESLint failed to run: ${e.message}`);
  }
}

/* ───────────────── Run repair-encoding.mjs ─────────────── */

async function runRepairEncoding() {
  if (DRY) return;
  console.log("\nRunning repair-encoding.mjs...");
  try {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    spawnSync(npx, [
      "node", "scripts/repair-encoding.mjs", ".", 
      "--fix-line-endings", "--fix-whitespace", 
      "--restore-files", "--remove-contentlayer"
    ], { stdio: "inherit" });
  } catch (e) {
    report.record("notes", `repair-encoding.mjs failed to run: ${e.message}`);
  }
}

/* ───────────────────────── Main ───────────────────────── */

(async () => {
  console.log(`\n🚀 Global Project Manager (dry=${DRY}, fix=${FIX}, strict=${STRICT})`);
  console.log(`   fix-line-endings=${FIX_LINE_ENDINGS}, fix-whitespace=${FIX_WHITESPACE}`);
  console.log(`   restore-files=${RESTORE_FILES}, remove-contentlayer=${REMOVE_CONTENTLAYER}`);
  console.log(`Scanning: ${TARGET_DIRS.map(norm).join(", ")}`);

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  await restoreFiles();

  for (const dir of TARGET_DIRS) {
    for (const p of await list(dir)) {
      try {
        await passCleanFile(p);
      } catch (e) {
        console.error(`❌ Error processing ${norm(p)}: ${e.message}`);
        report.record("notes", `Error processing ${norm(p)}: ${e.message}`);
      }
    }
  }

  await sanitizeJsonFile(r("package.json"));
  await runRepairEncoding();
  await runFormatters();

  report.finalize();
  const reportData = safeClone(report.get());

  try {
    await write(REPORT_PATH, JSON.stringify(reportData, null, 2));
    console.log(`📊 Report written to: ${norm(REPORT_PATH)}`);
  } catch (e) {
    console.error(`❌ Failed to write report: ${e.message}`);
    const simpleReport = {
      ...reportData,
      codeFixed: Array.isArray(reportData.codeFixed) ? reportData.codeFixed.length : 0,
      dataFixed: Array.isArray(reportData.dataFixed) ? reportData.dataFixed.length : 0,
    };
    await write(REPORT_PATH, JSON.stringify(simpleReport, null, 2));
    console.log(`📊 Simplified report written to: ${norm(REPORT_PATH)}`);
  }

  console.log("\n──────────── Summary ────────────");
  console.log(`Scanned:    ${report.data.filesScanned}`);
  console.log(`Modified:   ${report.data.filesModified}${DRY ? " (dry-run)" : ""}`);
  console.log(`Report:     ${norm(REPORT_PATH)}`);
  console.log("────────────────────────────────\n");

  if (STRICT && (report.data.linkErrors.length || report.data.fmMissingFields.length)) {
    console.error("❌ Strict mode: failing due to errors.");
    process.exit(1);
  }
  process.exit(0);
})();
```