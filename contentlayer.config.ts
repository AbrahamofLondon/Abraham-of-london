// contentlayer.config.ts - FINAL FIXED VERSION
import {
  defineDocumentType,
  defineNestedType,
  makeSource,
} from "contentlayer2/source-files";
import path from "path";

// ------------------------------------------------------------
// Windows detection and helpers
// ------------------------------------------------------------

const IS_WINDOWS = process.platform === "win32";

function getWindowsIgnoredPaths(): string[] {
  if (!IS_WINDOWS) return [];
  
  console.log("[Contentlayer] Windows detected - applying file permission workarounds");
  
  return [
    // Skip entire public directory and its subdirectories
    "**/public/**",
    "**/assets/**",
    
    // Specific problematic file patterns that cause EPERM errors
    "**/*.pdf",
    "**/*.pptx", 
    "**/*.docx",
    "**/*.xlsx",
    
    // Windows-specific lock files
    "**/Thumbs.db",
    "**/desktop.ini",
    "**/.lock",
    
    // Specific problematic file from error
    "**/leadership-standards-blueprint.pdf",
  ];
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function estimateReadTime(text: string): string {
  const words = String(text || "")
    .replace(/[`*_>#~\[\]\(\)\{\}.,;:!?'"\"\"\\\/|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function safeRawBody(doc: any): string {
  // Contentlayer2: body may be { raw }, or may be missing on non-mdx, etc.
  // This guarantees computed readTime never throws.
  return String(doc?.body?.raw || doc?.body?.code || doc?.body || "");
}

function stripPrefix(s: string, prefix: string): string {
  const v = String(s || "");
  return v.startsWith(prefix) ? v.slice(prefix.length) : v;
}

function defaultSlugFrom(doc: any, prefix: string): string {
  const flat = String(doc?._raw?.flattenedPath || "");
  return stripPrefix(flat, prefix);
}

function defaultHrefFrom(doc: any, prefix: string, routeBase: string): string {
  const flat = String(doc?._raw?.flattenedPath || "");
  const slug = stripPrefix(flat, prefix);
  return `/${routeBase}/${slug}`;
}

// ------------------------------------------------------------
// Nested types
// ------------------------------------------------------------

// Resolve "Extra Field" drama for life-alignment-assessment.mdx + allow richer download metadata
const DownloadMeta = defineNestedType(() => ({
  name: "DownloadMeta",
  fields: {
    file: { type: "string", required: true },
    label: { type: "string", required: false },
    isFillable: { type: "boolean", required: false, default: false },
    isInteractive: { type: "boolean", required: false, default: false },
  },
}));

const DownloadLink = defineNestedType(() => ({
  name: "DownloadLink",
  fields: {
    title: { type: "string", required: true },
    url: { type: "string", required: true },
    format: { type: "string", required: false },
    size: { type: "string", required: false },
  },
}));

const CTADetail = defineNestedType(() => ({
  name: "CTADetail",
  fields: {
    label: { type: "string", required: true },
    value: { type: "string", required: true },
    icon: { type: "string", required: false },
    detail: { type: "string", required: false },
  },
}));

const CTAFeature = defineNestedType(() => ({
  name: "CTAFeature",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
  },
}));

const CTAConfig = defineNestedType(() => ({
  name: "CTAConfig",
  fields: {
    badge: { type: "string", required: false },
    tier: { type: "string", required: false },
    details: { type: "list", of: CTADetail, required: false },
    featuresText: { type: "list", of: { type: "string" }, required: false },
    features: { type: "list", of: CTAFeature, required: false },
  },
}));

const ProcessStep = defineNestedType(() => ({
  name: "ProcessStep",
  fields: {
    step: { type: "number", required: false },
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
  },
}));

const DownloadProcess = defineNestedType(() => ({
  name: "DownloadProcess",
  fields: {
    steps: { type: "list", of: ProcessStep, required: false },
  },
}));

const FeatureGridItem = defineNestedType(() => ({
  name: "FeatureGridItem",
  fields: {
    title: { type: "string", required: true },
    icon: { type: "string", required: false },
    content: { type: "string", required: false },
    color: { type: "string", required: false },
    badge: { type: "string", required: false },
  },
}));

const CTAButton = defineNestedType(() => ({
  name: "CTAButton",
  fields: {
    label: { type: "string", required: true },
    href: { type: "string", required: true },
  },
}));

// ------------------------------------------------------------
// Shared fields
// ------------------------------------------------------------

const seoFields = {
  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  ogImage: { type: "string", required: false },
  twitterTitle: { type: "string", required: false },
  twitterDescription: { type: "string", required: false },
  twitterImage: { type: "string", required: false },
} as const;

const coreFields = {
  // "type" can exist as a frontmatter key across doc types
  type: { type: "string", required: false },

  title: { type: "string", required: true },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },

  date: { type: "date", required: false },
  updated: { type: "date", required: false },

  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },

  slug: { type: "string", required: false },
  href: { type: "string", required: false },

  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },

  tags: { type: "list", of: { type: "string" }, required: false },
  theme: { type: "string", required: false },
  category: { type: "string", required: false },

  resourceType: { type: "string", required: false },
  socialCaption: { type: "string", required: false },

  layout: { type: "string", required: false },
  subtitle: { type: "string", required: false },

  canonicalUrl: { type: "string", required: false },
  density: { type: "string", required: false },

  coverImage: { type: "string", required: false },
  featuredImage: { type: "string", required: false },

  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  tier: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false },

  readTime: { type: "string", required: false },

  // Use json for flexible structures
  resources: { type: "json", required: false },
  features: { type: "json", required: false },

  contentOnly: { type: "boolean", required: false },

  published: { type: "boolean", required: false, default: true },

  keyInsights: { type: "list", of: { type: "string" }, required: false },
  authorNote: { type: "string", required: false },

  docKind: { type: "string", required: false },

  // ✅ Robust escape hatch: store any future "one-off" frontmatter
  // without breaking builds when you add fields on a single MDX.
  frontmatter: { type: "json", required: false },

  ...seoFields,
} as const;

// ------------------------------------------------------------
// Document Types
// ------------------------------------------------------------

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,
    downloads: { type: "list", of: DownloadLink, required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "blog/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "blog/", "blog"),
    },
    readTime: {
      type: "string",
      resolve: (doc) => doc.readTime ?? estimateReadTime(safeRawBody(doc)),
    },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.mdx",
  contentType: "mdx",
  fields: { ...coreFields },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "shorts/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "shorts/", "shorts"),
    },
    readTime: {
      type: "string",
      resolve: (doc) => doc.readTime ?? estimateReadTime(safeRawBody(doc)),
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,
    aliases: { type: "list", of: { type: "string" }, required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "books/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "books/", "books"),
    },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "canon/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "canon/", "canon"),
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,

    file: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    fileSize: { type: "string", required: false },

    fileFormat: { type: "string", required: false },
    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },

    format: { type: "string", required: false },
    downloadType: { type: "string", required: false },
    paperFormats: { type: "list", of: { type: "string" }, required: false },

    version: { type: "string", required: false },
    language: { type: "string", required: false },
    aliases: { type: "list", of: { type: "string" }, required: false },

    useLegacyDiagram: { type: "boolean", required: false },
    useProTip: { type: "boolean", required: false },
    useFeatureGrid: { type: "boolean", required: false },
    useDownloadCTA: { type: "boolean", required: false },

    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },

    featureGridColumns: { type: "number", required: false },
    featureGridItems: { type: "list", of: FeatureGridItem, required: false },

    ctaConfig: { type: "nested", of: CTAConfig, required: false },
    downloadProcess: { type: "nested", of: DownloadProcess, required: false },

    ctaPrimary: { type: "nested", of: CTAButton, required: false },
    ctaSecondary: { type: "nested", of: CTAButton, required: false },

    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    related: { type: "list", of: { type: "string" }, required: false },

    // STRATEGIC ADDITION: Explicitly authorized 'download' object
    download: { type: "nested", of: DownloadMeta, required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "downloads/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "downloads/", "downloads"),
    },
    readTime: {
      type: "string",
      resolve: (doc) => doc.readTime ?? estimateReadTime(safeRawBody(doc)),
    },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    startDate: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "events/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "events/", "events"),
    },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.mdx",
  contentType: "mdx",
  fields: { ...coreFields },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "prints/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "prints/", "prints"),
    },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...coreFields, downloadUrl: { type: "string", required: false } },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "resources/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "resources/", "resources"),
    },
    readTime: {
      type: "string",
      resolve: (doc) => doc.readTime ?? estimateReadTime(safeRawBody(doc)),
    },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.mdx",
  contentType: "mdx",
  fields: {
    ...coreFields,
    version: { type: "string", required: false },
    strategyType: { type: "string", required: false },
    industry: { type: "string", required: false },
    region: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc.slug ?? defaultSlugFrom(doc, "strategy/"),
    },
    href: {
      type: "string",
      resolve: (doc) => doc.href ?? defaultHrefFrom(doc, "strategy/", "strategy"),
    },
    readTime: {
      type: "string",
      resolve: (doc) => doc.readTime ?? estimateReadTime(safeRawBody(doc)),
    },
  },
}));

// ------------------------------------------------------------
// Contentlayer Configuration
// ------------------------------------------------------------

export default makeSource({
  contentDirPath: "content",

  // ✅ Hard boundary: only these folders are scanned, period.
  contentDirInclude: [
    "blog",
    "shorts",
    "books",
    "canon",
    "downloads",
    "events",
    "prints",
    "resources",
    "strategy",
  ],

  // ✅ Robust excludes with Windows-specific fixes:
  contentDirExclude: [
    // Standard excludes
    "node_modules",
    ".git",
    ".next",
    ".contentlayer",
    "_templates",

    // absolutely never
    "public",
    "assets",
    "static",
    "uploads",

    // common junk / backups
    "**/*BACKUP*/**",
    "**/*.bak",
    "**/*.tmp",
    "**/*.swp",
    "**/.DS_Store",

    // Windows-specific file permission fixes
    ...getWindowsIgnoredPaths(),
  ],

  documentTypes: [Post, Short, Book, Canon, Download, Event, Print, Resource, Strategy],

  disableImportAliasWarning: true,

  // MDX configuration with mutable arrays (not read-only)
  mdx: {
  remarkPlugins: [] as any[],
  rehypePlugins: [] as any[],
},

  onSuccess: async (importData) => {
    try {
      const data = await importData();
      const allDocs = (data as any)?.allDocuments;
      const count = Array.isArray(allDocs) ? allDocs.length : 0;
      
      // Log Windows-specific message if applicable
      if (IS_WINDOWS) {
        console.log(`✅ Contentlayer build complete on Windows. Documents: ${count}`);
        console.log(`⚠  Windows file permission workarounds are active`);
      } else {
        console.log(`✅ Contentlayer build complete. Documents: ${count}`);
      }
    } catch (err) {
      console.error("❌ Contentlayer onSuccess failed:", err);
    }
  },
});