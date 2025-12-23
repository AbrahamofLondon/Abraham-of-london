// contentlayer.config.ts — ROBUST, WINDOWS-SAFE, ALIAS-AWARE - FIXED
import path from "path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -----------------------------------------------------------------------------
   HELPERS
----------------------------------------------------------------------------- */

type AnyDoc = {
  _raw: { flattenedPath: string };
  slug?: string | null;
  href?: string | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Normalize path separators to forward slashes (Windows-safe). */
function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Strip leading/trailing slashes */
function trimSlashes(s: string): string {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

/** Ensure URL starts with "/" and has no trailing slash (unless root "/"). */
function normalizeUrl(url: string): string {
  const u = `/${trimSlashes(url)}`;
  return u === "/" ? "/" : u.replace(/\/+$/, "");
}

/** Remove trailing "/index" from derived path segments. */
function stripIndex(p: string): string {
  return p.replace(/\/index$/i, "");
}

/** Derive slug segment from flattenedPath, removing base dir prefix if present. */
function deriveSegmentFromFlattenedPath(flattenedPath: string, basePath: string): string {
  const fp = stripIndex(toPosix(flattenedPath));
  const base = trimSlashes(basePath);

  // flattenedPath usually includes the content subdir, e.g. "blog/my-post"
  if (fp === base) return ""; // root index for that section
  if (fp.startsWith(`${base}/`)) return fp.slice(base.length + 1);

  // fallback if file lives elsewhere or pattern changes
  return fp;
}

/** Canonical doc URL resolver with override support. */
function getDocUrl(doc: AnyDoc, basePath: string): string {
  const base = trimSlashes(basePath);

  // 1) explicit href wins
  if (isNonEmptyString(doc.href)) {
    return normalizeUrl(doc.href);
  }

  // 2) explicit slug next
  if (isNonEmptyString(doc.slug)) {
    const provided = trimSlashes(doc.slug);

    // If user already included base prefix, don't double-prefix
    if (provided === base) return `/${base}`;
    if (provided.startsWith(`${base}/`)) return `/${provided}`;

    return normalizeUrl(`${base}/${provided}`);
  }

  // 3) derive from file path
  const seg = deriveSegmentFromFlattenedPath(doc._raw.flattenedPath, base);
  return seg ? normalizeUrl(`${base}/${seg}`) : normalizeUrl(base);
}

/**
 * Frontmatter hardening:
 * - removes duplicate YAML keys ONLY within the initial frontmatter block
 * - normalizes "readtime:" -> "readTime:" to keep your schemas consistent
 */
function sanitizeFrontmatter(raw: string): string {
  // If no frontmatter, return as-is
  if (!raw.startsWith("---")) return raw;

  const endIdx = raw.indexOf("\n---", 3);
  if (endIdx === -1) return raw;

  const fm = raw.slice(0, endIdx + 4); // includes closing '---\n'
  const body = raw.slice(endIdx + 4);

  const lines = fm.split(/\r?\n/);

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const line of lines) {
    // keep separators
    if (line.trim() === "---") {
      cleaned.push(line);
      continue;
    }

    // normalize readtime key casing
    const normalizedLine = line.replace(/^readtime\s*:/i, "readTime:");

    // detect "key:" at start (YAML simple key)
    const m = normalizedLine.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!m) {
      cleaned.push(normalizedLine);
      continue;
    }

    const key = m[1];

    // allow multi-occur keys (rare) if you want — but for now dedupe strictly
    if (seen.has(key)) {
      // drop duplicate key line
      continue;
    }

    seen.add(key);
    cleaned.push(normalizedLine);
  }

  return cleaned.join("\n") + body;
}

/**
 * Make mdx-bundler (esbuild) resolve TS path aliases like "@/components/Thing".
 * Contentlayer2 uses mdx-bundler under the hood and exposes esbuildOptions hook.
 */
function withAppAliases(esbuildOptions: any) {
  const root = process.cwd();

  esbuildOptions.alias = {
    ...(esbuildOptions.alias || {}),
    "@": root,
    "@/components": path.join(root, "components"),
    "@/lib": path.join(root, "lib"),
    "@/types": path.join(root, "types"),
    "@/content": path.join(root, "content"),
  };

  // Optional: make resolution behave more predictably in mixed TS/JS repos
  esbuildOptions.resolveExtensions = [
    ".tsx",
    ".ts",
    ".jsx",
    ".js",
    ".json",
    ".mdx",
    ".md",
  ];

  return esbuildOptions;
}

/* -----------------------------------------------------------------------------
   COMMON FIELDS (single source of truth)
----------------------------------------------------------------------------- */

const commonFields = {
  title: { type: "string", required: true },
  // Some of your documents might legitimately omit date (Shorts often do)
  // We'll allow per-type overrides below.
  date: { type: "date", required: false },

  // optional overrides / routing helpers
  slug: { type: "string", required: false },
  href: { type: "string", required: false },

  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  coverImage: { type: "string", required: false },

  tags: { type: "list", of: { type: "string" }, required: false },

  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },

  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
} as const;

/* -----------------------------------------------------------------------------
   DOCUMENT TYPES
----------------------------------------------------------------------------- */

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    // Posts should have date; enforce here
    date: { type: "date", required: true },

    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false },
    readTime: { type: "string", required: false },
    category: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },

    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },

    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    keyInsights: { type: "json", required: false },
    authorNote: { type: "string", required: false },
    layout: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "blog") },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    date: { type: "date", required: false },

    author: { type: "string", required: false },

    // ✅ accept BOTH to avoid "extra fields" warnings
    readtime: { type: "string", required: false }, // legacy
    readTime: { type: "string", required: false }, // canonical

    subtitle: { type: "string", required: false },
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as any, "resources") },

    // ✅ normalized output used everywhere in UI
    normalizedReadTime: {
      type: "string",
      resolve: (doc: any) =>
        (typeof doc.readTime === "string" && doc.readTime.trim()) ||
        (typeof doc.readtime === "string" && doc.readtime.trim()) ||
        "",
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    // downloads should have date? optional to avoid breaking existing library
    date: { type: "date", required: false },

    author: { type: "string", required: false },
    category: { type: "string", required: false },
    layout: { type: "string", required: false },
    readTime: { type: "string", required: false }, // normalized
    subtitle: { type: "string", required: false },

    file: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    fileSize: { type: "string", required: false },

    downloadFile: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    type: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "downloads") },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    date: { type: "date", required: false },

    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
    category: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "books") },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    // events can rely on eventDate; don't require date
    date: { type: "date", required: false },

    time: { type: "string", required: false },
    eventDate: { type: "date", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "events") },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    date: { type: "date", required: false },

    dimensions: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    price: { type: "string", required: false },
    available: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "prints") },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    // strategy docs probably have date, but don't enforce
    date: { type: "date", required: false },

    author: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "strategy") },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    date: { type: "date", required: false },

    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
    readTime: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "canon") },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    // Shorts: date is often missing; keep optional
    date: { type: "date", required: false },

    theme: { type: "string", required: false },
    audience: { type: "string", required: false },
    readTime: { type: "string", required: false },
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc as AnyDoc, "shorts") },
  },
}));

/* -----------------------------------------------------------------------------
   SOURCE CONFIG
----------------------------------------------------------------------------- */

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Strategy, Resource, Canon, Short],

  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],

    // 🔥 This is the fix for your "@/components/..." resolution in MDX.
    esbuildOptions: (options) => withAppAliases(options),
  },

  // Harden content before parsing (frontmatter dedupe + readtime normalization)
  onContent: (content) => sanitizeFrontmatter(content),

  onUnknownDocuments: "skip-warn", // FIXED: Changed from "skip" to "skip-warn"

  // Keep your existing intent
  disableImportAliasWarning: true,
});