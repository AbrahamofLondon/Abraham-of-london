// scripts/validate-frontmatter.mjs
// GREENLAND validator: Production Hardened for City Gate Architecture.

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
const STRICT_SLUG_FORMAT = process.env.STRICT_SLUG_FORMAT !== "0"; 

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");
const readFileSafe = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };

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

const canonicalTopFolder = (top) => {
  const t = String(top || "").trim();
  if (t === "donwloads") return "downloads";
  return t;
};

const getTypeFromRelativePath = (relativePath) => {
  const p = normalizeSlashes(relativePath);
  const rawTop = p.split("/")[0];
  const top = canonicalTopFolder(rawTop);

  switch (top) {
    case "blog": return "Post";
    case "books": return "Book";
    case "canon": return "Canon";
    case "downloads": return "Download";
    case "shorts": return "Short";
    case "events": return "Event";
    case "prints": return "Print";
    case "resources": return "Resource";
    case "strategy": return "Strategy";
    case "_partials": return "Partial";
    default: return "Document";
  }
};

const fileSlug = (filePath) => path.basename(filePath, path.extname(filePath));
const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
const isValidSlug = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || ""));

const countFrontmatterBlocks = (raw) => {
  const matches = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/gm);
  return matches ? matches.length : 0;
};

const extractFirstFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return null;
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return { yamlText: match[1], body: raw.slice(match[0].length).replace(/^\s*---\s*$/gm, "***") };
};

// ------------------------------------------------------------
// FIELD SCHEMAS (Enhanced for City Gate)
// ------------------------------------------------------------
const COMMON_FIELDS = new Set([
  "title", "slug", "href", "aliases", "docKind", "type",
  "date", "updated", "publishedDate",
  "draft", "published", "featured", "priority",
  "author", "authorTitle",
  "excerpt", "description", "subtitle", "category", "tags",
  "theme", "layout", "density", "canonicalUrl", "socialCaption",
  "coverImage", "featuredImage", "coverAspect", "coverFit", "coverPosition",
  "accessLevel", "lockMessage", "tier", "requiresAuth", "preload",
  "readTime", "readingTime", "readtime",
  "resources", "downloads", "relatedDownloads",
  "keyInsights", "authorNote",
  "ogTitle", "ogDescription", "ogImage", "twitterTitle", "twitterDescription", "twitterImage",
]);

const TYPE_FIELDS = {
  Post: new Set(["series", "isSeriesPart", "seriesOrder"]),
  Book: new Set(["isbn", "pages", "publisher", "edition", "format"]),
  Canon: new Set(["canonType", "volumeNumber", "order", "volume", "part", "subtitle"]),
  Download: new Set(["downloadType", "format", "fileFormat", "fileUrl", "fileSize", "requiresEmail", "version"]),
  Short: new Set(["hook", "callToAction", "shortType", "categoryLabel", "isIntelligence"]), // Added for Intelligence Strip
  Event: new Set(["eventType", "location", "startDate", "endDate", "registrationUrl"]),
  Print: new Set(["printType", "price", "currency", "isPhysical"]),
  Resource: new Set(["downloadUrl", "links", "resourceType"]),
  Strategy: new Set(["strategyType", "stage", "industry", "region", "complexity", "timeframe", "deliverables", "version"]),
  Document: new Set([]),
  Partial: new Set([]),
};

const allowedForType = (type) => new Set([...COMMON_FIELDS, ...(TYPE_FIELDS[type] || [])]);

// ------------------------------------------------------------
// VALIDATION LOGIC
// ------------------------------------------------------------
const validateOne = (filePath) => {
  const relativePath = path.relative(contentDir, filePath);
  const raw = readFileSafe(filePath);
  if (!raw) return { path: relativePath, valid: false, errors: ["Cannot read file"], warnings: [] };

  const fm = extractFirstFrontmatter(raw);
  const errors = [];
  const warnings = [];

  if (!fm) {
    errors.push("Missing frontmatter block.");
    return { path: relativePath, valid: false, errors, warnings };
  }

  let parsed;
  try { parsed = yaml.load(fm.yamlText) || {}; } 
  catch (e) { errors.push(`YAML error: ${e.message}`); return { path: relativePath, valid: false, errors, warnings }; }

  const folderType = getTypeFromRelativePath(relativePath);
  const allowed = allowedForType(folderType);

  if (!parsed.title) errors.push("Missing required field: title");
  
  const requiresDate = REQUIRE_DATE_FOR_ALL || folderType === "Post" || folderType === "Short";
  if (requiresDate && !parsed.date) errors.push("Missing required field: date");

  // Validate Slug format
  if (STRICT_SLUG_FORMAT && parsed.slug) {
    if (!isValidSlug(parsed.slug)) errors.push(`Invalid slug: ${parsed.slug}`);
  }

  // Check for unknown fields
  Object.keys(parsed).forEach(key => {
    if (!allowed.has(key)) {
      const msg = `Unknown field "${key}" for type ${folderType}`;
      if (STRICT_UNKNOWN_FIELDS) errors.push(msg);
      else warnings.push(msg);
    }
  });

  return { path: relativePath, type: folderType, valid: errors.length === 0, errors, warnings };
};

// ------------------------------------------------------------
// EXECUTION
// ------------------------------------------------------------
const files = getAllFiles(contentDir);
const results = files.map(validateOne).filter(r => r.type !== "Partial");
const errorRows = results.filter(r => r.errors.length);

console.log(`\n📌 Frontmatter Scan: ${results.length} files. Fatal: ${errorRows.length}\n`);

if (errorRows.length) {
  errorRows.forEach(r => r.errors.forEach(e => console.log(`❌ ${r.path}: ${e}`)));
  process.exit(1);
}

console.log("✅ All content frontmatter validated successfully.");
process.exit(0);