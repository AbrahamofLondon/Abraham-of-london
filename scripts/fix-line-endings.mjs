import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Folders to enforce (add more if you want)
const TARGET_DIRS = [
  "content/downloads",
  "content/resources",
  "content/blog",
  "content/briefs",
  "content/intelligence",
  "content/canon",
];

// Extensions to enforce
const EXT_ALLOW = new Set([".mdx", ".md"]);

// If true: trims everything before the first frontmatter fence '---'
const REPAIR_FRONTMATTER = true;

// If true: ensure file ends with exactly one trailing newline
const ENSURE_FINAL_NEWLINE = true;

function walk(dirAbs) {
  const out = [];
  if (!fs.existsSync(dirAbs)) return out;
  const stack = [dirAbs];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

function toLF(s) {
  return s.replace(/\r\n/g, "\n");
}

function stripTrailingWhitespace(s) {
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
}

// Remove BOM + common invisible leading chars that break the “must start with ---” gate
function stripBadLeadingChars(s) {
  // BOM
  s = s.replace(/^\uFEFF/, "");
  // Leading NBSP
  s = s.replace(/^\u00A0+/, "");
  // Leading zero-width chars
  s = s.replace(/^[\u200B\u200C\u200D\u2060]+/, "");
  return s;
}

// If there's junk before the first real frontmatter fence, trim it.
// This repairs cases where command output got written into the file.
function repairFrontmatterFence(s) {
  const trimmedLeft = s.replace(/^\s+/, "");
  if (trimmedLeft.startsWith("---")) return s; // already good

  const idx = s.indexOf("\n---");
  const atStartIdx = s.indexOf("---");
  // If '---' exists anywhere, prefer the earliest meaningful fence occurrence
  const cutAt = atStartIdx >= 0 ? atStartIdx : idx >= 0 ? idx + 1 : -1;

  if (cutAt >= 0) {
    const repaired = s.slice(cutAt);
    // Ensure we truly start with fence (after trimming invisibles)
    const r2 = stripBadLeadingChars(repaired).replace(/^\s+/, "");
    if (r2.startsWith("---")) return r2;
  }
  return s;
}

function ensureFinalNewline(s) {
  // normalize to exactly one newline at EOF
  return s.replace(/\s*$/g, "") + "\n";
}

function processFile(abs) {
  const ext = path.extname(abs).toLowerCase();
  if (!EXT_ALLOW.has(ext)) return { changed: false, reason: "skip-ext" };

  const raw = fs.readFileSync(abs, "utf8");

  let out = raw;
  out = toLF(out);
  out = stripTrailingWhitespace(out);
  out = stripBadLeadingChars(out);

  if (REPAIR_FRONTMATTER && ext === ".mdx") {
    out = repairFrontmatterFence(out);
    out = stripBadLeadingChars(out); // run again after repair
  }

  if (ENSURE_FINAL_NEWLINE) out = ensureFinalNewline(out);

  const changed = out !== raw;
  if (changed) fs.writeFileSync(abs, out, "utf8");
  return { changed, reason: changed ? "fixed" : "clean" };
}

function main() {
  const files = [];
  for (const rel of TARGET_DIRS) {
    const dirAbs = path.join(ROOT, rel);
    files.push(...walk(dirAbs));
  }

  let changed = 0;
  let cleaned = 0;
  let skipped = 0;

  for (const f of files) {
    const r = processFile(f);
    if (r.reason === "skip-ext") skipped++;
    else if (r.changed) changed++;
    else cleaned++;
  }

  console.log(`[LINE_ENDINGS] scanned=${files.length} changed=${changed} clean=${cleaned} skipped=${skipped}`);
}

main();