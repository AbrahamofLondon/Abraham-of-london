// scripts/fix-contentlayer-issues.mjs
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const contentDir = join(process.cwd(), "content");

function getAllFiles(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) getAllFiles(full, out);
    else if (ent.isFile() && /\.(md|mdx)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

function isFrontmatterStart(line) {
  return line.trim() === "---";
}

function parseFrontmatterBlock(text) {
  // Must start with --- on first non-empty line
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  // Find first '---' at top
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length || !isFrontmatterStart(lines[i])) {
    return { hasFrontmatter: false, lines, fmStart: -1, fmEnd: -1 };
  }

  const fmStart = i;
  let fmEnd = -1;
  for (let j = fmStart + 1; j < lines.length; j++) {
    if (isFrontmatterStart(lines[j])) {
      fmEnd = j;
      break;
    }
  }
  if (fmEnd === -1) {
    return { hasFrontmatter: false, lines, fmStart: -1, fmEnd: -1 };
  }

  return { hasFrontmatter: true, lines, fmStart, fmEnd };
}

function toYyyyMmDd(value) {
  // Accept: YYYY-MM-DD, "YYYY-MM-DD", Date.toString(), Date.toISOString()
  const raw = String(value || "").trim().replace(/^"(.*)"$/, "$1");

  // Already YYYY-MM-DD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // ISO?
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (iso) return iso[1];

  // JS Date string (Thu Feb 01 2024 00:00:00 GMT+0000 ...)
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = String(d.getUTCFullYear()).padStart(4, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Give up
  return raw;
}

function normalizeFrontmatter(fmLines) {
  // Operate only on YAML key-value lines at top-level: key: value
  // Remove duplicate keys, keep FIRST occurrence (stable).
  const seen = new Set();
  const out = [];

  for (const line of fmLines) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) {
      out.push(line);
      continue;
    }

    const key = m[1];
    let value = m[2];

    // Drop duplicate keys
    if (seen.has(key)) continue;
    seen.add(key);

    // Normalize draft booleans
    if (key === "draft") {
      const v = String(value).trim().replace(/^"(.*)"$/, "$1");
      if (v === "true") value = "true";
      else if (v === "false") value = "false";
    }

    // Normalize date fields
    if (key === "date" || key === "eventDate") {
      const normalized = toYyyyMmDd(value);
      value = `"${normalized}"`;
    }

    out.push(`${key}: ${value}`);
  }

  return out;
}

function fixFileText(text) {
  const { hasFrontmatter, lines, fmStart, fmEnd } = parseFrontmatterBlock(text);
  if (!hasFrontmatter) {
    // Still normalize line endings
    return text.replace(/\r\n/g, "\n");
  }

  const before = lines.slice(0, fmStart + 1); // includes opening ---
  const fm = lines.slice(fmStart + 1, fmEnd);
  const after = lines.slice(fmEnd); // includes closing --- and rest

  const fixedFm = normalizeFrontmatter(fm);

  return [...before, ...fixedFm, ...after].join("\n");
}

function rel(p) {
  return p.replace(contentDir + "\\", "content\\").replace(contentDir + "/", "content/");
}

async function run() {
  console.log("🔧 Fixing Contentlayer issues (frontmatter-safe, date-quoted)...");

  const files = getAllFiles(contentDir);
  let fixed = 0;
  const touched = [];

  for (const file of files) {
    try {
      const original = readFileSync(file, "utf8");
      const next = fixFileText(original);

      if (next !== original) {
        writeFileSync(file, next, "utf8");
        fixed++;
        touched.push(rel(file));
      }
    } catch (e) {
      console.error(`  ✗ Error fixing ${rel(file)}:`, e?.message || e);
    }
  }

  console.log(`\n✅ Fixed ${fixed} file(s).`);
  for (const f of touched.slice(0, 40)) console.log(`  ✓ ${f}`);
  if (touched.length > 40) console.log(`  ...and ${touched.length - 40} more`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});