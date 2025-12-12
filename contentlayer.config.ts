// contentlayer.config.ts - UPDATED with YAML fix
import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// -----------------------------------------------------------------------------
// COMMON FIELDS
// -----------------------------------------------------------------------------
const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },
  slug: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  coverImage: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  href: { type: "string", required: false },
} as const;

// -----------------------------------------------------------------------------
// URL HELPER
// -----------------------------------------------------------------------------
function getDocUrl(doc: any, basePath: string): string {
  if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
    const href = doc.href.trim();
    return href.startsWith("/") ? href : `/${href}`;
  }
  
  const slug = doc.slug || doc._raw.flattenedPath.replace(`${basePath}/`, "").replace(/\/index$/, "");
  return `/${basePath}/${slug}`;
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "blog"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "resources"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "downloads"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "books"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "events"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "prints"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "strategy"),
    },
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
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "canon"),
    },
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
    date: { type: "date", required: false },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => getDocUrl(doc, "shorts"),
    },
  },
}));

// -----------------------------------------------------------------------------
// MAKESOURCE CONFIGURATION - WITH YAML FIX
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
  
  // CRITICAL: Fix duplicate YAML keys in print files
  onContent: (content, filePath) => {
    // Fix duplicate slug and date fields (line 6 issue)
    const fixed = content
      .replace(/(slug:\s*"[^"]+"\s*\n)(slug:\s*"[^"]+")/g, '$1')
      .replace(/(date:\s*"[^"]+"\s*\n)(date:\s*"[^"]+")/g, '$1')
      .replace(/(slug:\s*"[^"]+"\s*\r?\n)(slug:\s*"[^"]+")/g, '$1')
      .replace(/(date:\s*"[^"]+"\s*\r?\n)(date:\s*"[^"]+")/g, '$1');
    
    return fixed;
  },
  
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});