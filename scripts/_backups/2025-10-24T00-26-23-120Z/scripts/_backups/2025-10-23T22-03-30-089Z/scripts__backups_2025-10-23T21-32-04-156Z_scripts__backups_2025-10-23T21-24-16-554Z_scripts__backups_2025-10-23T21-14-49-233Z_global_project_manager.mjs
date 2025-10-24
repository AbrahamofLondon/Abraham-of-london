#!/usr/bin/env node
/**
 * Abraham of London – Global Project Manager (v2)
 * ---------------------------------------------------------
 * Safer, faster, more precise:
 * - Fix mojibake/invisible chars/HTML-ish entities (byte-safe patterns).
 * - Normalize & validate MD/MDX front-matter with minimal churn.
 * - Restore critical content if missing (idempotent, with .bak).
 * - Remove Contentlayer imports/refs (safely).
 * - Normalize LF + trim trailing whitespace.
 * - Validate filenames; optionally limit by git --since and extensions.
 * - Concurrency + deterministic report.
 * - Run companion repair-encoding.mjs correctly (Node, cross-platform).
 */

import fs from "node:fs/promises";
import fss from "fs";                 // sync helpers where needed
import path from "path";
import os from "os";
import { spawnSync } from "node:child_process";

/* ───────────────────── CLI / CONFIG ───────────────────── */

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^-+/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

const DRY  = _bool(args.dry ?? args["dry-run"] ?? "false");
const FIX  = _bool(args.fix ?? "true");
const STRICT = _bool(args.strict ?? "false");

const FIX_LINE_ENDINGS = _bool(args["fix-line-endings"] ?? "true");
const FIX_WHITESPACE   = _bool(args["fix-whitespace"] ?? "true");
const RESTORE_FILES    = _bool(args["restore-files"] ?? "true");
const REMOVE_CONTENTLAYER = _bool(args["remove-contentlayer"] ?? "true");
const NO_BACKUP        = _bool(args["no-backup"] ?? "false");

const REPORT_PATH = String(args.report || "scripts/_reports/global_report.json");
const SINCE       = args.since || ""; // e.g. HEAD~30 or a commit SHA
const ONLY_EXT    = String(args["only-ext"] || "").split(",").map(s => s.trim()).filter(Boolean);
const CONCURRENCY = Math.max(1, parseInt(args.concurrency ?? "6", 10));

const ROOT = process.cwd();
const r = (...p) => path.join(ROOT, ...p);

const DEFAULT_TARGET_DIRS = ["pages", "components", "content", "config", "scripts"];
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", ".vscode", "out"]);
const SKIP_PATH_SUBSTRINGS = ["public/downloads"]; // large binary-ish area to avoid

/* ───────────────────── Helpers (sync safe) ────────────── */

function _bool(v) {
  return String(v).toLowerCase() === "true";
}

function existsSync(p) {
  try { fss.accessSync(p); return true; } catch { return false; }
}

function isValidFilename(p) {
  const base = path.basename(p);
  // Windows reserved chars (also fine on POSIX; we keep it strict)
  if (/[<>:"|?*]/.test(base)) return false;
  return true;
}

function normalizeTextContent(s) {
  let out = s;
  if (FIX_LINE_ENDINGS) out = out.replace(/\r\n/g, "\n");
  if (FIX_WHITESPACE)   out = out.replace(/[ \t]+$/gm, "");
  return out;
}

async function readText(p) {
  return fs.readFile(p, "utf8");
}

async function writeText(p, text) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, text, "utf8");
}

async function writeWithBackup(p, text) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  if (!NO_BACKUP && existsSync(p) && !existsSync(p + ".bak")) {
    try {
      fss.copyFileSync(p, p + ".bak");
      logInfo(`📂 backup: ${rel(p)}.bak`);
    } catch (e) {
      logWarn(`could not backup ${rel(p)}: ${e.message}`);
    }
  }
  await fs.writeFile(p, text, "utf8");
}

const rel = (p) => path.relative(ROOT, p).replaceAll("\\", "/");

/* ─────────────────── File picking strategy ────────────── */

function targetDirs() {
  return DEFAULT_TARGET_DIRS.map(d => r(d)).filter(existsSync);
}

function shouldSkipPath(p) {
  const posix = rel(p);
  if (!isValidFilename(p)) return true;
  for (const skip of SKIP_PATH_SUBSTRINGS) {
    if (posix.includes(skip)) return true;
  }
  return false;
}

function extOK(p) {
  if (ONLY_EXT.length === 0) return true;
  const e = path.extname(p).toLowerCase();
  return ONLY_EXT.includes(e);
}

function listAllFilesSync(dir) {
  const stack = [dir];
  const files = [];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    let entries;
    try {
      entries = fss.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (IGNORE_DIRS.has(ent.name)) continue;
        if (shouldSkipPath(p)) continue;
        stack.push(p);
      } else if (ent.isFile()) {
        if (shouldSkipPath(p)) continue;
        if (extOK(p)) files.push(p);
      }
    }
  }
  return files;
}

function listGitSince(since) {
  const out = spawnSync("git", ["diff", "--name-only", since, "--"], { cwd: ROOT, encoding: "utf8" });
  if (out.status !== 0) return [];
  return out.stdout.split(/\r?\n/).filter(Boolean).map(p => r(p)).filter(p => existsSync(p) && extOK(p) && !shouldSkipPath(p));
}

/* ───────────────────── Patterns / Fixes ───────────────── */

const CODE_EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs"]);
const DATA_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const JSON_EXTS = new Set([".json"]);

/** Invisibles: NBSP, ZWSP, BOM, ThinSpace, NNBSP */
const INVIS = /[\u00A0\u200B\uFEFF\u2009\u202F]/g;

/** Common mojibake + project-specific corruptions */
const CP1252_FIXES = [
  [/—/g, "—"], [/–/g, "–"],
  [/'/g, "'"], [/'/g, "'"],
  [/"/g, '"'], [/â€\x9d/g, '"'], [/"/g, '"'],
  [/•/g, "•"], [/…/g, "…"], [/©/g, "©"],
  [/Â\s/g, ""], [//g, ""],
  // deep corruption variants
  [/'/g, "'"],
  [/ÃƒÂ¢Ã¢â€šÂ¬/g, '"'],
  [/ÃƒÆ’Ã†'Ãƒâ€\u20AC\u2122/g, "'"], // tolerant
];

/** Contentlayer cleanup */
const CONTENTLAYER_FIXES = [
  [/import\s+\{[^}]*\}\s+from\s+['"]contentlayer\/generated['"];?\s*/g, ""],
  [/\ballBooks\b/g, "[]"],
  [/\ballEvents\b/g, "[]"],
  [/\ballPrints\b/g, "[]"],
];

/** Emoji in code: force to unicode-escapes to avoid future mangling */
const EMOJI_ESCAPES = [
  [/\uD83D\uDCC4/g, "\\uD83D\\uDCC4"],
  [/\uD83D\uDCDA/g, "\\uD83D\\uDCDA"],
  [/\uD83D\uDD17/g, "\\uD83D\\uDD17"],
];

/** Apply pairs helper */
function applyPairs(text, pairs) {
  let out = text;
  for (const [re, repl] of pairs) out = out.replace(re, repl);
  return out;
}

/* ───────────── Front-matter helpers (minimal churn) ───── */

function splitFrontMatter(raw) {
  const m = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] ?? "" };
}

function kebab(s) {
  return s.replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

function titleCase(s) {
  return s.replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeFrontMatter(fm, ctx) {
  // Remove comments + trim trailing whitespace + invisibles + basic mojibake
  let out = fm;
  out = out.replace(/^\s*#.*$/gm, "");
  out = applyPairs(out, [[INVIS, ""], ...CP1252_FIXES]);
  out = out.replace(/[ \t]+$/gm, "");

  // Do NOT overwrite user-provided values—only fill gaps / fix obvious corruption.
  // Ensure quoted scalars where needed.
  out = out.replace(
    /^(\s*)(title|subtitle|category|author|type|coverImage|excerpt|slug)\s*:\s*([^"'\n\[\{][^\n#]*)$/gim,
    (_m, i, key, val) => `${i}${key}: "${val.trim().replace(/"/g, '\\"')}"`
  );

  // kind -> type (preserve original if both exist)
  if (!/^type\s*:/mi.test(out) && /^kind\s*:/mi.test(out)) {
    out = out.replace(/^(\s*)kind(\s*):/mi, "$1type$2:");
  }

  // inject missing slug/type based on path context
  if (!/^slug\s*:/mi.test(out)) {
    out = `slug: "${ctx.filenameSlug}"\n` + out;
  }
  if (!/^type\s*:/mi.test(out)) {
    const t = ctx.isDownload ? "download" : ctx.isBlog ? "blog" : ctx.isResource ? "guide" : "page";
    out = `type: "${t}"\n` + out;
  }

  // For downloads, make sure some baseline meta exists (non-destructive)
  if (ctx.isDownload) {
    if (!/^title\s*:/mi.test(out)) out = `title: "${titleCase(ctx.filenameSlug)}"\n` + out;
    if (!/^author\s*:/mi.test(out)) out = `author: "Abraham of London"\n` + out;
    if (!/^category\s*:/mi.test(out)) out = `category: "Resources"\n` + out;
    if (!/^readTime\s*:/mi.test(out)) out = `readTime: "2 min read"\n` + out;
    if (!/^date\s*:/mi.test(out)) out = `date: "2025-10-13"\n` + out;
  }

  return out.trimEnd();
}

/* ─────────────────── Files to restore ─────────────────── */

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
  }, // <-- IMPORTANT: Add the comma and ensure it's a freshly typed character
];

async function restoreFiles() {
  if (!RESTORE_FILES) return;
  for (const f of FILES_TO_RESTORE) {
    const p = r(f.path);
    if (!existsSync(p)) {
      await writeWithBackup(p, f.content);
      report.record("dataFixed", { file: rel(p), changes: ["restored"] });
      report.increment("filesModified");
      logInfo(`🗄️ restored missing: ${rel(p)}`);
    }
  }
}

/* ───────────────────── Report ─────────────────────────── */

class Report {
  constructor() {
    this.data = {
      startedAt: new Date().toISOString(),
      dryRun: DRY, applyFixes: FIX, strict: STRICT,
      fixLineEndings: FIX_LINE_ENDINGS, fixWhitespace: FIX_WHITESPACE,
      restoreFiles: RESTORE_FILES, removeContentlayer: REMOVE_CONTENTLAYER,
      filesScanned: 0, filesModified: 0,
      codeFixed: [], dataFixed: [], jsonFixed: [],
      fmMissingFields: [], notes: [],
      endedAt: null,
    };
  }
  record(key, value) { (this.data[key] ??= []).push(value); }
  increment(key) { this.data[key]++; }
  finalize() { this.data.endedAt = new Date().toISOString(); }
  get() { return this.data; }
}

const report = new Report();

/* ───────────── JSON tidy (package.json et al) ─────────── */

async function sanitizeJsonFile(p) {
  if (!existsSync(p)) return;
  let raw = await readText(p);
  const orig = raw;
  raw = raw.replace(/^\uFEFF/, "");
  raw = applyPairs(raw, [[INVIS, ""], ...CP1252_FIXES]);
  raw = normalizeTextContent(raw);

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) {
    report.record("notes", `JSON parse error in ${rel(p)}: ${e.message}`);
    return;
  }

  const pretty = JSON.stringify(parsed, null, 2) + "\n";
  if (pretty !== orig) {
    report.record("jsonFixed", { file: rel(p), changes: ["reformatted/mojibake/eol"] });
    report.increment("filesModified");
    if (FIX) await writeWithBackup(p, pretty);
  }
}

/* ───────────── Processors: code / data / json ─────────── */

async function processCode(p) {
  const orig = await readText(p);
  let fixed = orig;

  fixed = applyPairs(fixed, [[INVIS, ""], ...CP1252_FIXES, ...EMOJI_ESCAPES]);
  if (REMOVE_CONTENTLAYER) fixed = applyPairs(fixed, CONTENTLAYER_FIXES);

  // normalize node: imports → bare (optional; keep yours)
  fixed = fixed.replace(/import\s+(\w+)\s+from\s+["']node:(\w+)["']/g, 'import $1 from "$2"');

  fixed = normalizeTextContent(fixed);

  if (fixed !== orig) {
    report.increment("filesModified");
    report.record("codeFixed", { file: rel(p), changes: ["mojibake/contentlayer/eol"] });
    if (FIX) await writeWithBackup(p, fixed);
  }
}

async function processData(p) {
  const raw = await readText(p);
  let txt = normalizeTextContent(raw);
  const fmObj = splitFrontMatter(txt);
  if (!fmObj) {
    // still clean invisibles/mojibake outside FM
    const cleaned = applyPairs(txt, [[INVIS, ""], ...CP1252_FIXES]);
    if (cleaned !== raw) {
      report.increment("filesModified");
      report.record("dataFixed", { file: rel(p), changes: ["mojibake/eol"] });
      if (FIX) await writeWithBackup(p, cleaned);
    }
    return;
  }

  const filenameSlug = kebab(path.basename(p));
  const posix = rel(p);
  const ctx = {
    filenameSlug,
    isResource: posix.includes("content/resources/"),
    isDownload: posix.includes("content/downloads/") || posix.includes("/downloads/"),
    isBlog: posix.includes("content/blog/"),
  };

  let fmFixed = normalizeFrontMatter(fmObj.fm, ctx);
  let bodyFixed = applyPairs(fmObj.body, [[INVIS, ""], ...CP1252_FIXES]);
  bodyFixed = normalizeTextContent(bodyFixed);

  if (fmFixed !== fmObj.fm || bodyFixed !== fmObj.body) {
    const rebuilt = `---\n${fmFixed}\n---\n\n${bodyFixed}`;
    report.increment("filesModified");
    report.record("dataFixed", { file: rel(p), changes: ["front-matter/mojibake/eol"] });
    if (FIX) await writeWithBackup(p, rebuilt);
  }
}

/* ─────────────────── Orchestrator ─────────────────────── */

async function passFile(p) {
  report.increment("filesScanned");
  const ext = path.extname(p).toLowerCase();

  if (JSON_EXTS.has(ext) && path.basename(p).toLowerCase() === "package.json") {
    return sanitizeJsonFile(p);
  }
  if (CODE_EXTS.has(ext)) return processCode(p);
  if (DATA_EXTS.has(ext)) return processData(p);

  // default: still clean invisibles/mojibake lightly
  const raw = await readText(p);
  const cleaned = normalizeTextContent(applyPairs(raw, [[INVIS, ""], ...CP1252_FIXES]));
  if (cleaned !== raw) {
    report.increment("filesModified");
    report.record("dataFixed", { file: rel(p), changes: ["mojibake/eol"] });
    if (FIX) await writeWithBackup(p, cleaned);
  }
}

/* ─────────────── Concurrency runner ───────────────────── */

async function runQueue(items, max = 6, fn) {
  const q = [...items];
  const workers = Array.from({ length: max }, async () => {
    while (q.length) {
      const it = q.shift();
      try { await fn(it); }
      catch (e) {
        logErr(`process ${rel(it)}: ${e.message}`);
        report.record("notes", `Error processing ${rel(it)}: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
}

/* ─────────────── Companion: repair-encoding ───────────── */

async function runRepairEncoding() {
  if (DRY) return;
  logInfo("running repair-encoding.mjs …");
  const node = process.execPath; // the actual Node binary
  const script = r("scripts/repair-encoding.mjs");
  if (!existsSync(script)) {
    report.record("notes", "repair-encoding.mjs not found; skipped");
    return;
  }
  const args = [
    script, ".",
    "--fix-line-endings", String(FIX_LINE_ENDINGS),
    "--fix-whitespace",   String(FIX_WHITESPACE),
    "--restore-files",    String(RESTORE_FILES),
    "--remove-contentlayer", String(REMOVE_CONTENTLAYER),
  ];
  const out = spawnSync(node, args, { cwd: ROOT, stdio: "inherit" });
  if (out.status !== 0) {
    report.record("notes", `repair-encoding.mjs exited with ${out.status}`);
  }
}

/* ───────────── Formatters (best-effort) ───────────────── */

async function runFormatters() {
  if (DRY) return;
  logInfo("formatting with Prettier/ESLint …");
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  spawnSync(npx, ["--yes", "prettier", "-w", "."], { stdio: "inherit" });
  spawnSync(npx, ["--yes", "eslint", "--fix", "."], { stdio: "inherit" });
}

/* ─────────────────────── Logging ──────────────────────── */

function logInfo(msg){ console.log(msg); }
function logWarn(msg){ console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`); }
function logErr (msg){ console.error(`\x1b[31m✖ ${msg}\x1b[0m`); }

/* ───────────────────────── Main ───────────────────────── */

(async () => {
  logInfo(`\n🚀 Global Project Manager v2 `
    + `(dry=${DRY}, fix=${FIX}, strict=${STRICT}, since=${SINCE||'none'}, ext=${ONLY_EXT.join(",")||'all'}, conc=${CONCURRENCY})`);
  const dirs = targetDirs();
  logInfo(`Scanning dirs: ${dirs.map(rel).join(", ")}`);

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  await restoreFiles();

  // Resolve file set
  let files;
  if (SINCE) {
    files = listGitSince(SINCE);
  } else {
    files = dirs.flatMap(d => listAllFilesSync(d));
  }

  // process
  await runQueue(files, CONCURRENCY, passFile);

  // special JSONs
  await sanitizeJsonFile(r("package.json"));

  await runRepairEncoding();
  await runFormatters();

  report.finalize();
  const data = report.get();

  try {
    await writeText(REPORT_PATH, JSON.stringify(data, null, 2));
    logInfo(`📊 report: ${rel(REPORT_PATH)}`);
  } catch (e) {
    logErr(`failed to write report: ${e.message}`);
  }

  logInfo("\n──────────── Summary ────────────");
  logInfo(`Scanned:    ${data.filesScanned}`);
  logInfo(`Modified:   ${data.filesModified}${DRY ? " (dry-run)" : ""}`);
  logInfo(`Report:     ${rel(REPORT_PATH)}`);
  logInfo("────────────────────────────────\n");

  if (STRICT && (data.fmMissingFields.length)) {
    logErr("strict mode: failing due to front-matter issues");
    process.exit(1);
  }
  process.exit(0);
})();