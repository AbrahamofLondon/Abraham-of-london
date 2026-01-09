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
  if (!raw.startsWith("---")) return null;
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    yamlText: match[1],
    body: raw.slice(match[0].length),
  };
};

const toArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

const fileSlug = (filePath) =>
  path.basename(filePath, path.extname(filePath));

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

  const type = getTypeFromRelativePath(relativePath);
  const allowed = allowedForType(type);

  const errors = [];
  const warnings = [];

  // Required: title
  if (!parsed.title || String(parsed.title).trim() === "") {
    errors.push("Missing required field: title");
  }

  // Required: date (configurable)
  const requiresDate = REQUIRE_DATE_FOR_ALL ? true : type === "Post";
  if (requiresDate) {
    if (!parsed.date) {
      errors.push("Missing required field: date");
    } else if (!isValidDateString(parsed.date)) {
      errors.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`);
    }
  } else {
    // If date exists, validate it
    if (parsed.date && !isValidDateString(parsed.date)) {
      warnings.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`);
    }
  }

  // Slug warning (do not fail)
  const expectedSlug = fileSlug(filePath);
  if (parsed.slug && ["replace", "template", "TEMPLATE"].includes(String(parsed.slug))) {
  warnings.push(`Slug "${parsed.slug}" is a placeholder in ${relativePath}`);
}

  // Tags should be array
  if (parsed.tags && !Array.isArray(parsed.tags)) {
    warnings.push("Tags should be an array");
  }

  // Aliases should be array
  if (parsed.aliases && !Array.isArray(parsed.aliases)) {
    warnings.push("aliases should be an array");
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

const errors = results.filter((r) => r.errors?.length);
const warnings = results.filter((r) => r.warnings?.length);

console.log("========================================");
console.log("📌 Frontmatter Validation Report");
console.log("========================================");
console.log(`Scanned: ${results.length} files`);
console.log(`Errors:  ${errors.length}`);
console.log(`Warnings:${warnings.length}`);
console.log("");

if (errors.length) {
  console.log("❌ Errors (fatal):");
  for (const r of errors) {
    for (const e of r.errors) {
      console.log(` - ${r.path}: ${e}`);
    }
  }
  console.log("");
}

if (warnings.length) {
  console.log("⚠️ Warnings:");
  for (const r of warnings) {
    for (const w of r.warnings) {
      console.log(` - ${r.path}: ${w}`);
    }
  }
  console.log("");
}

// Write report file (optional but useful)
try {
  const reportPath = path.join(projectRoot, "frontmatter-validation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ results, errors, warnings }, null, 2), "utf8");
  console.log(`📋 Report saved: ${reportPath}`);
} catch {
  // ignore
}

// Exit code: fail only if fatal errors exist
process.exit(errors.length ? 1 : 0);