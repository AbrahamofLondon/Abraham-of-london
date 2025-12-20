// scripts/fix-contentlayer-issues.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function normalizeNewlines(s) {
  // Normalize Windows CRLF to LF, and strip stray CRs
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toIsoDateLoose(value) {
  const raw = String(value ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return null;
  if (isIsoDate(raw)) return raw;

  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeBooleanYaml(value) {
  const v = String(value ?? "").trim();
  const unquoted = v.replace(/^["']|["']$/g, "").trim();

  if (unquoted.toLowerCase() === "true") return "true";
  if (unquoted.toLowerCase() === "false") return "false";
  return null;
}

function parseFrontmatter(src) {
  if (!src.startsWith("---")) return null;

  // Find closing --- on its own line
  const match = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return null;

  const fmRaw = match[1] ?? "";
  const body = src.slice(match[0].length);
  return { frontmatter: fmRaw, body, fmBlock: match[0] };
}

function fixFrontmatter(frontmatter) {
  const lines = frontmatter.split("\n");

  const seen = new Set();
  const fixed = [];

  let hasDateKey = false;

  for (const originalLine of lines) {
    const line = originalLine;

    // Preserve empty lines and comments as-is
    if (!line.trim() || line.trim().startsWith("#")) {
      fixed.push(line);
      continue;
    }

    // YAML key line? (simple mapping only)
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!m) {
      fixed.push(line);
      continue;
    }

    const key = m[1];
    const rest = m[2] ?? "";

    // If this key has already appeared in frontmatter, drop duplicates (first wins)
    if (seen.has(key)) continue;
    seen.add(key);

    if (key === "date") {
      hasDateKey = true;

      // ✅ ALWAYS write quoted ISO date to prevent YAML date coercion
      const iso = toIsoDateLoose(rest);
      if (iso) {
        fixed.push(`date: "${iso}"`);
      } else {
        // If cannot normalise, keep as a quoted string anyway
        const safe = String(rest).trim().replace(/^["']|["']$/g, "");
        fixed.push(`date: "${safe}"`);
      }
      continue;
    }

    if (
      key === "draft" ||
      key === "featured" ||
      key === "available" ||
      key === "published"
    ) {
      const boolVal = normalizeBooleanYaml(rest);
      if (boolVal) {
        fixed.push(`${key}: ${boolVal}`);
        continue;
      }
    }

    // Strip stray CR artifacts if any made it in
    fixed.push(`${key}: ${String(rest).replace(/\r/g, "").trimEnd()}`);
  }

  // Ensure date exists and is quoted ISO
  if (!hasDateKey) {
    const today = new Date().toISOString().slice(0, 10);
    const dateLine = `date: "${today}"`;

    // Insert after title if possible, otherwise at top
    const idx = fixed.findIndex((l) => /^title\s*:/i.test(l.trim()));
    if (idx >= 0) fixed.splice(idx + 1, 0, dateLine);
    else fixed.unshift(dateLine);
  }

  while (fixed.length && !fixed[fixed.length - 1].trim()) fixed.pop();
  return fixed.join("\n");
}

function fixOneFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const src = normalizeNewlines(raw);

  const parsed = parseFrontmatter(src);
  if (!parsed) {
    if (raw !== src) {
      fs.writeFileSync(filePath, src, "utf8");
      return { changed: true, reason: "newline-normalized-no-frontmatter" };
    }
    return { changed: false };
  }

  const fixedFm = fixFrontmatter(parsed.frontmatter);
  const rebuilt = `---\n${fixedFm}\n---\n${parsed.body.replace(/^\n+/, "")}`;

  if (rebuilt !== src) {
    fs.writeFileSync(filePath, rebuilt, "utf8");
    return { changed: true, reason: "frontmatter-fixed" };
  }

  if (raw !== src) {
    fs.writeFileSync(filePath, src, "utf8");
    return { changed: true, reason: "newline-normalized" };
  }

  return { changed: false };
}

function main() {
  console.log("🔧 Fixing Contentlayer issues (frontmatter-safe, date-quoted)...");

  const files = walk(CONTENT_DIR);
  let fixedCount = 0;

  const touched = [];
  const errors = [];

  for (const f of files) {
    try {
      const res = fixOneFile(f);
      if (res.changed) {
        fixedCount++;
        touched.push(path.relative(ROOT, f));
      }
    } catch (err) {
      errors.push({
        file: path.relative(ROOT, f),
        message: err?.message ?? String(err),
      });
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} file(s).`);
  if (touched.length) {
    for (const t of touched.slice(0, 40)) console.log(`  ✓ ${t}`);
    if (touched.length > 40) console.log(`  …and ${touched.length - 40} more`);
  }

  if (errors.length) {
    console.log(`\n⚠️ Errors (${errors.length}):`);
    for (const e of errors.slice(0, 20)) console.log(`  ✗ ${e.file}: ${e.message}`);
    if (errors.length > 20) console.log(`  …and ${errors.length - 20} more`);
    process.exitCode = 1;
  }
}

main();