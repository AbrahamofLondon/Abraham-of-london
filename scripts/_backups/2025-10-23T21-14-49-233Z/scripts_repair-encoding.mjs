/*
  Enhanced repo-wide mojibake and encoding repair (binary-safe).
  Usage:
    node scripts/repair-encoding.mjs [path=.]
      [--dry-run]             # Log changes without applying
      [--ext .ts,.tsx,.js,.jsx,.md,.mdx,.json,.css,.html,.xml,.txt] # File extensions
      [--include "content,components,pages,lib"] # Directories to include
      [--exclude "public/downloads,node_modules,.next,.git"] # Directories to exclude
      [--since "HEAD~30"]     # Only files changed since git rev
      [--no-backup]           # Don't write .bak files
      [--report "repair-report.json"] # Output detailed repair report
      [--fix-line-endings]    # Normalize to LF line endings
      [--fix-whitespace]      # Remove trailing whitespace
      [--restore-files]       # Restore missing critical files
      [--remove-contentlayer] # Remove Contentlayer imports
*/

import fs from "node:fs/promises";
import path from "path";
import { spawnSync } from "node:child_process";

// ---------- CLI ----------
const args = new Set(process.argv.slice(2));
const getArg = (name, def = null) => {
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  }
  return args.has(name) ? true : def;
};

const ROOT = process.argv.slice(2).find((p) => !p.startsWith("--")) || ".";
const DRY_RUN = getArg("--dry-run");
const NO_BACKUP = getArg("--no-backup");
const FIX_LINE_ENDINGS = getArg("--fix-line-endings");
const FIX_WHITESPACE = getArg("--fix-whitespace");
const RESTORE_FILES = getArg("--restore-files");
const REMOVE_CONTENTLAYER = getArg("--remove-contentlayer");
const REPORT_FILE = getArg("--report", "repair-report.json");
const EXT_LIST = (getArg("--ext", ".ts,.tsx,.js,.jsx,.md,.mdx,.json,.css,.html,.xml,.txt"))
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const INCLUDE_DIRS = (getArg("--include", "content,components,pages,lib,scripts"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_EXCLUDES = ["node_modules", ".git", ".next", "public/downloads", "out"];
const EXCLUDE_DIRS = (getArg("--exclude", DEFAULT_EXCLUDES.join(",")))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SINCE = getArg("--since", "HEAD~30");

// ---------- Helpers ----------
const u8 = (s) => Buffer.from(s, "utf8");
const EMPTY = Buffer.alloc(0);

// Heuristic: probably binary if NUL present or high non-text byte ratio
function isProbablyBinary(buf, sample = 2048) {
  const len = Math.min(buf.length, sample);
  let nul = 0, weird = 0;
  for (let i = 0; i < len; i++) {
    const b = buf[i];
    if (b === 0x00) nul++;
    const isTextish =
      b === 0x09 || b === 0x0a || b === 0x0d || // tab/lf/cr
      (b >= 0x20 && b <= 0x7E) || // ASCII printable
      (b >= 0x80); // UTF-8/extended
    if (!isTextish) weird++;
  }
  if (nul > 0) return true;
  return weird / len > 0.4;
}

// Normalize encoding: Convert UTF-16LE/BE to UTF-8, strip UTF-8 BOM
function normalizeEncodingForWrite(buf) {
  if (buf.length >= 2) {
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
      // UTF-16 LE BOM
      const asU16 = buf.slice(2).toString("utf16le");
      return Buffer.from(asU16, "utf8");
    }
    if (buf[0] === 0xFE && buf[1] === 0xFF) {
      // UTF-16 BE BOM
      const tmp = Buffer.alloc(buf.length - 2);
      for (let i = 2; i < buf.length; i += 2) {
        tmp[i - 2] = buf[i + 1];
        tmp[i - 1] = buf[i];
      }
      const asU16 = tmp.toString("utf16le");
      return Buffer.from(asU16, "utf8");
    }
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      // UTF-8 BOM
      return buf.slice(3);
    }
  }
  return buf;
}

// Normalize line endings to LF and remove trailing whitespace
function normalizeTextContent(content) {
  let result = content;
  if (FIX_LINE_ENDINGS) {
    result = result.replace(/\r\n/g, "\n");
  }
  if (FIX_WHITESPACE) {
    result = result.replace(/[ \t]+$/gm, "");
  }
  return result;
}

// Accurate buffer replacement with match counting
function replaceAllBuf(haystack, needle, replacement) {
  let parts = [];
  let idx = 0;
  let count = 0;
  while (true) {
    const found = haystack.indexOf(needle, idx);
    if (found === -1) break;
    parts.push(haystack.slice(idx, found), replacement);
    idx = found + needle.length;
    count++;
  }
  if (count === 0) return { buf: haystack, count: 0 };
  parts.push(haystack.slice(idx));
  return { buf: Buffer.concat(parts), count };
}

// Remove Contentlayer imports and references
function removeContentlayer(content) {
  return content
    .replace(/import \{.*?\} from ['"]contentlayer\/generated['"]/g, "")
    .replace(/\ballBooks\b/g, "[]")
    .replace(/\ballEvents\b/g, "[]")
    .replace(/\ballPrints\b/g, "[]");
}

// ---------- Sequence Registry ----------
const SEQS = [
  // From fix-corrupted-files.ps1 and fix_encoding.js
  { corrupt: u8("correct: u8("'") },
  { corrupt: u8("correct: u8("-") },
  { corrupt: u8("correct: u8("'") },
  { corrupt: u8("correct: u8('"') },
  { corrupt: u8("correct: u8('"') },
  { corrupt: u8("correct: u8('"') },
  { corrupt: u8("correct: u8("-") },
  { corrupt: u8("correct: u8('"') },
  { corrupt: u8(""), correct: EMPTY },
  { corrupt: u8("correct: u8('"') },
  { corrupt: u8("'"), correct: u8("'") },
  // From original repair-encoding.mjs (deep corruption)
  {
    corrupt: Buffer.from([
      0xC3,0x83,0xC6,0x92,0xC3,0xA2,0xE2,0x82,0xAC,0xC5,0xBD,0xCB,0x9C,0xC3,0x83,0xC6,0x92,0xC3,0xA2,
      0xE2,0x82,0xAC,0xC5,0xBD,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA2,0xC3,0x83,0xCB,0x9C,0xC3,0xA2,
      0xE2,0x82,0xAC,0xC5,0xA1,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA2,0xC3,0x83,
      0xE2,0x80,0xA0,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,
      0xC3,0x82,0xC2,0xA2,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,
      0xA2,0xC3,0x83,0xE2,0x80,0xA0,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA2,0xC3,
      0x83,0xC6,0x92,0xC3,0x82,0xC2,0xAC,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA2,0xC3,0x83,0xE2,0x80,
      0xA0,0xC3,0x82,0xC2,0xAC
    ]),
    correct: u8("'")
  },
  {
    corrupt: Buffer.from([0xC3,0x83,0xC6,0x92,0xC3,0xA2,0xE2,0x82,0xAC,0xC5,0xBD,0xCB,0x9C,0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA2,0xC3,0x83,0xE2,0x80,0xA0,0xC3,0x82,0xC2,0xAC,0xC3,0x85,0xC2,0xA6]),
    correct: EMPTY
  },
  { corrupt: Buffer.from([0xE2,0x80,0x99]), correct: u8("'") },
  { corrupt: Buffer.from([0xE2,0x80,0x9C]), correct: u8('"') },
  { corrupt: Buffer.from([0xE2,0x80,0x9D]), correct: u8('"') },
  { corrupt: Buffer.from([0xE2,0x80,0xA6]), correct: u8("...") },
  { corrupt: Buffer.from([0xC2,0xA0]), correct: EMPTY }, // NBSP
  { corrupt: Buffer.from([0xE2,0x80,0x8B]), correct: EMPTY }, // ZWSP
  { corrupt: Buffer.from([0xEF,0xBB,0xBF]), correct: EMPTY }, // UTF-8 BOM
  { corrupt: Buffer.from([0xC3,0x83,0xC2,0xA2,0xE2,0x82,0xAC,0xC5,0xA1,0xC3,0x82,0xC2,0xAC]), correct: EMPTY },
  { corrupt: Buffer.from([0xC3,0x83,0xC6,0x92,0xC3,0xA2,0xE2,0x82,0xAC,0xC5,0xBD,0xCB,0x9C,0xC3,0x83,0xC2,0xA2]), correct: EMPTY }
];

// Emoji to Unicode escapes for code files
const EMOJI_ESCAPES = [
  { find: u8("\uD83D\uDCC4"), replace: u8("\\uD83D\\uDCC4") },
  { find: u8("\uD83D\uDCDA"), replace: u8("\\uD83D\\uDCDA") },
  { find: u8("\uD83D\uDD17"), replace: u8("\\uD83D\\uDD17") },
];

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
category: strategy
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

// ---------- Core ----------
async function shouldVisitFile(fp) {
  const ext = path.extname(fp).toLowerCase();
  if (EXT_LIST.length && !EXT_LIST.includes(ext)) return false;
  return true;
}

async function shouldVisitDir(dir, rel) {
  const base = path.basename(dir);
  if (EXCLUDE_DIRS.includes(base)) return false;
  if (INCLUDE_DIRS.length === 0) return true;
  return INCLUDE_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`));
}

async function listChangedSince(root, since) {
  try {
    const out = spawnSync("git", ["diff", "--name-only", since, "--", "."], {
      cwd: root,
      encoding: "utf8",
    });
    if (out.status !== 0) {
      console.warn(`⚠️ Git diff failed for ${since}, falling back to full scan`);
      return null;
    }
    return out.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => path.join(root, p));
  } catch (e) {
    console.warn(`⚠️ Error running git diff: ${e.message}, falling back to full scan`);
    return null;
  }
}

async function walkAll(root) {
  const result = [];
  const stack = [{ abs: path.resolve(root), rel: "" }];
  while (stack.length) {
    const { abs, rel } = stack.pop();
    let stats;
    try {
      stats = await fs.stat(abs);
    } catch {
      console.warn(`⚠️ Skipping inaccessible path: ${abs}`);
      continue;
    }
    if (!stats.isDirectory()) {
      if (await shouldVisitFile(abs)) result.push(abs);
      continue;
    }
    if (!(await shouldVisitDir(abs, rel))) continue;
    let items;
    try {
      items = await fs.readdir(abs, { withFileTypes: true });
    } catch {
      console.warn(`⚠️ Skipping inaccessible directory: ${abs}`);
      continue;
    }
    for (const it of items) {
      const nextAbs = path.join(abs, it.name);
      const nextRel = rel ? `${rel}/${it.name}` : it.name;
      stack.push({ abs: nextAbs, rel: nextRel });
    }
  }
  return result;
}

async function ensureBackup(pathAbs) {
  if (NO_BACKUP) return;
  const bak = `${pathAbs}.bak`;
  try {
    if (!(await fs.access(bak).then(() => true).catch(() => false))) {
      await fs.copyFile(pathAbs, bak);
      console.log(`📂 Created backup: ${bak}`);
    }
  } catch (e) {
    console.error(`❌ Error creating backup for ${pathAbs}: ${e.message}`);
  }
}

async function restoreFiles() {
  if (!RESTORE_FILES) return;
  for (const { path: filePath, content } of FILES_TO_RESTORE) {
    const absPath = path.join(ROOT, filePath);
    try {
      if (!(await fs.access(absPath).then(() => true).catch(() => false))) {
        await fs.mkdir(path.dirname(absPath), { recursive: true });
        await fs.writeFile(absPath, content);
        console.log(`🗄️ Restored missing file: ${filePath}`);
      }
    } catch (e) {
      console.error(`❌ Error restoring ${filePath}: ${e.message}`);
    }
  }
}

async function processFile(pathAbs) {
  let raw;
  try {
    raw = await fs.readFile(pathAbs);
  } catch (e) {
    return { skipped: true, path: pathAbs, error: `Read error: ${e.message}` };
  }
  const beforeLen = raw.length;

  if (isProbablyBinary(raw)) {
    return { skipped: true, path: pathAbs, error: "Binary file detected" };
  }

  let buf = normalizeEncodingForWrite(raw);
  let changed = buf !== raw;
  let totalMatches = 0;
  const matchDetails = [];

  for (const { corrupt, correct } of SEQS) {
    const { buf: next, count } = replaceAllBuf(buf, corrupt, correct);
    if (count > 0) {
      changed = true;
      totalMatches += count;
      matchDetails.push({ corrupt: corrupt.toString("hex"), count });
      buf = next;
    }
  }

  let text = buf.toString("utf8");
  if (REMOVE_CONTENTLAYER && pathAbs.match(/\.(ts|tsx)$/)) {
    const newText = removeContentlayer(text);
    if (newText !== text) {
      changed = true;
      matchDetails.push({ corrupt: "Contentlayer imports", count: 1 });
      text = newText;
    }
  }

  if (FIX_LINE_ENDINGS || FIX_WHITESPACE) {
    const newText = normalizeTextContent(text);
    if (newText !== text) {
      changed = true;
      matchDetails.push({ corrupt: "Line endings/whitespace", count: 1 });
      text = newText;
    }
    buf = u8(text);
  }

  const codeExts = new Set([".ts", ".tsx", ".js", ".jsx"]);
  if (codeExts.has(path.extname(pathAbs).toLowerCase())) {
    for (const { find, replace } of EMOJI_ESCAPES) {
      const { buf: next, count } = replaceAllBuf(buf, find, replace);
      if (count > 0) {
        changed = true;
        totalMatches += count;
        matchDetails.push({ corrupt: find.toString("hex"), count });
        buf = next;
      }
    }
  }

  if (changed && !DRY_RUN) {
    await ensureBackup(pathAbs);
    await fs.writeFile(pathAbs, buf);
  }

  return {
    skipped: false,
    path: pathAbs,
    changed,
    matches: totalMatches,
    sizeDelta: buf.length - beforeLen,
    matchDetails,
  };
}

async function writeReport(report) {
  try {
    await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`📊 Report written to: ${REPORT_FILE}`);
  } catch (e) {
    console.error(`❌ Error writing report: ${e.message}`);
  }
}

// ---------- Run ----------
(async () => {
  console.log(`\n🧽 Starting audit in: ${path.resolve(ROOT)}`);
  console.log(`  dry-run: ${DRY_RUN ? "yes" : "no"}`);
  console.log(`  ext: ${EXT_LIST.join(", ")}`);
  if (INCLUDE_DIRS.length) console.log(`  include: ${INCLUDE_DIRS.join(", ")}`);
  console.log(`  exclude: ${EXCLUDE_DIRS.join(", ")}`);
  if (SINCE) console.log(`  since: ${SINCE}`);
  console.log(`  fix-line-endings: ${FIX_LINE_ENDINGS ? "yes" : "no"}`);
  console.log(`  fix-whitespace: ${FIX_WHITESPACE ? "yes" : "no"}`);
  console.log(`  restore-files: ${RESTORE_FILES ? "yes" : "no"}`);
  console.log(`  remove-contentlayer: ${REMOVE_CONTENTLAYER ? "yes" : "no"}`);
  console.log(`  report: ${REPORT_FILE}`);

  await restoreFiles();

  let candidates = SINCE ? await listChangedSince(ROOT, SINCE) : null;
  if (!candidates) candidates = await walkAll(ROOT);

  let filesChecked = 0;
  let filesChanged = 0;
  let totalMatches = 0;
  const report = [];

  for (const fp of candidates) {
    try {
      if (!(await fs.access(fp).then(() => true).catch(() => false))) {
        console.warn(`⚠️ Skipping missing file: ${fp}`);
        continue;
      }
      if (!(await shouldVisitFile(fp))) continue;
      const r = await processFile(fp);
      if (r.skipped) {
        // console.log(`⏭️ Skipped: ${path.relative(ROOT, fp)} (${r.error})`); // Too verbose
        continue;
      }
      filesChecked++;
      if (r.changed) {
        filesChanged++;
        totalMatches += r.matches;
        console.log(
          `🛠  ${DRY_RUN ? "Would fix" : "Fixed"}: ${path.relative(ROOT, fp)} (matches: ${r.matches}, Δ: ${r.sizeDelta})`
        );
        // if (r.matchDetails.length) { // Too verbose
        //   console.log(`  Details: ${JSON.stringify(r.matchDetails, null, 2)}`);
        // }
      }
      report.push(r);
    } catch (e) {
      console.error(`❌ Error processing ${fp}: ${e.message}`);
      report.push({ path: fp, error: e.message });
    }
  }

  console.log("\n✅ Audit complete.");
  console.log(`  Files checked: ${filesChecked}`);
  console.log(`  Files changed${DRY_RUN ? " (would)" : ""}: ${filesChanged}`);
  console.log(`  Total replacements: ${totalMatches}`);

  await writeReport(report);
  process.exit(0);
})();