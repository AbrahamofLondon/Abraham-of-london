// scripts/validate-frontmatter.mjs
// GREENLAND validator: strict where it matters, tolerant where it should be.

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, "content");

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

// If true: unknown fields become fatal errors.
// If false: unknown fields are warnings (recommended during migration).
const STRICT_UNKNOWN_FIELDS = process.env.STRICT_UNKNOWN_FIELDS === "1";

// If true: date is required everywhere. If false: date required only for blog posts by default.
const REQUIRE_DATE_FOR_ALL = process.env.REQUIRE_DATE_FOR_ALL === "1";

// If true: internal link checks run (can be noisy in early migrations).
const CHECK_INTERNAL_LINKS = process.env.CHECK_INTERNAL_LINKS === "1";

// If true: slug must match filename (recommended once migration settles)
const ENFORCE_SLUG_MATCH_FILENAME = process.env.ENFORCE_SLUG_MATCH_FILENAME === "1";

// If true: require tags for Shorts/Posts (recommended for your content strategy)
const REQUIRE_TAGS_FOR_SHORTS = process.env.REQUIRE_TAGS_FOR_SHORTS === "1";
const REQUIRE_TAGS_FOR_POSTS = process.env.REQUIRE_TAGS_FOR_POSTS === "1";

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

    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && isMdx(full)) out.push(full);
    }
  }
  return out;
};

const normalizeType = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  const map = {
    post: "Post",
    posts: "Post",
    short: "Short",
    shorts: "Short",
    book: "Book",
    books: "Book",
    canon: "Canon",
    download: "Download",
    downloads: "Download",
    event: "Event",
    events: "Event",
    print: "Print",
    prints: "Print",
    resource: "Resource",
    resources: "Resource",
    strategy: "Strategy",
    document: "Document",
  };
  return map[s.toLowerCase()] || s;
};

const getTypeFromRelativePath = (relativePath) => {
  const p = relativePath.replace(/\\/g, "/");
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

const extractFrontmatter = (raw) => {
  // Enforce frontmatter must be first bytes of file (prevents accidental BOM/whitespace regression)
  if (!raw.startsWith("---")) return null;

  // Only the first frontmatter block is valid; if more than one, warn later.
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  return {
    yamlText: match[1],
    body: raw.slice(match[0].length),
    fmBlock: match[0],
  };
};

const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

const fileSlug = (filePath) => path.basename(filePath, path.extname(filePath));

const isPlaceholderSlug = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "replace" || v === "template" || v === "todo" || v === "tbd";
};

const normalizeStringArray = (v) => {
  if (v == null) return { arr: [], changed: false, reason: null };
  if (Array.isArray(v)) {
    const cleaned = v
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
    return { arr: cleaned, changed: cleaned.length !== v.length, reason: "cleaned" };
  }
  // string => attempt split on commas if it looks like a list
  if (typeof v === "string") {
    const s = v.trim();
    // If it was accidentally serialized like '["a","b"]' keep it as warning only
    if (s.startsWith("[") && s.endsWith("]")) {
      return { arr: [s], changed: false, reason: "stringified-array" };
    }
    const parts = s.includes(",")
      ? s.split(",").map((x) => x.trim()).filter(Boolean)
      : [s].filter(Boolean);
    return { arr: parts, changed: true, reason: "string-to-array" };
  }
  // number/bool/object => stringify as single
  return { arr: [String(v)], changed: true, reason: "coerced-to-string" };
};

// Detect the exact YAML anti-patterns that previously broke Contentlayer,
// BEFORE parsing with js-yaml (because js-yaml might “accept” some, but CL won’t)
const scanYamlTextForKnownFootguns = (yamlText) => {
  const issues = [];

  // 1) excerpt: "|" (quoted pipe) — indicates someone wrote excerpt as a literal marker, not a scalar
  //    You want excerpt: "..." (single line) or excerpt: | (unquoted block scalar)
  if (/\nexcerpt:\s*"\|"\s*(\r?\n|$)/.test("\n" + yamlText + "\n")) {
    issues.push(`excerpt is set to the literal string "|" (should be a real string, not a marker)`);
  }

  // 2) tags: "- foo" (string starting with dash) — exactly your previous regression
  if (/\ntags:\s*"-\s+/.test("\n" + yamlText + "\n")) {
    issues.push(`tags is a string that looks like a list (use tags: ["a","b"] or tags:\n  - a\n  - b)`);
  }

  // 3) Any key assigned to quoted block markers (rare but deadly)
  if (/\n\w+:\s*"\|"\s*(\r?\n|$)/.test("\n" + yamlText + "\n")) {
    issues.push(`found a field using the literal string "|" (quoted). Likely a broken block scalar conversion.`);
  }

  // 4) accidental second frontmatter inside yaml text
  if (yamlText.includes("\n---\n")) {
    issues.push(`frontmatter contains an extra "---" delimiter (double-frontmatter)`);
  }

  return issues;
};

// ------------------------------------------------------------
// FIELD SCHEMAS
// ------------------------------------------------------------

// Shared allowed keys (across types)
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

  // ✅ MIGRATION FIX: aliases must be allowed
  "aliases",
]);

// Type-specific extras
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

const allowedForType = (type) => {
  const s = new Set([...COMMON_FIELDS, ...(TYPE_FIELDS[type] ? [...TYPE_FIELDS[type]] : [])]);
  return s;
};

// Per-type required fields (to prevent “Contentlayer skipped documents” surprises)
const REQUIRED_FIELDS_BY_TYPE = {
  Post: ["title", "date", "slug"],
  Short: ["title", "date", "slug", "excerpt"],
  Book: ["title", "slug"],
  Canon: ["title", "slug"],
  Download: ["title", "slug"],
  Event: ["title", "slug"],
  Print: ["title", "slug"],
  Resource: ["title", "slug"],
  Strategy: ["title", "slug"],
  Document: ["title", "slug"],
};

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

const validateOne = (filePath) => {
  const relativePath = path.relative(contentDir, filePath);
  const raw = readFileSafe(filePath);

  if (!raw) {
    return {
      path: relativePath,
      valid: false,
      errors: ["Cannot read file"],
      warnings: [],
    };
  }

  const fm = extractFrontmatter(raw);
  if (!fm) {
    return {
      path: relativePath,
      valid: false,
      errors: ["No frontmatter (missing --- at start or closing ---)"],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];

  // Double-frontmatter detection (common after merges / template concatenation)
  const occurrences = (raw.match(/^---\r?\n/gm) || []).length;
  if (occurrences > 1) warnings.push(`Multiple frontmatter blocks detected (found ${occurrences}). Only the first is used.`);

  // Pre-scan for known regressions
  const footguns = scanYamlTextForKnownFootguns(fm.yamlText);
  for (const i of footguns) errors.push(`YAML footgun: ${i}`);

  let parsed;
  try {
    parsed = yaml.load(fm.yamlText) || {};
  } catch (e) {
    return {
      path: relativePath,
      valid: false,
      errors: [`YAML parsing error: ${e?.message || String(e)}`],
      warnings: [],
    };
  }

  // Determine type: folder is authoritative, but we sanity-check frontmatter 'type'
  const folderType = getTypeFromRelativePath(relativePath);
  const fmType = normalizeType(parsed.type);
  const type = folderType;

  if (fmType && fmType !== folderType) {
    warnings.push(`Frontmatter type "${fmType}" conflicts with folder type "${folderType}". Folder wins.`);
  }

  const allowed = allowedForType(type);

  // Required fields by type (configurable date behavior remains)
  const requiredFields = REQUIRED_FIELDS_BY_TYPE[type] || ["title"];

  for (const k of requiredFields) {
    if (!parsed[k] || String(parsed[k]).trim() === "") {
      // date handled separately for format clarity
      if (k !== "date") errors.push(`Missing required field: ${k}`);
    }
  }

  // Date rules (your previous default behavior preserved but safer)
  const requiresDate = REQUIRE_DATE_FOR_ALL ? true : type === "Post" || type === "Short";
  if (requiresDate) {
    if (!parsed.date) {
      errors.push("Missing required field: date");
    } else if (!isValidDateString(parsed.date)) {
      errors.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`);
    }
  } else if (parsed.date && !isValidDateString(parsed.date)) {
    warnings.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`);
  }

  // Slug discipline
  const expectedSlug = fileSlug(filePath);
  if (!parsed.slug) warnings.push(`Missing slug (recommended: "${expectedSlug}")`);
  if (parsed.slug && isPlaceholderSlug(parsed.slug)) warnings.push(`Slug "${parsed.slug}" is a placeholder`);
  if (parsed.slug && ENFORCE_SLUG_MATCH_FILENAME && String(parsed.slug).trim() !== expectedSlug) {
    errors.push(`Slug "${parsed.slug}" does not match filename "${expectedSlug}"`);
  } else if (parsed.slug && String(parsed.slug).trim() !== expectedSlug) {
    warnings.push(`Slug "${parsed.slug}" differs from filename "${expectedSlug}"`);
  }

  // Tags normalization (warn if not array OR if coercion would change)
  if (parsed.tags != null) {
    const { arr, changed, reason } = normalizeStringArray(parsed.tags);
    if (!Array.isArray(parsed.tags)) warnings.push(`Tags should be an array (detected ${typeof parsed.tags}); would normalize via ${reason} => ${JSON.stringify(arr)}`);
  } else {
    if ((type === "Short" && REQUIRE_TAGS_FOR_SHORTS) || (type === "Post" && REQUIRE_TAGS_FOR_POSTS)) {
      errors.push("Missing required field: tags");
    }
  }

  // Aliases normalization
  if (parsed.aliases != null) {
    const { arr, reason } = normalizeStringArray(parsed.aliases);
    if (!Array.isArray(parsed.aliases)) warnings.push(`aliases should be an array; would normalize via ${reason} => ${JSON.stringify(arr)}`);
  }

  // Unknown fields
  for (const key of Object.keys(parsed)) {
    if (!allowed.has(key)) {
      const msg = `Unknown field "${key}" for type ${type}`;
      if (STRICT_UNKNOWN_FIELDS) errors.push(msg);
      else warnings.push(msg);
    }
  }

  // Optional: internal link check (noisy — off by default)
  if (CHECK_INTERNAL_LINKS) {
    const body = fm.body || "";
    const links = body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    for (const l of links) {
      const m = l.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const url = m?.[2];
      if (!url) continue;

      // Skip external, anchors, mailto, tel
      if (/^(https?:)?\/\//.test(url) || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) {
        continue;
      }

      if (url.startsWith("/")) {
        // Try common Next.js locations
        const candidates = [
          path.join(projectRoot, url),
          path.join(projectRoot, "public", url),
          path.join(projectRoot, "pages", url + ".tsx"),
          path.join(projectRoot, "pages", url + ".ts"),
          path.join(projectRoot, "app", url, "page.tsx"),
          path.join(projectRoot, "app", url, "page.ts"),
          path.join(projectRoot, "content", url + ".mdx"),
          path.join(projectRoot, "content", url + ".md"),
        ];

        const exists = candidates.some((c) => fs.existsSync(c));
        if (!exists) warnings.push(`Possible broken internal link: ${url}`);
      }
    }
  }

  return {
    path: relativePath,
    type,
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// ------------------------------------------------------------
// RUN
// ------------------------------------------------------------

const files = getAllFiles(contentDir);

const results = files.map(validateOne);

const fatal = results.filter((r) => r.errors?.length);
const noisy = results.filter((r) => r.warnings?.length);

console.log("========================================");
console.log("📌 Frontmatter Validation Report");
console.log("========================================");
console.log(`Scanned:  ${results.length} files`);
console.log(`Fatal:    ${fatal.length}`);
console.log(`Warnings: ${noisy.length}`);
console.log("");

if (fatal.length) {
  console.log("❌ Fatal (build should stop):");
  for (const r of fatal) {
    for (const e of r.errors) console.log(` - ${r.path}: ${e}`);
  }
  console.log("");
}

if (noisy.length) {
  console.log("⚠️ Warnings (fix soon):");
  for (const r of noisy) {
    for (const w of r.warnings) console.log(` - ${r.path}: ${w}`);
  }
  console.log("");
}

// Write report file (optional but useful)
try {
  const reportPath = path.join(projectRoot, "frontmatter-validation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ results, fatal, noisy }, null, 2), "utf8");
  console.log(`📋 Report saved: ${reportPath}`);
} catch {
  // ignore
}

// Exit code: fail only if fatal errors exist
process.exit(fatal.length ? 1 : 0);