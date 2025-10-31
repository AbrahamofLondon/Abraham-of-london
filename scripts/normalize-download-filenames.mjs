#!/usr/bin/env node
/**
 * Normalize /public/downloads filenames:
 *  - Title_Case / spaces → kebab-case
 *  - emits redirects snippet (from old → new) to paste into netlify.toml
 *  - optional: updates references across repo (MDX/TS/JS/etc)
 *
 * Usage (dry-run by default):
 *   node scripts/normalize-download-filenames.mjs
 *
 * Actually rename files:
 *   node scripts/normalize-download-filenames.mjs --write
 *
 * Use git moves if available (nice history):
 *   node scripts/normalize-download-filenames.mjs --write --git
 *
 * Also update references across repo (MDX/TS/JS/etc):
 *   node scripts/normalize-download-filenames.mjs --write --fix-refs
 *
 * Options:
 *   --dir=public/downloads     Source directory (default)
 *   --root=.                   Repo root (default ".")
 *   --out=scripts/output       Output folder for logs/snippets (default)
 *   --backup                   When --fix-refs, write .bak next to changed files
 */

import fs from "fs/promises";
import fscb from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile as execFileCb } from "child_process";
import { promisify } from "util";

const execFile = promisify(execFileCb);

// ---------------- CLI args ----------------
const parseArgs = () => {
  const out = {};
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const [k, v] = raw.replace(/^--/, "").split("=");
    out[k] = v === undefined ? true : v;
  }
  return out;
};
const args = parseArgs();

const WRITE = Boolean(args.write);
const USE_GIT = Boolean(args.git);
const FIX_REFS = Boolean(args["fix-refs"]);
const BACKUP = Boolean(args.backup);

const ROOT = path.resolve(args.root || ".");
const DL_DIR = path.resolve(ROOT, args.dir || "public/downloads");
const OUT_DIR = path.resolve(ROOT, args.out || "scripts/output");

// ---------------- helpers ----------------
const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
};

const isPdf = (p) => /\.pdf$/i.test(p);

const kebabize = (base) => {
  // drop extension if present
  const name = base.replace(/\.pdf$/i, "");
  return (
    name
      .replace(/[\s_]+/g, "-") // spaces/underscores → hyphen
      .replace(/[^a-zA-Z0-9-]+/g, "-") // strip other punctuation
      .replace(/-+/g, "-") // collapse dup hyphens
      .replace(/(^-|-$)/g, "") // trim hyphens
      .toLowerCase() + ".pdf"
  );
};

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const gitAvailable = async () => {
  try {
    await execFile("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
};

const mv = async (fromAbs, toAbs) => {
  if (USE_GIT && (await gitAvailable())) {
    try {
      await execFile("git", ["mv", "-f", fromAbs, toAbs]);
      return;
    } catch {
      // fall through to fs.rename
    }
  }
  await fs.rename(fromAbs, toAbs);
};

const readText = async (p) => fs.readFile(p, "utf8");
const writeText = async (p, s) => fs.writeFile(p, s, "utf8");

// Walk repo for text files (fallback if glob not present)
const TEXT_EXTS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".toml",
  ".yaml",
  ".yml",
  ".css",
  ".html",
]);

const shouldScan = (file) => {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return false;
  // ignore build outputs/node_modules
  if (/(^|\/)\.next\//.test(file)) return false;
  if (/(^|\/)node_modules\//.test(file)) return false;
  if (/(^|\/)dist\//.test(file)) return false;
  if (/(^|\/)\.git\//.test(file)) return false;
  return true;
};

const walkFiles = async (dir, out = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip heavy dirs
      if ([".next", "node_modules", "dist", ".git"].includes(e.name)) continue;
      await walkFiles(p, out);
    } else {
      if (shouldScan(p)) out.push(p);
    }
  }
  return out;
};

// Pretty TS timestamp
const nowStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

// ---------------- main ----------------
(async () => {
  console.log("- normalize-download-filenames -");
  console.log(`root: ${ROOT}`);
  console.log(`dir : ${DL_DIR}`);
  console.log(
    `mode: ${WRITE ? "WRITE" : "DRY-RUN"}${USE_GIT ? " (git mv)" : ""}${FIX_REFS ? " + FIX-REFS" : ""}`,
  );
  console.log("");

  await ensureDir(OUT_DIR);

  // 1) scan downloads
  let files = await fs.readdir(DL_DIR);
  files = files.filter(isPdf);

  if (files.length === 0) {
    console.log("No PDFs found in public/downloads - nothing to do.");
    process.exit(0);
  }

  // 2) compute rename plan
  const plan = [];
  const taken = new Set(files.map((f) => f.toLowerCase())); // existing lowercase names to detect clashes

  for (const oldName of files) {
    const newNameBase = kebabize(oldName);
    let candidate = newNameBase;
    let idx = 2;

    // resolve collisions (case-insensitive file systems or duplicates)
    while (
      taken.has(candidate.toLowerCase()) &&
      candidate.toLowerCase() !== oldName.toLowerCase()
    ) {
      const stem = newNameBase.replace(/\.pdf$/i, "");
      candidate = `${stem}-${idx}.pdf`;
      idx++;
    }

    if (candidate.toLowerCase() !== oldName.toLowerCase()) {
      plan.push({ from: oldName, to: candidate });
      taken.add(candidate.toLowerCase());
    }
  }

  if (plan.length === 0) {
    console.log("All filenames already kebab-case - nothing to rename.");
  } else {
    console.log("Planned renames:");
    for (const { from, to } of plan) {
      console.log(`  • ${from}  →  ${to}`);
    }
  }

  // 3) perform renames
  if (WRITE && plan.length > 0) {
    console.log("\nRenaming files...");
    for (const { from, to } of plan) {
      const fromAbs = path.join(DL_DIR, from);
      const toAbs = path.join(DL_DIR, to);
      await mv(fromAbs, toAbs);
      console.log(`  mv ${from} → ${to}`);
    }
  } else if (!WRITE && plan.length > 0) {
    console.log(
      "\n(DRY-RUN) No files were changed. Re-run with --write to apply.",
    );
  }

  // 4) emit redirects snippet
  const stamp = nowStamp();
  const redirects = [
    `# Generated ${stamp} - paste into netlify.toml`,
    `# Old Title_Case → new kebab-case (200 rewrites keep old links working)`,
    ...plan.map(({ from, to }) =>
      [
        `[[redirects]]`,
        `  from   = "/downloads/${from}"`,
        `  to     = "/downloads/${to}"`,
        `  status = 200`,
        ``,
      ].join("\n"),
    ),
  ].join("\n");

  const mapJson = JSON.stringify(
    { generatedAt: stamp, dir: path.relative(ROOT, DL_DIR), renames: plan },
    null,
    2,
  );

  await ensureDir(OUT_DIR);
  const redirPath = path.join(OUT_DIR, `downloads-redirects-${stamp}.toml`);
  const mapPath = path.join(OUT_DIR, `downloads-renames-${stamp}.json`);
  await writeText(redirPath, redirects);
  await writeText(mapPath, mapJson);

  console.log(`\nWrote redirects snippet → ${path.relative(ROOT, redirPath)}`);
  console.log(`Wrote rename map       → ${path.relative(ROOT, mapPath)}`);

  // 5) optionally fix references
  if (FIX_REFS && plan.length > 0) {
    console.log("\nScanning repository for references...");

    // Build simple string replacers
    // replace "/downloads/Old_Name.pdf" → "/downloads/new-name.pdf"
    // and bare "Old_Name.pdf" → "new-name.pdf" (safer when inside /downloads contexts)
    const replacements = [];
    for (const { from, to } of plan) {
      const exact = [`/downloads/${from}`, `/downloads/${to}`];
      replacements.push({ find: exact[0], replace: exact[1] });
      replacements.push({ find: from, replace: to }); // bare filename
    }

    // Walk project
    const all = await walkFiles(ROOT);
    let changedFiles = 0;
    for (const file of all) {
      let src = await readText(file);
      let next = src;

      for (const { find, replace } of replacements) {
        // plain string replace across file
        if (next.includes(find)) next = next.split(find).join(replace);
      }

      if (next !== src) {
        changedFiles++;
        if (BACKUP && WRITE) {
          await fs.copyFile(file, `${file}.bak`);
        }
        if (WRITE) {
          await writeText(file, next);
          console.log(`  updated: ${path.relative(ROOT, file)}`);
        } else {
          console.log(`  (dry-run) would update: ${path.relative(ROOT, file)}`);
        }
      }
    }

    console.log(
      `\n${WRITE ? "Updated" : "Would update"} ${changedFiles} file(s) with new kebab-case links.`,
    );
  }

  console.log("\nDone.");
})();
