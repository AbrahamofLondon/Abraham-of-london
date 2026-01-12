/* scripts/fix-yaml-specific.js
 * Deterministic frontmatter fixer for content/*.md(x)
 *
 * Goals:
 *  - Eliminate YAML footguns (quoted |, tags as "- x", etc.)
 *  - Normalize required fields (title, slug, type, date for Post/Short)
 *  - Recover from broken YAML by nuclear rebuild
 *  - Stable output ordering to prevent regressions
 *
 * Usage:
 *  node scripts/fix-yaml-specific.js
 *  node scripts/fix-yaml-specific.js --dry-run
 *  node scripts/fix-yaml-specific.js --only shorts
 *  node scripts/fix-yaml-specific.js --strict   (more aggressive)
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, "content");

// -----------------------------
// CLI FLAGS
// -----------------------------
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run") || argv.includes("-n");
const STRICT = argv.includes("--strict");
const ONLY = (() => {
  const i = argv.findIndex((a) => a === "--only");
  if (i >= 0 && argv[i + 1]) return String(argv[i + 1]).trim().toLowerCase();
  return null;
})();
const WRITE_REPORT = !argv.includes("--no-report");

// -----------------------------
// HELPERS
// -----------------------------
const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && isMdx(full)) out.push(full);
    }
  }
  return out;
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p, s) {
  fs.writeFileSync(p, s, "utf8");
}

function rel(p) {
  return path.relative(contentDir, p).replace(/\\/g, "/");
}

function fileSlug(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function titleCaseFromSlug(slug) {
  // when-youre-winning-at-work -> When Youre Winning At Work
  // (we keep apostrophes out to avoid YAML quoting chaos; you can refine later)
  return String(slug)
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function getTypeFromRelativePath(relativePath) {
  const top = relativePath.split("/")[0];
  switch (top) {
    case "blog":
      return "Post";
    case "books":
      return "Book";
    case "canon":
      return "Canon";
    case "downloads":
      return "Download";
    case "shorts":
      return "Short";
    case "events":
      return "Event";
    case "prints":
      return "Print";
    case "resources":
      return "Resource";
    case "strategy":
      return "Strategy";
    default:
      return "Document";
  }
}

function extractFrontmatter(raw) {
  // Must start at byte 0, else we consider it missing
  if (!raw.startsWith("---")) return null;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return { yamlText: m[1], body: raw.slice(m[0].length), fmBlock: m[0] };
}

function stripFrontmatterIfPresent(raw) {
  const fm = extractFrontmatter(raw);
  return fm ? fm.body : raw;
}

function firstNonEmptyLine(text) {
  const lines = String(text || "").split(/\r?\n/);
  for (const l of lines) {
    const s = l.trim();
    if (s) return s;
  }
  return "";
}

function firstParagraph(text) {
  const lines = String(text || "").split(/\r?\n/);
  let buf = [];
  let seen = false;
  for (const line of lines) {
    const t = line.trim();
    // skip headings and mdx imports/exports
    if (!seen) {
      if (!t) continue;
      if (t.startsWith("import ") || t.startsWith("export ")) continue;
      if (t.startsWith("#")) continue;
      seen = true;
    }
    if (!t) break;
    buf.push(t);
    if (buf.join(" ").length > 240) break;
  }
  const para = buf.join(" ").replace(/\s+/g, " ").trim();
  return para;
}

function safeOneLineExcerpt(s) {
  const v = String(s || "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Hard cap to keep frontmatter tidy
  if (v.length > 220) return v.slice(0, 217).trim() + "…";
  return v;
}

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function todayIso() {
  // Use local date; deterministic enough for emergency rebuilds
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeStringArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const s = v.trim();
    // if looks like JSON array string, do not parse aggressively unless STRICT
    if (s.startsWith("[") && s.endsWith("]") && !STRICT) return [s];
    // common regressions: "- a\n- b" collapsed into a single string
    if (s.includes("\n")) {
      const lines = s
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => x.replace(/^-+\s*/, "").trim())
        .filter(Boolean);
      if (lines.length) return lines;
    }
    // comma list
    if (s.includes(",")) {
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
    // " - tag" or "- tag"
    return [s.replace(/^-+\s*/, "").trim()].filter(Boolean);
  }
  return [String(v).trim()].filter(Boolean);
}

// We output tags as inline JSON array to avoid YAML indentation pitfalls
function toInlineJsonArray(arr) {
  const cleaned = (arr || []).map((x) => String(x).trim()).filter(Boolean);
  return `[${cleaned.map((x) => JSON.stringify(x)).join(", ")}]`;
}

// Stable key ordering (you can extend this)
const KEY_ORDER = [
  "type",
  "title",
  "slug",
  "date",
  "updated",
  "author",
  "authorTitle",
  "excerpt",
  "description",
  "subtitle",
  "tags",
  "category",
  "draft",
  "published",
  "featured",
  "priority",
  "accessLevel",
  "tier",
  "requiresAuth",
  "requiresEmail",
  "coverImage",
  "featuredImage",
  "coverAspect",
  "coverFit",
  "coverPosition",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "socialCaption",
  "readTime",
  "readingTime",
  "layout",
  "density",
  "aliases",
];

// YAML “footgun” cleanup BEFORE parse (fixes excerpt: "|" and tags: "- x")
function preSanitizeYamlText(yamlText) {
  let t = String(yamlText || "");

  // Fix: excerpt: "|"  (quoted pipe)  -> excerpt: ""
  t = t.replace(/(^|\n)excerpt:\s*"\|"\s*(?=\n|$)/g, "$1excerpt: \"\"");

  // Fix: tags: "- foo" (string starting with dash) -> tags: ["foo"]
  t = t.replace(/(^|\n)tags:\s*"-\s*([^"]+)"\s*(?=\n|$)/g, (m, p1, tag) => {
    const clean = String(tag).trim();
    return `${p1}tags: ["${clean.replace(/"/g, '\\"')}"]`;
  });

  // Fix: excerpt: "| (unquoted) weirdness -> excerpt: ""
  t = t.replace(/(^|\n)excerpt:\s*\|\s*(?=\n|$)/g, "$1excerpt: \"\"");

  return t;
}

function parseFrontmatter(yamlText) {
  const cleaned = preSanitizeYamlText(yamlText);
  try {
    const obj = yaml.load(cleaned) || {};
    if (obj && typeof obj === "object") return { ok: true, obj, cleaned };
    return { ok: true, obj: {}, cleaned };
  } catch (e) {
    return { ok: false, error: e, cleaned };
  }
}

function buildFrontmatterObject({ type, slug, title, date, excerpt, tags, base }) {
  const out = { ...(base || {}) };

  // Authoritative fields
  out.type = type;
  out.slug = slug;
  out.title = title;

  if (date) out.date = date;
  if (excerpt != null) out.excerpt = excerpt;

  if (tags && tags.length) out.tags = tags;

  // Clean known toxic values
  if (out.excerpt === "|") out.excerpt = "";
  if (typeof out.tags === "string") out.tags = normalizeStringArray(out.tags);

  return out;
}

function toStableYaml(obj) {
  // Build ordered pairs: KEY_ORDER first, then the rest alphabetically
  const keys = Object.keys(obj || {});
  const seen = new Set();

  const ordered = [];
  for (const k of KEY_ORDER) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      ordered.push(k);
      seen.add(k);
    }
  }
  const rest = keys.filter((k) => !seen.has(k)).sort((a, b) => a.localeCompare(b));
  const finalKeys = [...ordered, ...rest];

  // Emit YAML manually for critical fields to avoid indentation bugs:
  // - tags, aliases as inline JSON arrays
  // - everything else via safe scalar quoting
  const lines = [];

  for (const k of finalKeys) {
    const v = obj[k];

    if (v === undefined) continue;

    if (k === "tags" || k === "aliases") {
      const arr = normalizeStringArray(v);
      lines.push(`${k}: ${toInlineJsonArray(arr)}`);
      continue;
    }

    if (typeof v === "boolean" || typeof v === "number") {
      lines.push(`${k}: ${v}`);
      continue;
    }

    if (v === null) {
      lines.push(`${k}: null`);
      continue;
    }

    // Always emit strings safely
    const s = String(v);
    const escaped = s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`${k}: "${escaped}"`);
  }

  return lines.join("\n").trimEnd();
}

function rebuildFile({ filePath, raw, relativePath, reason, parsed }) {
  const type = getTypeFromRelativePath(relativePath);
  const slug = fileSlug(filePath);

  const body = stripFrontmatterIfPresent(raw);

  // Title: prefer parsed.title, else first H1, else slug->Title Case
  let title =
    (parsed && parsed.title && String(parsed.title).trim()) ||
    (() => {
      const first = firstNonEmptyLine(body);
      if (first.startsWith("#")) return first.replace(/^#+\s*/, "").trim();
      return "";
    })() ||
    titleCaseFromSlug(slug);

  title = String(title).replace(/\s+/g, " ").trim();

  // Date: for Post/Short required; prefer parsed.date if valid
  let date = null;
  if (type === "Post" || type === "Short") {
    const candidate = parsed && parsed.date ? String(parsed.date).trim() : "";
    date = isIsoDate(candidate) ? candidate : todayIso();
  } else if (parsed && parsed.date && isIsoDate(parsed.date)) {
    date = String(parsed.date).trim();
  }

  // Excerpt: prefer parsed.excerpt, else first paragraph
  let excerpt =
    (parsed && parsed.excerpt && String(parsed.excerpt).trim()) ||
    firstParagraph(body) ||
    "";

  excerpt = safeOneLineExcerpt(excerpt);

  // Tags: normalize whatever exists
  let tags = [];
  if (parsed && parsed.tags != null) tags = normalizeStringArray(parsed.tags);

  // In STRICT mode, if tags are missing for shorts, infer a couple from slug tokens
  if (STRICT && type === "Short" && (!tags || !tags.length)) {
    const parts = slug.split("-").filter(Boolean);
    // naive: keep a few “meaningful” tokens
    tags = parts.filter((x) => x.length > 3).slice(0, 4);
  }

  // Base: keep safe fields but avoid carrying broken junk
  const base = { ...(parsed || {}) };
  // Ensure we don’t keep invalid type from old content
  delete base.type;

  const fmObj = buildFrontmatterObject({
    type,
    slug,
    title,
    date,
    excerpt,
    tags,
    base,
  });

  // Normalize tags/aliases consistently
  fmObj.tags = normalizeStringArray(fmObj.tags);
  if (fmObj.aliases != null) fmObj.aliases = normalizeStringArray(fmObj.aliases);

  // Kill placeholder slugs
  if (!fmObj.slug || fmObj.slug === "replace" || fmObj.slug === "template") fmObj.slug = slug;

  // Output stable YAML
  const yamlOut = toStableYaml(fmObj);
  const rebuilt = `---\n${yamlOut}\n---\n${body.replace(/^\r?\n+/, "")}`;

  return { rebuilt, meta: { type, slug, title, date, excerpt, tags, reason } };
}

// -----------------------------
// MAIN
// -----------------------------
if (!fs.existsSync(contentDir)) {
  console.error(`❌ content directory not found: ${contentDir}`);
  process.exit(1);
}

const all = walk(contentDir);
const files = ONLY
  ? all.filter((p) => rel(p).startsWith(`${ONLY}/`))
  : all;

const report = {
  scanned: files.length,
  changed: 0,
  unchanged: 0,
  errors: 0,
  items: [],
};

console.log(`🔧 Fixing YAML issues...`);
console.log(`📁 contentDir: ${contentDir}`);
console.log(`🧪 dry-run: ${DRY_RUN} | strict: ${STRICT} | only: ${ONLY || "ALL"}`);
console.log("");

for (const filePath of files) {
  const relativePath = rel(filePath);
  let raw;

  try {
    raw = readUtf8(filePath);
  } catch (e) {
    report.errors++;
    report.items.push({ file: relativePath, ok: false, error: `read failed: ${String(e)}` });
    continue;
  }

  const fm = extractFrontmatter(raw);

  let parsed = null;
  let reason = "";
  if (!fm) {
    reason = "missing-frontmatter";
    parsed = {};
  } else {
    const { ok, obj, error } = parseFrontmatter(fm.yamlText);
    if (!ok) {
      reason = `broken-yaml: ${error && error.message ? error.message : "unknown"}`;
      parsed = {}; // nuclear rebuild
    } else {
      reason = "normalize";
      parsed = obj || {};
    }
  }

  // Always rebuild deterministically (this is how we prevent regressions)
  const { rebuilt, meta } = rebuildFile({ filePath, raw, relativePath, reason, parsed });

  const changed = rebuilt !== raw;

  if (changed) {
    report.changed++;
    if (!DRY_RUN) {
      try {
        writeUtf8(filePath, rebuilt);
      } catch (e) {
        report.errors++;
        report.items.push({ file: relativePath, ok: false, error: `write failed: ${String(e)}` });
        continue;
      }
    }
    console.log(`✅ Fixed: ${relativePath}`);
    report.items.push({ file: relativePath, ok: true, changed: true, meta });
  } else {
    report.unchanged++;
    report.items.push({ file: relativePath, ok: true, changed: false, meta });
  }
}

console.log("");
console.log(`🎉 Done. scanned=${report.scanned} changed=${report.changed} unchanged=${report.unchanged} errors=${report.errors}`);

if (WRITE_REPORT) {
  const reportPath = path.join(projectRoot, "yaml-fix-report.json");
  try {
    if (!DRY_RUN) writeUtf8(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Report: ${reportPath}${DRY_RUN ? " (dry-run: not written)" : ""}`);
  } catch {
    // ignore
  }
}

// Non-zero exit if any errors
process.exit(report.errors ? 1 : 0);