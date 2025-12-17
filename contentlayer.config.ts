// contentlayer.config.ts
import path from "path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// -----------------------------------------------------------------------------
// COMMON FIELDS (single source of truth)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// URL HELPER (robust + consistent)
// -----------------------------------------------------------------------------
function normalizeSlugFromFlattenedPath(
  flattenedPath: string,
  basePath: string
): string {
  // flattenedPath examples:
  // - "shorts/my-post"
  // - "shorts/index" (we treat as "/shorts")
  // - "blog/some-slug"
  const withoutBase = flattenedPath.startsWith(`${basePath}/`)
    ? flattenedPath.slice(basePath.length + 1)
    : flattenedPath;

  // Remove trailing "/index"
  return withoutBase.replace(/\/index$/, "");
}

function getDocUrl(doc: any, basePath: string): string {
  // hard override
  if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
    const href = doc.href.trim();
    // Ensure trailing slash for consistency with Next.js config
    const withSlash = href.endsWith("/") ? href : `${href}/`;
    return withSlash.startsWith("/") ? withSlash : `/${withSlash}`;
  }

  // slug override
  if (doc.slug && typeof doc.slug === "string" && doc.slug.trim()) {
    const s = doc.slug.trim().replace(/^\/+/, "");
    // If user provides "shorts/foo" we don't double-prefix
    const url = s.startsWith(`${basePath}/`) ? `/${s}` : `/${basePath}/${s}`;
    // Ensure trailing slash
    return url.endsWith("/") ? url : `${url}/`;
  }

  // fallback: derive from file path
  const derived = normalizeSlugFromFlattenedPath(doc._raw.flattenedPath, basePath);
  const url = derived ? `/${basePath}/${derived}` : `/${basePath}`;
  // Ensure trailing slash
  return url.endsWith("/") ? url : `${url}/`;
}

// -----------------------------------------------------------------------------
// DOCUMENT TYPES
// -----------------------------------------------------------------------------
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "shorts"),
    },
  },
}));

// -----------------------------------------------------------------------------
// MAKESOURCE CONFIGURATION
// -----------------------------------------------------------------------------
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

  // Fix duplicate YAML keys if they exist (safe + minimal)
  onContent: (content) => {
    // Only remove immediate duplicate key lines (slug/date) inside frontmatter-like structures
    // This prevents "YAMLException: duplicated mapping key" without touching normal body content.
    const fixed = content
      .replace(/(^|\n)(slug:\s*.+)\r?\nslug:\s*.+(\r?\n)/g, "$1$2$3")
      .replace(/(^|\n)(date:\s*.+)\r?\ndate:\s*.+(\r?\n)/g, "$1$2$3");
    return fixed;
  },

  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});