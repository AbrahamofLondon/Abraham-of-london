// scripts/codemod-frontmatter.mjs
import fs from "fs/promises";
import path from "path";
import process from "process";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

const ACCESS_LEVELS = new Set([
  "public",
  "free",
  "inner-circle",
  "basic",
  "inner-circle-plus",
  "premium",
  "inner-circle-elite",
  "enterprise",
  "private",
  "restricted",
]);

const TIERS = new Set([
  "public",
  "free",
  "inner-circle",
  "basic",
  "inner-circle-plus",
  "premium",
  "inner-circle-elite",
  "enterprise",
  "private",
  "restricted",
]);

async function loadDeps() {
  try {
    const matterMod = await import("gray-matter");
    const yamlMod = await import("js-yaml");
    const prettierMod = await import("prettier");
    return {
      matter: matterMod.default ?? matterMod,
      yaml: yamlMod.default ?? yamlMod,
      prettier: prettierMod.default ?? prettierMod,
    };
  } catch {
    console.error("❌ Missing dependency: gray-matter/js-yaml/prettier");
    console.error("Run: pnpm add -D gray-matter js-yaml prettier");
    process.exit(1);
  }
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".md") || p.endsWith(".mdx")) out.push(p);
  }
  return out;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function inferTypeFromPath(relativePath) {
  if (relativePath.startsWith("content/blog/")) return "Post";
  if (relativePath.startsWith("content/books/")) return "Book";
  if (relativePath.startsWith("content/canon/")) return "Canon";
  if (relativePath.startsWith("content/downloads/")) return "Download";
  if (relativePath.startsWith("content/shorts/")) return "Short";
  if (relativePath.startsWith("content/events/")) return "Event";
  if (relativePath.startsWith("content/prints/")) return "Print";
  if (relativePath.startsWith("content/resources/")) return "Resource";
  if (relativePath.startsWith("content/strategy/")) return "Strategy";
  return null;
}

// Prefer consistent order in YAML so diffs stay stable.
const KEY_ORDER = [
  "type",
  "title",
  "subtitle",
  "slug",
  "href",
  "description",
  "excerpt",
  "date",
  "updated",
  "author",
  "authorTitle",
  "readTime",
  "draft",
  "published",
  "featured",
  "priority",
  "tags",
  "category",

  // social/SEO
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "socialCaption",

  // cover
  "coverImage",
  "coverAspect",
  "coverFit",
  "coverPosition",

  // gating
  "accessLevel",
  "lockMessage",
  "tier",
  "requiresAuth",
  "preload",
  "version",

  // downloads core
  "downloadType",
  "format",
  "paperFormats",
  "fileUrl",
  "fileSize",
  "checksumMd5",
  "isInteractive",
  "isFillable",
  "layout",
  "contentOnly",

  // download editorials
  "language",
  "ctaPrimary",
  "ctaSecondary",
  "related",
  "relatedDownloads",

  // legacy keys we may preserve
  "downloadUrl",
  "downloadFile",
  "pdfPath",
  "file",
  "readingTime",
  "readtime",
  "fileFormat",

  // catch-all (we keep any unknown keys at end)
];

function sortKeys(obj) {
  const out = {};
  const seen = new Set();

  for (const k of KEY_ORDER) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k];
      seen.add(k);
    }
  }

  // append remaining keys deterministically
  const rest = Object.keys(obj)
    .filter((k) => !seen.has(k))
    .sort((a, b) => a.localeCompare(b));
  for (const k of rest) out[k] = obj[k];

  return out;
}

function normalizeReadTime(data) {
  if (!data.readTime) {
    if (isNonEmptyString(data.readingTime)) {
      data.readTime = data.readingTime.trim();
      delete data.readingTime;
      data.__changed = true;
    } else if (isNonEmptyString(data.readtime)) {
      data.readTime = data.readtime.trim();
      delete data.readtime;
      data.__changed = true;
    }
  }
}

function normalizeRequiresAuthToAccessLevel(data) {
  if (data.requiresAuth === true && !isNonEmptyString(data.accessLevel)) {
    data.accessLevel = "inner-circle";
    data.__changed = true;
  }
}

function normalizeAccessLevelEnum(data) {
  if (!isNonEmptyString(data.accessLevel)) return;

  const v = String(data.accessLevel).trim();
  if (!ACCESS_LEVELS.has(v)) {
    data.accessLevelLegacy = v;
    data.accessLevel = "public";
    data.__changed = true;
  } else if (v !== data.accessLevel) {
    data.accessLevel = v;
    data.__changed = true;
  }
}

function normalizeTierEnum(data) {
  if (!isNonEmptyString(data.tier)) return;

  const v = String(data.tier).trim();
  if (!TIERS.has(v)) {
    data.tierLegacy = v;
    data.tier = "public";
    data.__changed = true;
  } else if (v !== data.tier) {
    data.tier = v;
    data.__changed = true;
  }
}

function normalizeDownloadFilePointers(data) {
  // Only apply to downloads; caller decides.
  // Strategy:
  // - If fileUrl missing but one of legacy keys exists, migrate to fileUrl.
  // - Keep legacy key for backwards compatibility (you can toggle to delete).
  if (isNonEmptyString(data.fileUrl)) return;

  const legacyCandidates = ["file", "downloadFile", "pdfPath", "downloadUrl"];
  for (const k of legacyCandidates) {
    if (isNonEmptyString(data[k])) {
      data.fileUrl = String(data[k]).trim();
      data.__changed = true;
      return;
    }
  }
}

function normalizeDownloadFormatKeys(data) {
  if (isNonEmptyString(data.fileFormat) && !isNonEmptyString(data.format)) {
    data.format = String(data.fileFormat).trim();
    delete data.fileFormat;
    data.__changed = true;
  }
}

function normalizeBooleans(data) {
  // enforce booleans on common flags
  const boolKeys = ["draft", "published", "featured", "priority", "requiresAuth", "preload", "contentOnly", "isInteractive", "isFillable"];
  for (const k of boolKeys) {
    if (data[k] === "true") { data[k] = true; data.__changed = true; }
    if (data[k] === "false") { data[k] = false; data.__changed = true; }
  }
}

function normalizeStrings(data) {
  const strKeys = ["title", "subtitle", "slug", "href", "author", "authorTitle", "readTime", "category", "description", "excerpt", "canonicalUrl", "ogTitle", "ogDescription", "socialCaption", "coverImage", "coverAspect", "coverFit", "coverPosition", "accessLevel", "lockMessage", "tier", "version", "downloadType", "format", "fileUrl", "fileSize", "checksumMd5", "layout", "language"];
  for (const k of strKeys) {
    if (isNonEmptyString(data[k])) {
      const trimmed = String(data[k]).trim();
      if (trimmed !== data[k]) {
        data[k] = trimmed;
        data.__changed = true;
      }
    }
  }
}

function normalizeType(data, inferredType) {
  if (!isNonEmptyString(data.type) && inferredType) {
    data.type = inferredType;
    data.__changed = true;
  }
}

function normalizeDownloadDefaults(data) {
  // If a download has no fileUrl and is intended content-only, set contentOnly true.
  // We do NOT guess this automatically. Only set if explicitly hinted by layout/content-only fields.
  // Leave as-is; validator will enforce it. This function exists for future extension.
}

function codemodOne(filePath, matter, yaml) {
  const raw = filePath.__raw;
  const parsed = matter(raw);
  const data = parsed.data || {};
  const content = parsed.content || "";

  const rp = rel(filePath.__path);
  const inferred = inferTypeFromPath(rp);

  // Marker for change tracking
  data.__changed = false;

  normalizeType(data, inferred);
  normalizeBooleans(data);
  normalizeStrings(data);
  normalizeReadTime(data);

  normalizeRequiresAuthToAccessLevel(data);
  normalizeAccessLevelEnum(data);
  normalizeTierEnum(data);

  if (data.type === "Download") {
    normalizeDownloadFormatKeys(data);
    normalizeDownloadFilePointers(data);
    normalizeDownloadDefaults(data);
  }

  const changed = data.__changed === true;

  // Remove internal marker
  delete data.__changed;

  const sorted = sortKeys(data);

  // YAML stringify with predictable formatting
  const fm = yaml.dump(sorted, {
    lineWidth: 1000,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });

  const rebuilt = `---\n${fm}---\n${content.startsWith("\n") ? content.slice(1) : content}`;

  return { changed, rebuilt };
}

async function main() {
  const { matter, yaml, prettier } = await loadDeps();

  const files = await walk(CONTENT_DIR);

  let changedCount = 0;

  for (const abs of files) {
    const raw = await fs.readFile(abs, "utf8");
    if (!raw.startsWith("---")) continue;

    const payload = { __path: abs, __raw: raw };
    const { changed, rebuilt } = codemodOne(payload, matter, yaml);

    if (!changed) continue;

    // Prettier for stable newlines. We do not parse YAML here; just keep formatting clean.
    const formatted = await prettier.format(rebuilt, {
      parser: abs.endsWith(".mdx") ? "mdx" : "markdown",
    });

    await fs.writeFile(abs, formatted, "utf8");
    changedCount++;
  }

  console.log("========================================");
  console.log("🛠️ Frontmatter Codemod Report");
  console.log("========================================");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files changed: ${changedCount}`);
  console.log("");
  console.log("✅ Codemod complete.");
  console.log("Next: run `pnpm run content:validate` to confirm the drift is dead.");
}

main().catch((e) => {
  console.error("❌ Codemod crashed:", e);
  process.exit(1);
});