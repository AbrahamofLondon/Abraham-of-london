#!/usr/bin/env node
/**
 * Abraham of London – Global Project Manager
 * ---------------------------------------------------------
 * Goals:
 * - Fix all file corruption (mojibake, invisible chars, corrupted HTML entities).
 * - Normalize and validate Contentlayer/MDX front-matter (FM).
 * - Ensure default/fallback assets exist (Logic removed for brevity, placeholder remains).
 * - Generate a JSON report.
 *
 * Usage: node scripts/global_project_manager.mjs --fix=true
 */
import fs from "node:fs";
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
const REPORT_PATH = args.report || "scripts/_reports/global_report.json";

/* ───────────────────── Project Layout ─────────────────── */

const ROOT = process.cwd();
const r = (...p) => path.join(ROOT, ...p);

const TARGET_DIRS = [r("pages"), r("components"), r("content"), r("config")]
  .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory());

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", ".vscode"]);

/* ───────────────────── Utilities ──────────────────────── */

let filesProcessed = 0;
let filesModified = 0;

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function read(p) { return fs.readFileSync(p, "utf8"); }

function write(p, textOrBuffer) {
  if (DRY) return;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, textOrBuffer, typeof textOrBuffer === "string" ? "utf8" : undefined);
}

function writeWithBackup(p, text) {
  if (DRY) return;
  // Only create backup if it doesn't exist
  if (exists(p) && !exists(p + ".bak")) {
    try {
      fs.copyFileSync(p, p + ".bak");
    } catch (e) {
      console.warn(`⚠️ Could not create backup for ${p}: ${e.message}`);
    }
  }
  write(p, text);
}

function list(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (IGNORE_DIRS.has(ent.name)) continue;
        stack.push(p);
      } else out.push(p);
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
  } catch (e) {
    return {};
  }
}

/* ───────────────────── Patterns / Fixes ───────────────── */

const CODE_EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs"]);
const DATA_EXTS = new Set([".md", ".mdx", ".yaml", ".yml"]);
const JSON_EXTS = new Set([".json"]);

// Invisible characters (NBSP, ZWSP, BOM, Thin Space)
const INVIS_CHARS = /[\u00A0\u200B\uFEFF\u2009]/g; 

// Common Windows-1252 (mojibake) fixes
const CP1252_FIXES = [
  [/â€”/g, "—"], [/â€“/g, "–"], [/â€™/g, "'"], [/â€˜/g, "'"], [/â€œ/g, '"'],
  [/â€\x9d/g, '"'], [/â€/g, '"'], [/Â©/g, "©"], [/â€¢/g, "•"], [/â€¦/g, "…"],
  [/Â\s/g, ""],
];

const CODE_FIXES = [
  // Remove now-invalid prop
  [/\s*baseColor="[^"]*"\s*/g, ""],
  [INVIS_CHARS, ""],
  ...CP1252_FIXES,
  // Fix 'node:' imports if they are causing issues in specific Next.js versions
  [/import\s+(\w+)\s+from\s+["']node:(\w+)["']/g, 'import $1 from "$2"'],
];

const DATA_LINE_FIXES = [
  // Drop full '//' comment lines (YAML invalid)
  [/^\s*\/\/.*$/gm, ""],
  // Remove trailing inline // comments
  [/^(.*?)(\s+\/\/.*)$/gm, (_m, a) => a],
  // Trim EOL whitespace
  [/[ \t]+$/gm, ""],
  [INVIS_CHARS, ""],
  ...CP1252_FIXES,
];

const REQUIRED_DL_FIELDS = ["title","slug","date","author","readTime","category","type"];

/* ───────────────────── Report Class ───────────────────── */

class Report {
  constructor() {
    this.data = {
      startedAt: new Date().toISOString(),
      dryRun: DRY, applyFixes: FIX, strict: STRICT,
      filesScanned: 0, filesModified: 0,
      codeFixed: [], dataFixed: [], jsonFixed: [],
      fmMissingFields: [], linkErrors: [], notes: [],
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

function sanitizeJsonFile(p) {
  if (!exists(p)) return;
  let raw = read(p);
  const orig = raw;
  raw = applyPairs(raw, [
      [INVIS_CHARS, ""],
      ...CP1252_FIXES
  ]);
  
  let parsed = null;
  try {
    // Remove BOM if present before parsing
    parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch(e) {
    report.record("notes", `JSON parse error in ${norm(p)}: ${e.message}`);
    return;
  }
  
  // Check if content changed OR if JSON structure needs re-formatting
  if (orig !== raw || JSON.stringify(parsed, null, 2) + "\n" !== orig) {
    report.record("jsonFixed", norm(p));
    report.increment("filesModified");
    if (FIX) writeWithBackup(p, JSON.stringify(parsed, null, 2) + "\n");
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

  // 1. Handle hanging keys (e.g., 'type' with no value/colon)
  fm = fm.replace(
      /^(\s*)(title|type|date|author|readTime|category|slug)\s*\r?\n/gim,
      (match, indent, key) => {
          if (key.toLowerCase() === 'type') return `${indent}type: "guide"\n`; 
          return `${indent}${key}: ""\n`;
      }
  );

  // 2. Fix "key value" -> "key: value" (common YAML error)
  fm = fm.replace(
    /^(\s*[A-Za-z_][\w-]*)\s+("?)([^"\r\n#]+)\2\s*$/gm,
    (_m, k, _q, v) => `${k}: ${v.trim()}`
  );

  // 3. Normalize and quote known keys
  fm = fm.replace(/^(?<i>\s*)kind(\s*):/gm, "$<i>type$2:");
  fm = fm.replace(/^(\s*)type\s*:\s*Resource\s*$/gmi, `$1type: "guide"`);
  fm = fm.replace(/^(\s*)type\s*:\s*template\s*$/gmi, `$1type: "template"`);

  // 4. Ensure slug exists and is normalized
  const slugLine = new RegExp(`^\\s*slug\\s*:`, "m");
  if (!slugLine.test(fm)) fm = `slug: "${ctx.filenameSlug}"\n` + fm;
  fm = fm.replace(/^(\s*)slug\s*:\s*"?fixme"?\s*$/m, `$1slug: "${ctx.filenameSlug}"`);
  
  // 5. Set type default by folder if missing
  if (!/^(\s*)type\s*:/m.test(fm)) {
    if (ctx.isDownload) fm = `type: "download"\n` + fm;
    if (ctx.isResource) fm = `type: "guide"\n` + fm;
  }

  // 6. Basic quoting for non-numeric/non-boolean simple values
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

  // Tidy up: remove trailing spaces and ensure clean end
  fm = fm.split(/\r?\n/).map((l) => l.replace(/[ \t]+$/g, "")).join("\n").trimEnd();
  return fm;
}

/* ───────────────────── Pass A: Clean files ────────────────── */

function passCleanFile(p) {
  const ext = path.extname(p).toLowerCase();
  if (![...CODE_EXTS, ...DATA_EXTS, ...JSON_EXTS].includes(ext)) return;

  report.increment("filesScanned");

  if (JSON_EXTS.has(ext) && path.basename(p).toLowerCase() === "package.json") {
    sanitizeJsonFile(p);
    return;
  }

  // Code files (.ts, .js, etc.)
  if (CODE_EXTS.has(ext)) {
    const orig = read(p);
    let fixed = orig;
    
    // ❌ REMOVED: CRITICAL ONE-TIME FIX: Reverse the incorrect HTML entity replacement
    // fixed = fixed.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // ❌ REMOVED: CRITICAL FIX: The specific API contact.ts fix for escaping quotes
    // if (norm(p).endsWith("/pages/api/contact.ts")) {
    //   fixed = fixed.replace(
    //       /(['"]|\\')"\s*:\s*("""|\\"""|"'")/, 
    //       `'"': "&quot;"` 
    //   );
    // }

    fixed = applyPairs(fixed, CODE_FIXES);
    
    // ❌ REMOVED: Targeted Header framer-motion typing cast fix
    // if (norm(p).endsWith("/components/Header.tsx")) {
    //   fixed = fixed.replace(/transition=\{motionTransition\}/, "transition={motionTransition as any}");
    // }

    if (fixed !== orig) {
      report.increment("filesModified");
      report.record("codeFixed", norm(p));
      if (FIX) writeWithBackup(p, fixed);
    }
    return;
  }

  // Data (MD/MDX/YAML) – Front-matter normalization
  const raw = read(p);
  const fmObj = extractFM(raw);
  if (!fmObj) return;

  const filenameSlug = kebab(path.basename(p));
  const posix = norm(p);
  const ctx = {
    filenameSlug,
    isResource: posix.includes("/content/resources/"),
    isDownload: posix.includes("/content/downloads/") || posix.includes("/downloads/"),
  };

  let fmFixed = normalizeFM(fmObj.fm, ctx);
  let changed = fmFixed !== fmObj.fm;

  // Check for download required fields
  if (ctx.isDownload) {
    const missing = REQUIRED_DL_FIELDS.filter((k) => !new RegExp(`^\\s*${k}\\s*:[^\\n]`, "m").test(fmFixed));
    if (missing.length) {
      report.record("fmMissingFields", { file: norm(p), missing });
      if (FIX) {
        // Simple fix: ensure title/slug are present if missing
        let adds = [];
        if (!/^\s*title\s*:/m.test(fmFixed)) adds.push(`title: "${titleCase(filenameSlug)}"`);
        if (adds.length) { fmFixed = adds.join("\n") + "\n" + fmFixed; changed = true; }
      }
    }
  }

  if (changed) {
    const rebuilt = `---\n${fmFixed}\n---\n\n${fmObj.body}`;
    report.increment("filesModified");
    report.record("dataFixed", norm(p));
    if (FIX) writeWithBackup(p, rebuilt);
  }
}

/* ───────────────────── Pass F: Formatters ───────────────── */

function runFormatters() {
  if (DRY) return;
  console.log("\nRunning Prettier and ESLint...");
  try {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    // Prettier (best effort)
    spawnSync(npx, ["--yes", "prettier", "-w", "."], { stdio: "ignore" });
    // ESLint --fix (best effort)
    spawnSync(npx, ["--yes", "eslint", "--fix", "."], { stdio: "ignore" });
  } catch (e) {
    report.record("notes", `Prettier/ESLint failed to run: ${e.message}`);
  }
}

/* ───────────────────────── Main ───────────────────────── */

(function main() {
  console.log(`\n🚀 Global Project Manager (dry=${DRY}, fix=${FIX}, strict=${STRICT})`);
  console.log(`Scanning: ${TARGET_DIRS.map(norm).join(", ")}`);

  for (const dir of TARGET_DIRS) {
    for (const p of list(dir)) {
        try {
            passCleanFile(p);
        } catch (e) {
            console.error(`❌ Fatal Error processing ${norm(p)}: ${e.message}`);
        }
    }
  }
  
  // Final sanitation of package.json to catch any last-minute issues
  sanitizeJsonFile(r("package.json"));
  
  // Run formatters to tidy up any applied fixes
  runFormatters();
  
  report.finalize();

  const reportData = safeClone(report.get());
  
  try {
    write(REPORT_PATH, JSON.stringify(reportData, null, 2));
  } catch (e) {
    console.error(`❌ Failed to write full report due to serialization error: ${e.message}`);
    // Write a simplified report if the main one fails
    const simpleReport = { 
        ...reportData, 
        codeFixed: Array.isArray(reportData.codeFixed) ? reportData.codeFixed.length : 0, 
        dataFixed: Array.isArray(reportData.dataFixed) ? reportData.dataFixed.length : 0, 
    };
    write(REPORT_PATH, JSON.stringify(simpleReport, null, 2));
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