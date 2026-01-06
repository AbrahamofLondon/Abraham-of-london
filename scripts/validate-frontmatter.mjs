// scripts/validate-frontmatter.mjs
import fs from "fs/promises";
import path from "path";
import process from "process";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

async function loadDeps() {
  try {
    const matterMod = await import("gray-matter");
    const yamlMod = await import("js-yaml");
    return {
      matter: matterMod.default ?? matterMod,
      yaml: yamlMod.default ?? yamlMod,
    };
  } catch {
    console.error("❌ Missing dependency: gray-matter/js-yaml");
    console.error("Run: pnpm add -D gray-matter js-yaml");
    process.exit(1);
  }
}

const SHARED_ALLOWED = new Set([
  "type",
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
  "readTime",
  "draft",
  "published",
  "tags",
  "category",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "socialCaption",
  "coverImage",
  "coverAspect",
  "coverFit",
  "coverPosition",
  "featured",
  "priority",
  "accessLevel",
  "lockMessage",

  // ✅ legacy/ops fields
  "tier",
  "requiresAuth",
  "preload",
  "version",
]);

const TYPE_ALLOWED = {
  Post: new Set([
    ...SHARED_ALLOWED,
    "layout",
    "density",
    "resources",
    "downloads",
    "relatedDownloads",

    // ✅ blog extras
    "featuredImage",
    "isPartTwo",
    "previousPart",
  ]),
  Book: new Set([...SHARED_ALLOWED, "series"]),
  Canon: new Set([...SHARED_ALLOWED, "order", "volumeNumber"]),
  Download: new Set([
    ...SHARED_ALLOWED,
    "downloadType",
    "format",
    "paperFormats",
    "fileUrl",
    "fileSize",
    "checksumMd5",
    "isInteractive",
    "isFillable",
    "layout",
    "useLegacyDiagram",
    "useProTip",
    "useFeatureGrid",
    "useDownloadCTA",
    "proTipType",
    "proTipContent",
    "featureGridColumns",
    "featureGridItems",
    "ctaConfig",
    "downloadProcess",
    "relatedDownloads",
    "contentOnly",

    // ✅ editorial extras
    "language",
    "ctaPrimary",
    "ctaSecondary",
    "related",

    // legacy tolerated
    "downloadUrl",
    "downloadFile",
    "pdfPath",
    "file",
    "fileFormat",
    "readingTime",
    "readtime",
  ]),
  Short: new Set([...SHARED_ALLOWED, "shortType", "audience", "theme", "hook", "callToAction"]),
  Event: new Set([...SHARED_ALLOWED, "eventType", "location", "startDate", "endDate", "registrationUrl", "eventDate", "time"]),
  Print: new Set([
    ...SHARED_ALLOWED,
    "printType",
    "fileUrl",
    "downloadUrl",
    // ✅ print meta used in templates
    "format",
    "paperFormats",
    "fileSize",
  ]),
  Resource: new Set([...SHARED_ALLOWED, "resourceType", "fileUrl", "downloadUrl", "links", "resources", "readtime", "readingTime"]),
  Strategy: new Set([
    ...SHARED_ALLOWED,
    "strategyType",
    "stage",
    // ✅ taxonomy
    "industry",
    "region",
  ]),
};

function inferTypeFromPath(relativePath) {
  if (relativePath.startsWith("content/blog/")) return "Post";
  if (relativePath.startsWith("content/books/")) return "Book";
  if (relativePath.startsWith("content/canon/")) return "Canon";
  if (relativePath.startsWith("content/downloads/")) return "Download";
  if (relativePath.startsWith("content/shorts/")) return "Short";
  if (relativePath.startsWith("content/events/")) return "Event";
  if (relativePath.startsWith("content/prints/")) return "Print";
  if (relativePath.startsWith("content/resources/")) return "Resource";
  // ✅ FIX: your repo folder
  if (relativePath.startsWith("content/strategy/")) return "Strategy";
  return null;
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

function resolveDownloadFileUrl(data) {
  return (
    (isNonEmptyString(data.fileUrl) && data.fileUrl) ||
    (isNonEmptyString(data.downloadUrl) && data.downloadUrl) ||
    (isNonEmptyString(data.downloadFile) && data.downloadFile) ||
    (isNonEmptyString(data.pdfPath) && data.pdfPath) ||
    (isNonEmptyString(data.file) && data.file) ||
    ""
  );
}

async function main() {
  const { matter } = await loadDeps();

  const files = await walk(CONTENT_DIR);

  const errors = [];

  for (const abs of files) {
    const rp = rel(abs);
    const raw = await fs.readFile(abs, "utf8");
    if (!raw.startsWith("---")) continue;

    const parsed = matter(raw);
    const data = parsed.data || {};

    const inferred = inferTypeFromPath(rp);
    const type = data.type || inferred;

    if (!type || !TYPE_ALLOWED[type]) {
      errors.push(`${rp}: unknown or missing type "${type || ""}"`);
      continue;
    }

    const allowed = TYPE_ALLOWED[type];
    for (const key of Object.keys(data)) {
      if (!allowed.has(key)) errors.push(`${rp}: unknown field "${key}" for type ${type}`);
    }

    if (type === "Download") {
      const contentOnly = data.contentOnly === true;
      const url = resolveDownloadFileUrl(data);
      if (!contentOnly && !isNonEmptyString(url)) {
        errors.push(`${rp}: Download missing fileUrl (or legacy file/downloadFile/pdfPath/downloadUrl). Set contentOnly:true if intentional.`);
      }
    }
  }

  console.log("========================================");
  console.log("📌 Frontmatter Validation Report");
  console.log("========================================");
  console.log(`Scanned: ${files.length} files`);
  console.log(`Errors:  ${errors.length}`);
  console.log(`Warnings:0`);
  console.log("");

  if (errors.length) {
    console.log("❌ Errors (fatal):");
    for (const e of errors) console.log(` - ${e}`);
    process.exit(1);
  }

  console.log("✅ Frontmatter is clean. Drift is dead.");
}

main().catch((e) => {
  console.error("❌ Validator crashed:", e);
  process.exit(1);
});