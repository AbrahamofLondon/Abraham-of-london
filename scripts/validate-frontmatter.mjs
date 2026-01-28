// scripts/validate-frontmatter.mjs
// GREENLAND validator: strict where it matters, tolerant where it should be.

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
const STRICT_SLUG_FORMAT = process.env.STRICT_SLUG_FORMAT !== "0"; // default ON

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

const getAllFiles = (dir) => {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && isMdx(full)) out.push(full);
    }
  }
  return out;
};

const normalizeSlashes = (p) => p.replace(/\\/g, "/");

// Canonicalise top-level folder name:
// - "donwloads" => "downloads" (typo alias)
// - allow future aliases here if needed
const canonicalTopFolder = (top) => {
  const t = String(top || "").trim();
  if (!t) return t;
  if (t === "donwloads") return "downloads";
  return t;
};

const getTypeFromRelativePath = (relativePath) => {
  const p = normalizeSlashes(relativePath);
  const rawTop = p.split("/")[0];
  const top = canonicalTopFolder(rawTop);

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
    case "_partials":
      return "Partial";
    default:
      return "Document";
  }
};

const fileSlug = (filePath) => path.basename(filePath, path.extname(filePath));

const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

// strict kebab-case slug (no extension)
const isValidSlug = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || ""));

const countFrontmatterBlocks = (raw) => {
  const matches = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/gm);
  return matches ? matches.length : 0;
};

// Extract first FM + body, and normalize markdown HR inside body
const extractFirstFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return null;
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const yamlText = match[1];
  const bodyWithoutAnyFrontmatterBlocks = raw.slice(match[0].length);

  // Convert markdown HR '---' to '***' inside body to avoid confusing downstream tools
  const bodyHrNormalized = bodyWithoutAnyFrontmatterBlocks.replace(/^\s*---\s*$/gm, "***");

  return { yamlText, body: bodyHrNormalized };
};

// Detect suspicious “second frontmatter” embedded in body
const hasFrontmatterLikeBlockInBody = (body) => {
  if (!body) return false;

  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "---") continue;

    let sawYamlKey = false;
    for (let j = i + 1; j < Math.min(i + 60, lines.length); j++) {
      const t = lines[j].trim();

      if (t === "---") return sawYamlKey;

      // YAML-ish: "key: value"
      if (/^[A-Za-z0-9_][A-Za-z0-9_-]*\s*:\s*.*$/.test(t)) sawYamlKey = true;
    }
  }
  return false;
};

// Normalize legacy type values to canonical Contentlayer doc names.
// This prevents noisy warnings for harmless legacy values.
const normalizeLegacyType = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const low = s.toLowerCase();

  // already canonical
  const canonical = ["Post", "Book", "Canon", "Download", "Short", "Event", "Print", "Resource", "Strategy", "Document"];
  if (canonical.includes(s)) return s;

  // common legacy variants
  if (low === "post" || low === "blog") return "Post";
  if (low === "book" || low === "books") return "Book";
  if (low === "canon") return "Canon";
  if (low === "download" || low === "downloads") return "Download";
  if (low === "short" || low === "shorts") return "Short";
  if (low === "event" || low === "events") return "Event";
  if (low === "print" || low === "prints") return "Print";
  if (low === "resource" || low === "resources") return "Resource";
  if (low === "strategy" || low === "strategies") return "Strategy";

  // unknown: return raw
  return s;
};

// ------------------------------------------------------------
// FIELD SCHEMAS
// ------------------------------------------------------------
const COMMON_FIELDS = new Set([
  // identity / routing
  "title",
  "slug",
  "href",
  "aliases",
  "docKind", // ✅ new global field replacing "type:"
  "type", // legacy field allowed

  // dates
  "date",
  "updated",
  "publishedDate",

  // publishing flags
  "draft",
  "published",
  "featured",
  "priority",

  // authoring
  "author",
  "authorTitle",

  // meta
  "excerpt",
  "description",
  "subtitle",
  "category",
  "tags",
  "theme",
  "layout",
  "density",
  "canonicalUrl",
  "socialCaption",

  // cover / visuals
  "coverImage",
  "featuredImage",
  "coverAspect",
  "coverFit",
  "coverPosition",

  // access controls
  "accessLevel",
  "lockMessage",
  "tier",
  "requiresAuth",
  "preload",

  // reading time variants
  "readTime",
  "readingTime",
  "readtime",

  // structured attachments / config blobs
  "resources",
  "downloads",
  "relatedDownloads",

  // editorial extras
  "keyInsights",
  "authorNote",

  // SEO
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
]);

const TYPE_FIELDS = {
  Post: new Set(["series", "isSeriesPart", "seriesOrder"]),
  Book: new Set(["isbn", "pages", "publisher", "edition", "format"]),
  Canon: new Set(["canonType", "volumeNumber", "order", "volume", "part"]),
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
    "features",
    "version",
  ]),
  Short: new Set(["hook", "callToAction", "shortType"]),
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
  Print: new Set(["printType", "price", "currency", "isPhysical"]),
  Resource: new Set(["downloadUrl", "links", "resourceType"]),
  Strategy: new Set(["strategyType", "stage", "industry", "region", "complexity", "timeframe", "deliverables", "version"]),
  Document: new Set([]),
  Partial: new Set([]),
};

const allowedForType = (type) =>
  new Set([...COMMON_FIELDS, ...(TYPE_FIELDS[type] ? [...TYPE_FIELDS[type]] : [])]);

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------
const validateOne = (filePath) => {
  const relativePath = path.relative(contentDir, filePath);
  const raw = readFileSafe(filePath);

  if (!raw) return { path: relativePath, valid: false, errors: ["Cannot read file"], warnings: [] };

  const fmCount = countFrontmatterBlocks(raw);
  const fm = extractFirstFrontmatter(raw);

  const errors = [];
  const warnings = [];

  if (!fm) {
    errors.push("No frontmatter (missing --- at start or closing ---)");
    return { path: relativePath, valid: false, errors, warnings };
  }

  if (fmCount > 1) {
    const msg = `Multiple frontmatter blocks detected (found ${fmCount}). Only the first is used.`;
    if (STRICT_MULTI_FM) errors.push(msg);
    else warnings.push(msg);
  }

  if (hasFrontmatterLikeBlockInBody(fm.body)) {
    const msg = `Suspicious embedded YAML block found in body. Possible duplicated frontmatter.`;
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

  // Legacy type conflict handling:
  // - Normalize the legacy type value
  // - If it matches folder type after normalization => no warning
  // - If it conflicts => warn or error depending on STRICT_TYPE_CONFLICT
  if (parsed.type && String(parsed.type).trim()) {
    const legacy = normalizeLegacyType(parsed.type);
    if (legacy && legacy !== folderType) {
      const msg = `Frontmatter type "${parsed.type}" (→ ${legacy}) conflicts with folder type "${folderType}".`;
      if (STRICT_TYPE_CONFLICT) errors.push(msg);
      else warnings.push(msg);
    }
  }

  if (!parsed.title || String(parsed.title).trim() === "") {
    errors.push("Missing required field: title");
  }

  const requiresDate = REQUIRE_DATE_FOR_ALL ? true : folderType === "Post";
  if (requiresDate) {
    if (!parsed.date) errors.push("Missing required field: date");
    else if (!isValidDateString(parsed.date))
      errors.push(`Invalid date format: "${parsed.date}" (YYYY-MM-DD)`);
  }

  // Slug vs filename consistency (warning)
  const expectedSlug = fileSlug(filePath);
  const actualSlug = String(parsed.slug || "").trim();
  const normalizedExpected = expectedSlug
    .replace(/^post-/, "")
    .replace(/^book-/, "");

  if (actualSlug && actualSlug !== expectedSlug && actualSlug !== normalizedExpected) {
    warnings.push(`Slug "${actualSlug}" differs from filename "${expectedSlug}"`);
  }

  // Strict slug format: kebab-case only (fatal)
  if (STRICT_SLUG_FORMAT && parsed.slug && String(parsed.slug).trim()) {
    const s = String(parsed.slug).trim();
    if (s.endsWith(".mdx") || s.endsWith(".md")) {
      errors.push(`Invalid slug format: "${s}" (must not include file extension)`);
    } else if (!isValidSlug(s)) {
      errors.push(`Invalid slug format: "${s}" (use kebab-case: lowercase, digits, hyphens)`);
    }
  }

  // keyInsights should be array if present
  if (parsed.keyInsights && !Array.isArray(parsed.keyInsights)) warnings.push(`keyInsights should be an array of strings`);
  if (parsed.tags && !Array.isArray(parsed.tags)) warnings.push("Tags should be an array");
  if (parsed.aliases && !Array.isArray(parsed.aliases)) warnings.push("Aliases should be an array");

  // Unknown fields (type-aware)
  for (const key of Object.keys(parsed)) {
    if (!allowed.has(key)) {
      const msg = `Unknown field "${key}" for type ${folderType}`;
      if (STRICT_UNKNOWN_FIELDS) errors.push(msg);
      else warnings.push(msg);
    }
  }

  // Optional internal link checking
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
          fs.existsSync(path.join(projectRoot, "public", url));
        if (!exists) warnings.push(`Possible broken internal link: ${url}`);
      }
    }
  }

  return { path: relativePath, type: folderType, valid: errors.length === 0, errors, warnings };
};

// ------------------------------------------------------------
// RUN
// ------------------------------------------------------------
const files = getAllFiles(contentDir);

// Ignore _partials by default (they often aren’t documents)
const results = files
  .map(validateOne)
  .filter((r) => r.type !== "Partial");

const errorRows = results.filter((r) => r.errors?.length);
const warningRows = results.filter((r) => r.warnings?.length);

console.log("========================================");
console.log("📌 Frontmatter Validation Report");
console.log("========================================");
console.log(`Scanned:  ${results.length} files`);
console.log(`Fatal:    ${errorRows.length}`);
console.log(`Warnings: ${warningRows.length}`);
console.log("");

if (warningRows.length) {
  console.log("⚠️ Warnings (fix soon):");
  for (const r of warningRows) for (const w of r.warnings) console.log(` - ${r.path}: ${w}`);
  console.log("");
}

if (errorRows.length) {
  console.log("❌ Fatal Errors:");
  for (const r of errorRows) for (const e of r.errors) console.log(` - ${r.path}: ${e}`);
  console.log("");
}

try {
  const reportPath = path.join(projectRoot, "frontmatter-validation-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ results, errors: errorRows, warnings: warningRows }, null, 2),
    "utf8"
  );
  console.log(`📋 Report saved: ${reportPath}`);
} catch {}

process.exit(errorRows.length ? 1 : 0);