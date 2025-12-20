import path from "path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -----------------------------------------------------------------------------
 * COMMON FIELDS (single source of truth)
 * -------------------------------------------------------------------------- */
const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },

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
 * SLUG + URL HELPERS (robust + consistent)
 * -------------------------------------------------------------------------- */

/**
 * Canonical slug normaliser.
 * Accepts:
 *  - "my-post"
 *  - "/blog/my-post"
 *  - "blog/my-post/"
 *  - "https://www.site.com/blog/my-post?x=y#z"
 * Returns:
 *  - "my-post"
 */
function toCanonicalSlug(input: unknown): string {
  let s = String(input ?? "").trim();
  if (!s) return "";

  // strip query/hash
  s = s.split("#")[0]?.split("?")[0] ?? s;

  // strip protocol+domain if present
  s = s.replace(/^https?:\/\/[^/]+/i, "");

  // normalise slashes + casing
  s = s.toLowerCase();
  s = s.replace(/\/+$/, ""); // trailing
  s = s.replace(/^\/+/, ""); // leading

  if (!s) return "";

  // take last segment if a path is provided
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/**
 * Derive a stable "relative slug" from flattenedPath for a given basePath.
 * Examples:
 *  - flattenedPath="blog/alpha" basePath="blog" -> "alpha"
 *  - flattenedPath="blog/index" basePath="blog" -> ""  (means /blog)
 *  - flattenedPath="canon/volume-i/index" basePath="canon" -> "volume-i"
 */
function deriveRelativeSlug(flattenedPath: string, basePath: string): string {
  const fp = String(flattenedPath ?? "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!fp) return "";

  const base = String(basePath ?? "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  const withoutBase = fp.startsWith(`${base}/`) ? fp.slice(base.length + 1) : fp;

  // remove trailing /index
  const cleaned = withoutBase.replace(/\/index$/i, "");
  return cleaned;
}

/**
 * Ensures a string starts with exactly one leading slash.
 */
function ensureLeadingSlash(s: string): string {
  return `/${String(s ?? "").replace(/^\/+/, "")}`;
}

/**
 * Join basePath + relativeSlug safely:
 *  - basePath="blog", rel="alpha" -> "/blog/alpha"
 *  - basePath="blog", rel=""      -> "/blog"
 */
function joinBase(basePath: string, rel: string): string {
  const base = `/${String(basePath).replace(/^\/+|\/+$/g, "")}`;
  const r = String(rel ?? "").replace(/^\/+|\/+$/g, "");
  return r ? `${base}/${r}` : base;
}

/**
 * Robust + consistent URL generator.
 * Priority:
 *  1) doc.href (hard override)
 *  2) doc.slug (canonicalised, last segment)
 *  3) derived from _raw.flattenedPath (relative to basePath)
 */
function getDocUrl(doc: any, basePath: string): string {
  // 1) hard override href
  if (doc?.href && typeof doc.href === "string" && doc.href.trim()) {
    const raw = doc.href.trim();
    // remove trailing slash for consistency
    const noTrail = raw.replace(/\/+$/, "");
    return ensureLeadingSlash(noTrail);
  }

  // 2) slug override
  if (doc?.slug && typeof doc.slug === "string" && doc.slug.trim()) {
    const canonical = toCanonicalSlug(doc.slug);
    // slug can be empty if someone set "/blog/" by mistake
    return joinBase(basePath, canonical);
  }

  // 3) fallback: derive from file path
  const rel = deriveRelativeSlug(doc?._raw?.flattenedPath, basePath);

  // If rel points to nested folders ("volume-i/intro"), we take last segment for URL
  // but preserve index behaviour by allowing rel="".
  if (!rel) return joinBase(basePath, "");

  const last = toCanonicalSlug(rel); // last segment, lowercased
  return joinBase(basePath, last);
}

/* -----------------------------------------------------------------------------
 * DOCUMENT TYPES
 * -------------------------------------------------------------------------- */

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
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
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "blog") },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "resources") },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    category: { type: "string", required: false },
    layout: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
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
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "downloads") },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
    category: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "books") },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    time: { type: "string", required: false },
    eventDate: { type: "date", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "events") },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    dimensions: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    price: { type: "string", required: false },
    available: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "prints") },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "strategy") },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
    readTime: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "canon") },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...commonFields,
    theme: { type: "string", required: false },
    audience: { type: "string", required: false },
    readTime: { type: "string", required: false },
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => getDocUrl(doc, "shorts") },
  },
}));

/* -----------------------------------------------------------------------------
 * FRONTMATTER SAFETY GUARD
 * - only modifies real YAML frontmatter blocks
 * - removes duplicated slug/date keys inside the block
 * -------------------------------------------------------------------------- */

function fixDuplicateKeysInFrontmatter(raw: string): string {
  // Only act if the file starts with a frontmatter fence.
  if (!raw.startsWith("---")) return raw;

  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;

  const fm = raw.slice(0, end + 4); // include closing --- line
  const body = raw.slice(end + 4);

  // Remove duplicate slug/date lines (keep the first occurrence only)
  const lines = fm.split(/\r?\n/);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z0-9_]+):\s*/);
    if (!keyMatch) {
      out.push(line);
      continue;
    }

    const key = keyMatch[1];
    if ((key === "slug" || key === "date") && seen.has(key)) {
      // drop duplicates
      continue;
    }

    if (key === "slug" || key === "date") {
      seen.add(key);
    }

    out.push(line);
  }

  return out.join("\n") + body;
}

/* -----------------------------------------------------------------------------
 * MAKE SOURCE
 * -------------------------------------------------------------------------- */

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [
    Post,
    Download,
    Book,
    Event,
    Print,
    Strategy,
    Resource,
    Canon,
    Short,
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
  onContent: (content) => fixDuplicateKeysInFrontmatter(content),
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});