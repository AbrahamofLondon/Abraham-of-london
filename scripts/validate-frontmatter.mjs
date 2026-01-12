// scripts/validate-frontmatter.mjs
// GREENLAND validator (production-grade):
// - strict where it matters: YAML validity, required fields, slug hygiene, uniqueness
// - tolerant where it should be: filenames don't have to match slugs
// - catches: multi-frontmatter, embedded YAML blocks, type conflicts, unknown fields
// - outputs: frontmatter-validation-report.json
// - exit code: non-zero only on fatal errors

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, "content");

// ------------------------------------------------------------
// CONFIG (env toggles)
// ------------------------------------------------------------
const STRICT_UNKNOWN_FIELDS = process.env.STRICT_UNKNOWN_FIELDS === "1";
const REQUIRE_DATE_FOR_ALL = process.env.REQUIRE_DATE_FOR_ALL === "1";
const CHECK_INTERNAL_LINKS = process.env.CHECK_INTERNAL_LINKS === "1";
const STRICT_MULTI_FM = process.env.STRICT_MULTI_FM === "1";
const STRICT_TYPE_CONFLICT = process.env.STRICT_TYPE_CONFLICT === "1";

// Slug policy (Strategy A):
// - slug is canonical
// - filename may differ
// - validate slug shape + uniqueness
const REQUIRE_SLUG_FOR_ALL = process.env.REQUIRE_SLUG_FOR_ALL === "1";
const REQUIRE_SLUG_FOR = new Set(
  (process.env.REQUIRE_SLUG_FOR || "Post,Download,Book")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// enforce kebab-case slugs (recommended)
const STRICT_SLUG_FORMAT = process.env.STRICT_SLUG_FORMAT !== "0"; // default true

// optional: enforce that downloads slugs start with "download-"
const ENFORCE_DOWNLOAD_PREFIX = process.env.ENFORCE_DOWNLOAD_PREFIX === "1";

// How far to scan after a '---' when hunting embedded YAML-like blocks
const EMBEDDED_FM_SCAN_WINDOW = Number(process.env.EMBEDDED_FM_SCAN_WINDOW || 80);

// If true, converts markdown HR lines `---` to `***` in extracted body (in-memory only)
const NORMALIZE_BODY_HR = process.env.NORMALIZE_BODY_HR === "1";

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");

const readFileSafe = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

const normalizeSlashes = (p) => p.replace(/\\/g, "/");

const getAllFiles = (dir) => {
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
};

const getTypeFromRelativePath = (relativePath) => {
  const p = normalizeSlashes(relativePath);
  const top = p.split("/")[0];
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
};

const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

const countFrontmatterBlocks = (raw) => {
  const matches = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/gm);
  return matches ? matches.length : 0;
};

const extractFirstFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return null;
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const yamlText = match[1];
  let body = raw.slice(match[0].length);

  if (NORMALIZE_BODY_HR) {
    body = body.replace(/^\s*---\s*$/gm, "***");
  }

  return { yamlText, body };
};

// detect a real embedded YAML-like block in body: `---` then "key: value" lines then closing `---`
const hasEmbeddedYamlFrontmatterBlock = (body) => {
  if (!body) return false;
  const lines = body.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "---") continue;

    let sawYamlKey = false;

    for (let j = i + 1; j < Math.min(i + EMBEDDED_FM_SCAN_WINDOW, lines.length); j++) {
      const t = lines[j].trim();
      if (t === "---") return sawYamlKey;

      if (/^[A-Za-z0-9_][A-Za-z0-9_-]*\s*:\s*.*$/.test(t)) {
        sawYamlKey = true;
      }
    }
  }
  return false;
};

const isKebabSlug = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || ""));

// ------------------------------------------------------------
// FIELD SCHEMAS
// ------------------------------------------------------------
const COMMON_FIELDS = new Set([
  "title",
  "slug",
  "href",
  "date",
  "updated",
  "author",
  "authorTitle",
  "excerpt",
  "description",
  "subtitle",
  "draft",
  "published",
  "tags",
  "category",
  "ogTitle",
  "ogDescription",
  "socialCaption",
  "canonicalUrl",
  "coverImage",
  "coverAspect",
  "coverFit",
  "coverPosition",
  "featured",
  "priority",
  "accessLevel",
  "lockMessage",
  "tier",
  "requiresAuth",
  "preload",
  "version",
  "type",

  // tolerated migration keys
  "readTime",
  "readingTime",
  "readtime",
  "layout",
  "density",
  "featuredImage",
  "resources",
  "downloads",
  "relatedDownloads",
  "volumeNumber",
  "order",
  "resourceType",

  // aliases
  "aliases",
]);

const TYPE_FIELDS = {
  Post: new Set(["series", "isSeriesPart", "seriesOrder"]),
  Book: new Set(["isbn", "pages", "publisher", "publishedDate", "edition", "format"]),
  Canon: new Set(["canonType", "volume", "part"]),
  Download: new Set([
    "downloadType",
    "format",
    "fileFormat",
    "paperFormats",
    "fileUrl",
    "downloadUrl",
    "downloadFile",
    "pdfPath",
    "file",
    "fileSize",
    "checksumMd5",
    "isInteractive",
    "isFillable",
    "language",
    "ctaPrimary",
    "ctaSecondary",
    "related",
    "ctaConfig",
    "downloadProcess",
    "featureGridItems",
    "useLegacyDiagram",
    "useProTip",
    "useFeatureGrid",
    "useDownloadCTA",
    "proTipType",
    "proTipContent",
    "featureGridColumns",
    "contentOnly",
    "requiresEmail",
    "emailFieldLabel",
    "emailSuccessMessage",
  ]),
  Short: new Set(["shortType", "audience", "theme", "hook", "callToAction"]),
  Event: new Set([
    "eventType",
    "location",
    "startDate",
    "endDate",
    "registrationUrl",
    "eventDate",
    "time",
    "timezone",
    "isVirtual",
    "meetingLink",
  ]),
  Print: new Set(["printType", "format", "paperFormats", "fileSize", "fileUrl", "downloadUrl", "isPhysical", "price", "currency"]),
  Resource: new Set(["resourceType", "fileUrl", "downloadUrl", "links", "resources"]),
  Strategy: new Set(["strategyType", "stage", "industry", "region", "complexity", "timeframe", "deliverables"]),
  Document: new Set([]),
};

const allowedForType = (type) =>
  new Set([...COMMON_FIELDS, ...(TYPE_FIELDS[type] ? [...TYPE_FIELDS[type]] : [])]);

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------
const validateOne = (filePath) => {
  const relativePath = path.relative(contentDir, filePath);
  const raw = readFileSafe(filePath);

  const errors = [];
  const warnings = [];

  if (!raw) {
    errors.push("Cannot read file");
    return { path: relativePath, valid: false, errors, warnings };
  }

  const fmCount = countFrontmatterBlocks(raw);
  const fm = extractFirstFrontmatter(raw);

  if (!fm) {
    errors.push("No frontmatter (missing --- at start or closing ---)");
    return { path: relativePath, valid: false, errors, warnings };
  }

  if (fmCount > 1) {
    const msg = `Multiple frontmatter blocks detected (found ${fmCount}). Only the first is used.`;
    if (STRICT_MULTI_FM) errors.push(msg);
    else warnings.push(msg);
  }

  if (hasEmbeddedYamlFrontmatterBlock(fm.body)) {
    const msg = `Suspicious embedded YAML-like frontmatter block detected in body.`;
    if (STRICT_MULTI_FM) errors.push(msg);
    else warnings.push(msg);
  }

  let parsed;
  try {
    parsed = yaml.load(fm.yamlText) || {};
  } catch (e) {
    errors.push(`YAML parsing error: ${e?.message || String(e)}`);
    return { path: relativePath, valid: false, errors, warnings };
  }

  const folderType = getTypeFromRelativePath(relativePath);
  const allowed = allowedForType(folderType);

  if (parsed.type && String(parsed.type).trim() && String(parsed.type) !== folderType) {
    const msg = `Frontmatter type "${parsed.type}" conflicts with folder type "${folderType}".`;
    if (STRICT_TYPE_CONFLICT) errors.push(msg);
    else warnings.push(msg);
  }

  // Required: title
  if (!parsed.title || String(parsed.title).trim() === "") {
    errors.push("Missing required field: title");
  }

  // Required: date (configurable)
  const requiresDate = REQUIRE_DATE_FOR_ALL ? true : folderType === "Post";
  if (requiresDate) {
    if (!parsed.date) errors.push("Missing required field: date");
    else if (!isValidDateString(parsed.date)) errors.push(`Invalid date format: "${parsed.date}" (YYYY-MM-DD)`);
  } else {
    if (parsed.date && !isValidDateString(parsed.date)) warnings.push(`Invalid date format: "${parsed.date}" (YYYY-MM-DD)`);
  }

  // Slug policy (canonical slug)
  const requiresSlug = REQUIRE_SLUG_FOR_ALL ? true : REQUIRE_SLUG_FOR.has(folderType);
  if (requiresSlug) {
    if (!parsed.slug || String(parsed.slug).trim() === "") {
      errors.push("Missing required field: slug");
    } else {
      const s = String(parsed.slug).trim();
      if (STRICT_SLUG_FORMAT && !isKebabSlug(s)) {
        errors.push(`Invalid slug format: "${s}" (use kebab-case: lowercase, digits, hyphens)`);
      }
      if (ENFORCE_DOWNLOAD_PREFIX && folderType === "Download" && !s.startsWith("download-")) {
        errors.push(`Download slug must start with "download-": "${s}"`);
      }
    }
  } else {
    // if slug exists, still validate shape (warning if bad)
    if (parsed.slug && String(parsed.slug).trim()) {
      const s = String(parsed.slug).trim();
      if (STRICT_SLUG_FORMAT && !isKebabSlug(s)) warnings.push(`Invalid slug format: "${s}" (use kebab-case)`);
    }
  }

  // Tags / aliases shape
  if (parsed.tags && !Array.isArray(parsed.tags)) warnings.push("tags should be an array");
  if (parsed.aliases && !Array.isArray(parsed.aliases)) warnings.push("aliases should be an array");

  // Unknown fields
  for (const key of Object.keys(parsed)) {
    if (!allowed.has(key)) {
      const msg = `Unknown field "${key}" for type ${folderType}`;
      if (STRICT_UNKNOWN_FIELDS) errors.push(msg);
      else warnings.push(msg);
    }
  }

  // Optional internal link checks
  if (CHECK_INTERNAL_LINKS) {
    const body = fm.body || "";
    const links = body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    for (const l of links) {
      const m = l.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const url = m?.[2];
      if (!url) continue;

      if (url.startsWith("/")) {
        const linked = path.join(projectRoot, url);
        const exists =
          fs.existsSync(linked) ||
          fs.existsSync(linked + ".md") ||
          fs.existsSync(linked + ".mdx") ||
          fs.existsSync(path.join(projectRoot, "pages", url + ".tsx")) ||
          fs.existsSync(path.join(projectRoot, "pages", url + ".ts")) ||
          fs.existsSync(path.join(projectRoot, "public", url));

        if (!exists) warnings.push(`Possible broken internal link: ${url}`);
      }
    }
  }

  return { path: relativePath, type: folderType, valid: errors.length === 0, errors, warnings, frontmatter: parsed };
};

// ------------------------------------------------------------
// RUN + CROSS-FILE CHECKS (slug uniqueness)
// ------------------------------------------------------------
const files = getAllFiles(contentDir);
const results = files.map(validateOne);

const errorRows = results.filter((r) => r.errors?.length);
const warningRows = results.filter((r) => r.warnings?.length);

// Build slug index per type
const slugIndex = new Map(); // key: `${type}::${slug}` -> [paths]
for (const r of results) {
  const slug = r.frontmatter?.slug ? String(r.frontmatter.slug).trim() : "";
  if (!slug) continue;
  const key = `${r.type}::${slug}`;
  const arr = slugIndex.get(key) || [];
  arr.push(r.path);
  slugIndex.set(key, arr);
}

// Flag duplicates
for (const [key, paths] of slugIndex.entries()) {
  if (paths.length <= 1) continue;
  const [type, slug] = key.split("::");
  const msg = `Duplicate slug "${slug}" within type ${type}: ${paths.join(", ")}`;
  // duplicates are fatal (always) — this breaks routing/content lookup
  errorRows.push({
    path: "(cross-file)",
    type: "System",
    valid: false,
    errors: [msg],
    warnings: [],
  });
}

// Recompute totals after cross-file errors
const fatalCount = errorRows.length;
const warnCount = warningRows.length;

console.log("========================================");
console.log("📌 Frontmatter Validation Report");
console.log("========================================");
console.log(`Scanned:  ${results.length} files`);
console.log(`Fatal:    ${fatalCount}`);
console.log(`Warnings: ${warnCount}`);
console.log("");

if (warnCount) {
  console.log("⚠️ Warnings (fix soon):");
  for (const r of warningRows) for (const w of r.warnings) console.log(` - ${r.path}: ${w}`);
  console.log("");
}

if (fatalCount) {
  console.log("❌ Fatal Errors:");
  for (const r of errorRows) for (const e of r.errors) console.log(` - ${r.path}: ${e}`);
  console.log("");
}

try {
  const reportPath = path.join(projectRoot, "frontmatter-validation-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        summary: {
          scanned: results.length,
          fatal: fatalCount,
          warnings: warnCount,
        },
        results: results.map(({ frontmatter, ...rest }) => rest), // don’t dump full FM by default
        errors: errorRows,
        warnings: warningRows,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`📋 Report saved: ${reportPath}`);
} catch {
  // ignore
}

process.exit(fatalCount ? 1 : 0);